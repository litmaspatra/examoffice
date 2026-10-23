//! Examoffice - Free, open-source typing tutor & exam platform
//! 
//! A modern, cross-platform alternative to proprietary typing software.

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod engine;
mod crypto;
mod fonts;
mod storage;
mod commands;

use engine::*;
use crypto::*;
use fonts::*;
use storage::*;
use commands::*;

fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_window_state::init())
        .setup(|app| {
            // Initialize global state
            let (typing_sessions, font_manager, storage) = init_state(app)
                .map_err(|e| format!("Failed to initialize state: {}", e))?;
            
            app.manage(typing_sessions);
            app.manage(font_manager);
            app.manage(storage);
            
            // Set up window
            if let Some(window) = app.get_webview_window("main") {
                window.set_title("Examoffice - Free Typing Tutor").ok();
            }
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Typing engine
            start_typing_session,
            process_keystroke,
            finish_typing_session,
            get_typing_stats,
            
            // Exam papers
            list_exam_papers,
            get_exam_paper,
            create_exam_paper,
            delete_exam_paper,
            get_builtin_papers,
            
            // History
            get_typing_history,
            get_storage_stats,
            
            // Settings
            get_setting,
            set_setting,
            get_all_settings,
            
            // Crypto
            encrypt_data,
            decrypt_data,
            hash_password_cmd,
            verify_password_cmd,
            sha256_file_cmd,
            
            // Fonts
            load_font,
            list_fonts,
            measure_text,
            
            // Utilities
            get_app_version,
            open_external_url,
            import_paper,
            export_paper,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}