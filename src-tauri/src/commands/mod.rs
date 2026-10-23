//! Tauri command handlers for Examoffice
//! Exposes Rust functionality to the frontend

use crate::engine::{
    TestConfig, TypingEngine, TypingResult, ExamPaper, Language, PaperType,
    builtin, ScoringMethod, ExamRequirements, get_exam_requirements,
};
use crate::crypto::{encrypt, decrypt, EncryptedData, obfuscate, deobfuscate, hash_password, verify_password, sha256_file};
use crate::fonts::{FontManager, builtin as font_builtin};
use crate::storage::{Storage, default_db_path, StorageStats};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{command, AppHandle, Manager, State};

// Global state for active typing sessions
type TypingSessions = Arc<Mutex<HashMap<String, TypingEngine>>>;
type FontManagerState = Arc<Mutex<FontManager>>;
type StorageState = Arc<Storage>;

/// Initialize app state
pub fn init_state(app: &AppHandle) -> Result<(TypingSessions, FontManagerState, StorageState), String> {
    let typing_sessions = Arc::new(Mutex::new(HashMap::new()));
    
    let font_manager = FontManager::new().map_err(|e| e.to_string())?;
    let font_manager_state = Arc::new(Mutex::new(font_manager));
    
    let db_path = default_db_path();
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let pool = crate::storage::init_pool(&db_path).map_err(|e| e.to_string())?;
    let storage = Arc::new(Storage::new(pool));
    
    // Load built-in papers
    for paper in builtin::all_builtin() {
        let _ = storage.save_exam_paper(&paper);
    }
    
    Ok((typing_sessions, font_manager_state, storage))
}

// ============================================================================
// Typing Engine Commands
// ============================================================================

#[derive(Deserialize)]
struct StartTypingRequest {
    session_id: String,
    paper_id: String,
    config: TestConfig,
}

#[command]
async fn start_typing_session(
    request: StartTypingRequest,
    sessions: State<'_, TypingSessions>,
    storage: State<'_, StorageState>,
) -> Result<TypingResult, String> {
    let paper = storage.get_exam_paper(&request.paper_id)
        .map_err(|e| e.to_string())?;
    
    let text = paper.get_full_text();
    let engine = TypingEngine::new(text, request.config);
    
    sessions.lock().unwrap().insert(request.session_id.clone(), engine);
    
    // Return initial state
    Ok(TypingResult {
        paper_id: request.paper_id,
        timestamp: chrono::Utc::now(),
        duration_ms: 0,
        stats: TypingResult::default().stats, // Will be empty
        heatmap: HashMap::new(),
        keystroke_log: Vec::new(),
    })
}

#[derive(Deserialize)]
struct KeystrokeRequest {
    session_id: String,
    char: String,
}

#[command]
async fn process_keystroke(
    request: KeystrokeRequest,
    sessions: State<'_, TypingSessions>,
) -> Result<crate::engine::TypingStats, String> {
    let mut sessions = sessions.lock().unwrap();
    let engine = sessions.get_mut(&request.session_id)
        .ok_or("Session not found")?;
    
    let stats = engine.process_keystroke(&request.char);
    Ok(stats)
}

#[derive(Deserialize)]
struct FinishTypingRequest {
    session_id: String,
}

#[command]
async fn finish_typing_session(
    request: FinishTypingRequest,
    sessions: State<'_, TypingSessions>,
    storage: State<'_, StorageState>,
) -> Result<TypingResult, String> {
    let mut sessions = sessions.lock().unwrap();
    let engine = sessions.remove(&request.session_id)
        .ok_or("Session not found")?;
    
    let paper_id = "unknown".to_string(); // Would need to track this
    let result = engine.finalize(paper_id);
    
    storage.save_typing_result(&result).map_err(|e| e.to_string())?;
    
    Ok(result)
}

#[command]
async fn get_typing_stats(
    session_id: String,
    sessions: State<'_, TypingSessions>,
) -> Result<crate::engine::TypingStats, String> {
    let sessions = sessions.lock().unwrap();
    let engine = sessions.get(&session_id)
        .ok_or("Session not found")?;
    
    Ok(engine.get_stats())
}

// ============================================================================
// Exam Paper Commands
// ============================================================================

#[command]
async fn list_exam_papers(
    storage: State<'_, StorageState>,
) -> Result<Vec<ExamPaper>, String> {
    storage.list_exam_papers().map_err(|e| e.to_string())
}

#[command]
async fn get_exam_paper(
    paper_id: String,
    storage: State<'_, StorageState>,
) -> Result<ExamPaper, String> {
    storage.get_exam_paper(&paper_id).map_err(|e| e.to_string())
}

#[derive(Deserialize)]
struct CreatePaperRequest {
    paper: ExamPaper,
}

#[command]
async fn create_exam_paper(
    request: CreatePaperRequest,
    storage: State<'_, StorageState>,
) -> Result<(), String> {
    storage.save_exam_paper(&request.paper).map_err(|e| e.to_string())
}

#[command]
async fn delete_exam_paper(
    paper_id: String,
    storage: State<'_, StorageState>,
) -> Result<(), String> {
    storage.delete_exam_paper(&paper_id).map_err(|e| e.to_string())
}

#[command]
async fn get_builtin_papers() -> Result<Vec<ExamPaper>, String> {
    Ok(builtin::all_builtin())
}

