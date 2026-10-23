//! Storage layer for Examoffice
//! SQLite database for history, settings, and user data

use crate::engine::{TypingResult, TypingStats, ExamPaper};
use crate::crypto::EncryptedData;
use rusqlite::{params, Connection, OptionalExtension, Result as SqliteResult};
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum StorageError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("Pool error: {0}")]
    Pool(#[from] r2d2::Error),
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Migration error: {0}")]
    Migration(String),
}

pub type StoragePool = Pool<SqliteConnectionManager>;

/// Initialize database connection pool
pub fn init_pool(db_path: &PathBuf) -> Result<StoragePool, StorageError> {
    let manager = SqliteConnectionManager::file(db_path);
    let pool = Pool::new(manager)?;
    
    // Run migrations
    let conn = pool.get()?;
    migrate(&conn)?;
    
    Ok(pool)
}

/// Run database migrations
fn migrate(conn: &Connection) -> Result<(), StorageError> {
    // Create migrations table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Migration 1: Core tables
    if !migration_applied(conn, 1)? {
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS typing_results (
                id TEXT PRIMARY KEY,
                paper_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                duration_ms INTEGER NOT NULL,
                gross_wpm REAL NOT NULL,
                net_wpm REAL NOT NULL,
                accuracy REAL NOT NULL,
                total_keystrokes INTEGER NOT NULL,
                correct_keystrokes INTEGER NOT NULL,
                errors INTEGER NOT NULL,
                heatmap TEXT NOT NULL,
                keystroke_log TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_typing_results_paper_id ON typing_results(paper_id);
            CREATE INDEX IF NOT EXISTS idx_typing_results_timestamp ON typing_results(timestamp);

            CREATE TABLE IF NOT EXISTS exam_papers (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                language TEXT NOT NULL,
                paper_type TEXT NOT NULL,
                author TEXT NOT NULL,
                license TEXT NOT NULL,
                tags TEXT NOT NULL,
                version TEXT NOT NULL,
                source_url TEXT,
                paper_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_papers (
                id TEXT PRIMARY KEY,
                paper_id TEXT NOT NULL,
                custom_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(paper_id) REFERENCES exam_papers(id)
            );
            "#,
        )?;
        mark_migration_applied(conn, 1, "core_tables")?;
    }

    // Migration 2: Add formatting results table
    if !migration_applied(conn, 2)? {
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS formatting_results (
                id TEXT PRIMARY KEY,
                paper_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                duration_ms INTEGER NOT NULL,
                score REAL NOT NULL,
                max_score REAL NOT NULL,
                errors TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_formatting_results_paper_id ON formatting_results(paper_id);
            "#,
        )?;
        mark_migration_applied(conn, 2, "formatting_results")?;
    }

    Ok(())
}

fn migration_applied(conn: &Connection, id: i32) -> Result<bool, StorageError> {
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM migrations WHERE id = ?1",
        params![id],
        |row| row.get(0),
    )?;
    Ok(count > 0)
}

fn mark_migration_applied(conn: &Connection, id: i32, name: &str) -> Result<(), StorageError> {
    conn.execute(
        "INSERT INTO migrations (id, name) VALUES (?1, ?2)",
        params![id, name],
    )?;
    Ok(())
}

/// High-level storage interface
pub struct Storage {
    pool: StoragePool,
}

impl Storage {
    pub fn new(pool: StoragePool) -> Self {
        Self { pool }
    }

    /// Save a typing result
    pub fn save_typing_result(&self, result: &TypingResult) -> Result<(), StorageError> {
        let conn = self.pool.get()?;
        let id = uuid::Uuid::new_v4().to_string();
        
        let heatmap_json = serde_json::to_string(&result.heatmap)?;
        let keystroke_log_json = serde_json::to_string(&result.keystroke_log)?;
        
        conn.execute(
            r#"
            INSERT INTO typing_results (
                id, paper_id, timestamp, duration_ms, gross_wpm, net_wpm,
                accuracy, total_keystrokes, correct_keystrokes, errors,
                heatmap, keystroke_log
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
            "#,
            params![
                id,
                result.paper_id,
                result.timestamp.to_rfc3339(),
                result.duration_ms as i64,
                result.stats.gross_wpm,
                result.stats.net_wpm,
                result.stats.accuracy,
                result.stats.total_keystrokes as i64,
                result.stats.correct_keystrokes as i64,
                result.stats.errors as i64,
                heatmap_json,
                keystroke_log_json,
            ],
        )?;
        
        Ok(())
    }

    /// Get typing history for a paper
    pub fn get_typing_history(&self, paper_id: &str, limit: usize) -> Result<Vec<TypingResult>, StorageError> {
        let conn = self.pool.get()?;
        let mut stmt = conn.prepare(
            r#"
            SELECT id, paper_id, timestamp, duration_ms, gross_wpm, net_wpm,
                   accuracy, total_keystrokes, correct_keystrokes, errors,
                   heatmap, keystroke_log
            FROM typing_results
            WHERE paper_id = ?1
            ORDER BY timestamp DESC
            LIMIT ?2
            "#,
        )?;
        
        let results = stmt.query_map(params![paper_id, limit as i64], |row| {
            Ok(TypingResult {
                paper_id: row.get(1)?,
                timestamp: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(2)?)
                    .map(|dt| dt.with_timezone(&chrono::Utc))
                    .map_err(|_| rusqlite::Error::InvalidColumnType(2, "timestamp".into(), rusqlite::types::Type::Text))?,
                duration_ms: row.get(3)?,
                stats: TypingStats {
                    gross_wpm: row.get(4)?,
                    net_wpm: row.get(5)?,
                    accuracy: row.get(6)?,
                    total_keystrokes: row.get(7)?,
                    correct_keystrokes: row.get(8)?,
                    errors: row.get(9)?,
                    ..Default::default()
                },
                heatmap: serde_json::from_str(&row.get::<_, String>(10)?).unwrap_or_default(),
                keystroke_log: serde_json::from_str(&row.get::<_, String>(11)?).unwrap_or_default(),
            })
        })?;
        
        let mut history = Vec::new();
        for result in results {
            history.push(result?);
        }
        
        Ok(history)
    }

