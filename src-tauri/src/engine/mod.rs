//! Examoffice core engine modules

pub mod typing;
pub mod scoring;
pub mod paper;

// Re-exports
pub use typing::{Keystroke, TypingStats, TypingResult, TestConfig, TypingEngine};
pub use scoring::{ScoringMethod, ScoreResult, ExamRequirements, calculate_score, get_exam_requirements};
pub use paper::{PaperType, Language, KeyboardLayout, PaperSegment, SegmentType, FormatSpec, ExamPaper, PaperMetadata, builtin};