// ============================================================================
// History Commands
// ============================================================================

#[command]
async fn get_typing_history(
    paper_id: Option<String>,
    limit: Option<usize>,
    storage: State<'_, StorageState>,
) -> Result<Vec<TypingResult>, String> {
    match paper_id {
        Some(id) => storage.get_typing_history(&id, limit.unwrap_or(50)).map_err(|e| e.to_string()),
        None => storage.get_all_history(limit.unwrap_or(50)).map_err(|e| e.to_string()),
    }
}

#[command]
async fn get_storage_stats(
    storage: State<'_, StorageState>,
) -> Result<StorageStats, String> {
    storage.get_stats().map_err(|e| e.to_string())
}

// ============================================================================
// Settings Commands
// ============================================================================

#[command]
async fn get_setting(
    key: String,
    storage: State<'_, StorageState>,
) -> Result<Option<String>, String> {
    storage.get_setting(&key).map_err(|e| e.to_string())
}

#[command]
async fn set_setting(
    key: String,
    value: String,
    storage: State<'_, StorageState>,
) -> Result<(), String> {
    storage.set_setting(&key, &value).map_err(|e| e.to_string())
}

#[command]
async fn get_all_settings(
    storage: State<'_, StorageState>,
) -> Result<HashMap<String, String>, String> {
    storage.get_all_settings().map_err(|e| e.to_string())
}

// ============================================================================
// Crypto Commands
// ============================================================================

#[derive(Deserialize)]
struct EncryptRequest {
    data: String,
    password: String,
}

#[command]
async fn encrypt_data(
    request: EncryptRequest,
) -> Result<EncryptedData, String> {
    encrypt(request.data.as_bytes(), &request.password).map_err(|e| e.to_string())
}

#[derive(Deserialize)]
struct DecryptRequest {
    encrypted: EncryptedData,
    password: String,
}

#[command]
async fn decrypt_data(
    request: DecryptRequest,
) -> Result<String, String> {
    let bytes = decrypt(&request.encrypted, &request.password).map_err(|e| e.to_string())?;
    String::from_utf8(bytes).map_err(|e| e.to_string())
}

#[derive(Deserialize)]
struct HashPasswordRequest {
    password: String,
}

#[command]
async fn hash_password_cmd(
    request: HashPasswordRequest,
) -> Result<String, String> {
    crate::crypto::hash_password(&request.password).map_err(|e| e.to_string())
}

#[derive(Deserialize)]
struct VerifyPasswordRequest {
    password: String,
    hash: String,
}

#[command]
async fn verify_password_cmd(
    request: VerifyPasswordRequest,
) -> Result<bool, String> {
    crate::crypto::verify_password(&request.password, &request.hash).map_err(|e| e.to_string())
}

#[command]
async fn sha256_file_cmd(
    path: String,
) -> Result<String, String> {
    let hash = sha256_file(&PathBuf::from(path)).map_err(|e| e.to_string())?;
    Ok(hex::encode(hash))
}

// ============================================================================
// Font Commands
// ============================================================================

#[derive(Deserialize)]
struct LoadFontRequest {
    name: String,
    path: String,
}

#[command]
async fn load_font(
    request: LoadFontRequest,
    font_manager: State<'_, FontManagerState>,
) -> Result<(), String> {
    let mut fm = font_manager.lock().unwrap();
    fm.load_font(&request.name, &PathBuf::from(request.path)).map_err(|e| e.to_string())
}

#[command]
async fn list_fonts(
    font_manager: State<'_, FontManagerState>,
) -> Result<Vec<String>, String> {
    let fm = font_manager.lock().unwrap();
    Ok(fm.font_names())
}

#[command]
async fn measure_text(
    font_name: String,
    text: String,
    size: f32,
    font_manager: State<'_, FontManagerState>,
) -> Result<f32, String> {
    let fm = font_manager.lock().unwrap();
    fm.measure_text(&font_name, &text, size).map_err(|e| e.to_string())
}

// ============================================================================
// Utility Commands
// ============================================================================

#[command]
async fn get_app_version() -> Result<String, String> {
    Ok(env!("CARGO_PKG_VERSION").to_string())
}

#[command]
async fn open_external_url(url: String) -> Result<(), String> {
    tauri::plugin::opener::open_url(&url, None::<&str>).map_err(|e| e.to_string())
}

#[derive(Deserialize)]
struct ImportPaperRequest {
    file_path: String,
}

#[command]
async fn import_paper(
    request: ImportPaperRequest,
    storage: State<'_, StorageState>,
) -> Result<ExamPaper, String> {
    // For now, just return a placeholder
    // TODO: Implement actual import from .docx, .json, etc.
    Err("Import not yet implemented".to_string())
}

#[derive(Deserialize)]
struct ExportPaperRequest {
    paper_id: String,
    format: String, // "json" | "docx"
}

#[command]
async fn export_paper(
    request: ExportPaperRequest,
    storage: State<'_, StorageState>,
) -> Result<String, String> {
    let paper = storage.get_exam_paper(&request.paper_id).map_err(|e| e.to_string())?;
    
    match request.format.as_str() {
        "json" => serde_json::to_string_pretty(&paper).map_err(|e| e.to_string()),
        _ => Err("Unsupported format".to_string()),
    }
}