    /// Get all typing history
    pub fn get_all_history(&self, limit: usize) -> Result<Vec<TypingResult>, StorageError> {
        let conn = self.pool.get()?;
        let mut stmt = conn.prepare(
            r#"
            SELECT id, paper_id, timestamp, duration_ms, gross_wpm, net_wpm,
                   accuracy, total_keystrokes, correct_keystrokes, errors,
                   heatmap, keystroke_log
            FROM typing_results
            ORDER BY timestamp DESC
            LIMIT ?1
            "#,
        )?;
        
        let results = stmt.query_map(params![limit as i64], |row| {
            Ok(TypingResult {
                paper_id: row.get(1)?,
                timestamp: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(2)?)
                    .map(|dt| dt.with_timezone(&chrono::Utc))
                    .map_err(|_| rusqlite::Error::InvalidColumnType(2, "timestamp".into(), rusqlite::types::Type::Text))?,
                duration_ms: row.get(3)?,
                stats: TypingStats {
                    gross_wpm: row.get(4)?,
                    net_wpm: row.get(5)?,
                    accuracy: row.get(6)?,
                    total_keystrokes: row.get(7)?,
                    correct_keystrokes: row.get(8)?,
                    errors: row.get(9)?,
                    ..Default::default()
                },
                heatmap: serde_json::from_str(&row.get::<_, String>(10)?).unwrap_or_default(),
                keystroke_log: serde_json::from_str(&row.get::<_, String>(11)?).unwrap_or_default(),
            })
        })?;
        
        let mut history = Vec::new();
        for result in results {
            history.push(result?);
        }
        
        Ok(history)
    }

    /// Save an exam paper
    pub fn save_exam_paper(&self, paper: &ExamPaper) -> Result<(), StorageError> {
        let conn = self.pool.get()?;
        let paper_json = serde_json::to_string(paper)?;
        let tags_json = serde_json::to_string(&paper.metadata.tags)?;
        
        conn.execute(
            r#"
            INSERT OR REPLACE INTO exam_papers (
                id, title, description, language, paper_type, author, license,
                tags, version, source_url, paper_json, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, CURRENT_TIMESTAMP)
            "#,
            params![
                paper.metadata.id,
                paper.metadata.title,
                paper.metadata.description,
                serde_json::to_string(&paper.metadata.language)?,
                serde_json::to_string(&paper.metadata.paper_type)?,
                paper.metadata.author,
                paper.metadata.license,
                tags_json,
                paper.metadata.version,
                paper.metadata.source_url,
                paper_json,
            ],
        )?;
        
        Ok(())
    }

    /// Get an exam paper by ID
    pub fn get_exam_paper(&self, id: &str) -> Result<ExamPaper, StorageError> {
        let conn = self.pool.get()?;
        let paper_json: String = conn.query_row(
            "SELECT paper_json FROM exam_papers WHERE id = ?1",
            params![id],
            |row| row.get(0),
        )?;
        
        let paper: ExamPaper = serde_json::from_str(&paper_json)?;
        Ok(paper)
    }

    /// List all exam papers
    pub fn list_exam_papers(&self) -> Result<Vec<ExamPaper>, StorageError> {
        let conn = self.pool.get()?;
        let mut stmt = conn.prepare(
            "SELECT paper_json FROM exam_papers ORDER BY title"
        )?;
        
        let papers = stmt.query_map([], |row| {
            let paper_json: String = row.get(0)?;
            serde_json::from_str(&paper_json).map_err(|_| rusqlite::Error::InvalidColumnType(0, "paper_json".into(), rusqlite::types::Type::Text))
        })?;
        
        let mut result = Vec::new();
        for paper in papers {
            result.push(paper?);
        }
        
        Ok(result)
    }

    /// Delete an exam paper
    pub fn delete_exam_paper(&self, id: &str) -> Result<(), StorageError> {
        let conn = self.pool.get()?;
        conn.execute("DELETE FROM exam_papers WHERE id = ?1", params![id])?;
        Ok(())
    }

    /// Get a user setting
    pub fn get_setting(&self, key: &str) -> Result<Option<String>, StorageError> {
        let conn = self.pool.get()?;
        let value: Option<String> = conn.query_row(
            "SELECT value FROM user_settings WHERE key = ?1",
            params![key],
            |row| row.get(0),
        ).optional()?;
        Ok(value)
    }

    /// Set a user setting
    pub fn set_setting(&self, key: &str, value: &str) -> Result<(), StorageError> {
        let conn = self.pool.get()?;
        conn.execute(
            "INSERT OR REPLACE INTO user_settings (key, value, updated_at) VALUES (?1, ?2, CURRENT_TIMESTAMP)",
            params![key, value],
        )?;
        Ok(())
    }

    /// Get all settings
    pub fn get_all_settings(&self) -> Result<HashMap<String, String>, StorageError> {
        let conn = self.pool.get()?;
        let mut stmt = conn.prepare("SELECT key, value FROM user_settings")?;
        let rows = stmt.query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?;
        
        let mut settings = HashMap::new();
        for row in rows {
            let (key, value) = row?;
            settings.insert(key, value);
        }
        
        Ok(settings)
    }

    /// Get database statistics
    pub fn get_stats(&self) -> Result<StorageStats, StorageError> {
        let conn = self.pool.get()?;
        
        let total_results: i64 = conn.query_row("SELECT COUNT(*) FROM typing_results", [], |r| r.get(0))?;
        let total_papers: i64 = conn.query_row("SELECT COUNT(*) FROM exam_papers", [], |r| r.get(0))?;
        let avg_wpm: Option<f64> = conn.query_row("SELECT AVG(gross_wpm) FROM typing_results", [], |r| r.get(0)).optional()?;
        let best_wpm: Option<f64> = conn.query_row("SELECT MAX(gross_wpm) FROM typing_results", [], |r| r.get(0)).optional()?;
        
        Ok(StorageStats {
            total_results: total_results as u64,
            total_papers: total_papers as u64,
            average_wpm: avg_wpm.map(|v| v as f32),
            best_wpm: best_wpm.map(|v| v as f32),
        })
    }
}

/// Storage statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageStats {
    pub total_results: u64,
    pub total_papers: u64,
    pub average_wpm: Option<f32>,
    pub best_wpm: Option<f32>,
}

/// Default database path
pub fn default_db_path() -> PathBuf {
    let mut path = directories::ProjectDirs::from("com", "examoffice", "Examoffice")
        .map(|dirs| dirs.data_dir().to_path_buf())
        .unwrap_or_else(|| PathBuf::from("."));
    path.push("examoffice.db");
    path
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_storage_roundtrip() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.db");
        let pool = init_pool(&db_path).unwrap();
        let storage = Storage::new(pool);
        
        // Create a test paper
        let paper = crate::engine::paper::ExamPaper {
            version: 1,
            metadata: crate::engine::paper::PaperMetadata {
                id: "test-paper".to_string(),
                title: "Test Paper".to_string(),
                description: "A test paper".to_string(),
                language: crate::engine::paper::Language::English,
                paper_type: crate::engine::paper::PaperType::Typing,
                author: "Test".to_string(),
                license: "CC0".to_string(),
                tags: vec!["test".to_string()],
                created_at: chrono::Utc::now(),
                updated_at: chrono::Utc::now(),
                version: "1.0".to_string(),
                source_url: None,
            },
            requirements: crate::engine::scoring::ExamRequirements {
                name: "Test".to_string(),
                min_net_wpm: Some(30.0),
                min_accuracy: Some(90.0),
                max_errors: None,
                duration_minutes: Some(5),
                scoring_method: crate::engine::scoring::ScoringMethod::Standard,
            },
            segments: vec![
                crate::engine::paper::PaperSegment {
                    id: "1".to_string(),
                    segment_type: crate::engine::paper::SegmentType::Paragraph,
                    content: "Hello world".to_string(),
                    expected_format: None,
                    marks: Some(10),
                },
            ],
            keyboard_layout: None,
        };
        
        storage.save_exam_paper(&paper).unwrap();
        let retrieved = storage.get_exam_paper("test-paper").unwrap();
        assert_eq!(retrieved.metadata.id, "test-paper");
        
        // Save a typing result
        let result = crate::engine::typing::TypingResult {
            paper_id: "test-paper".to_string(),
            timestamp: chrono::Utc::now(),
            duration_ms: 60000,
            stats: crate::engine::typing::TypingStats {
                total_keystrokes: 100,
                correct_keystrokes: 95,
                errors: 5,
                gross_wpm: 33.0,
                net_wpm: 31.0,
                accuracy: 95.0,
                ..Default::default()
            },
            heatmap: std::collections::HashMap::new(),
            keystroke_log: vec![],
        };
        
        storage.save_typing_result(&result).unwrap();
        let history = storage.get_typing_history("test-paper", 10).unwrap();
        assert_eq!(history.len(), 1);
    }
}