//! Core typing engine for Examoffice
//! Handles keystroke processing, real-time stats, and text comparison

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use unicode_segmentation::UnicodeSegmentation;

/// A single keystroke event with timing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Keystroke {
    pub char: String,
    pub correct: bool,
    pub timestamp_ms: u64,
    pub latency_ms: u64,
}

/// Real-time typing statistics
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TypingStats {
    pub total_keystrokes: u32,
    pub correct_keystrokes: u32,
    pub errors: u32,
    pub gross_wpm: f32,
    pub net_wpm: f32,
    pub accuracy: f32,
    pub elapsed_ms: u64,
    pub current_streak: u32,
    pub best_streak: u32,
}

/// Complete typing session result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TypingResult {
    pub paper_id: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub duration_ms: u64,
    pub stats: TypingStats,
    pub heatmap: HashMap<String, u32>,
    pub keystroke_log: Vec<Keystroke>,
}

/// Configuration for a typing test
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestConfig {
    pub duration_seconds: Option<u32>,  // None = untimed
    pub allow_backspace: bool,
    pub require_exact_match: bool,
    pub language: String,
    pub layout: String,
}

/// Internal state of the typing engine
#[derive(Debug)]
pub struct TypingEngine {
    target_text: String,
    target_graphemes: Vec<String>,
    config: TestConfig,
    stats: TypingStats,
    heatmap: HashMap<String, u32>,
    keystroke_log: Vec<Keystroke>,
    current_position: usize,
    start_time: Option<std::time::Instant>,
    last_keystroke_time: Option<std::time::Instant>,
    finished: bool,
}

impl TypingEngine {
    pub fn new(target_text: String, config: TestConfig) -> Self {
        let target_graphemes: Vec<String> = target_text.graphemes(true).map(|s| s.to_string()).collect();
        Self {
            target_text,
            target_graphemes,
            config,
            stats: TypingStats::default(),
            heatmap: HashMap::new(),
            keystroke_log: Vec::new(),
            current_position: 0,
            start_time: None,
            last_keystroke_time: None,
            finished: false,
        }
    }

    /// Process a keystroke and return updated stats
    pub fn process_keystroke(&mut self, char: &str) -> TypingStats {
        if self.finished {
            return self.stats.clone();
        }

        let now = std::time::Instant::now();
        
        // Start timer on first keystroke
        if self.start_time.is_none() {
            self.start_time = Some(now);
        }

        let latency_ms = self.last_keystroke_time.map_or(0, |t| t.elapsed().as_millis() as u64);
        self.last_keystroke_time = Some(now);

        // Handle backspace
        if char == "\u{8}" || char == "\u{7f}" {
            if self.config.allow_backspace && self.current_position > 0 {
                self.current_position -= 1;
                // Remove last keystroke from log
                if let Some(last) = self.keystroke_log.pop() {
                    if last.correct {
                        self.stats.correct_keystrokes = self.stats.correct_keystrokes.saturating_sub(1);
                    } else {
                        self.stats.errors = self.stats.errors.saturating_sub(1);
                    }
                    self.stats.total_keystrokes = self.stats.total_keystrokes.saturating_sub(1);
                }
                self.recalculate_stats();
            }
            return self.stats.clone();
        }

        // Check if we're at the end
        if self.current_position >= self.target_graphemes.len() {
            self.finished = true;
            return self.stats.clone();
        }

        let expected = &self.target_graphemes[self.current_position];
        let correct = char == expected;

        // Record keystroke
        let keystroke = Keystroke {
            char: char.to_string(),
            correct,
            timestamp_ms: now.elapsed().as_millis() as u64,
            latency_ms,
        };
        self.keystroke_log.push(keystroke);

        // Update stats
        self.stats.total_keystrokes += 1;
        if correct {
            self.stats.correct_keystrokes += 1;
            self.stats.current_streak += 1;
            self.stats.best_streak = self.stats.best_streak.max(self.stats.current_streak);
        } else {
            self.stats.errors += 1;
            self.stats.current_streak = 0;
            // Update heatmap for the expected character
            *self.heatmap.entry(expected.clone()).or_insert(0) += 1;
        }

        self.current_position += 1;
        self.recalculate_stats();

        // Check if test is complete (timed or reached end)
        if let Some(duration) = self.config.duration_seconds {
            if let Some(start) = self.start_time {
                if start.elapsed().as_secs() >= duration as u64 {
                    self.finished = true;
                }
            }
        } else if self.current_position >= self.target_graphemes.len() {
            self.finished = true;
        }

        self.stats.clone()
    }

    fn recalculate_stats(&mut self) {
        if let Some(start) = self.start_time {
            self.stats.elapsed_ms = start.elapsed().as_millis() as u64;
            let minutes = self.stats.elapsed_ms as f32 / 60000.0;
            if minutes > 0.0 {
                // Gross WPM = (total chars / 5) / minutes
                self.stats.gross_wpm = (self.stats.total_keystrokes as f32 / 5.0) / minutes;
                // Net WPM = Gross WPM - (errors * 2) / minutes
                self.stats.net_wpm = self.stats.gross_wpm - (self.stats.errors as f32 * 2.0) / minutes;
            }
        }

        if self.stats.total_keystrokes > 0 {
            self.stats.accuracy = (self.stats.correct_keystrokes as f32 / self.stats.total_keystrokes as f32) * 100.0;
        } else {
            self.stats.accuracy = 100.0;
        }
    }

    pub fn get_stats(&self) -> TypingStats {
        self.stats.clone()
    }

    pub fn get_heatmap(&self) -> HashMap<String, u32> {
        self.heatmap.clone()
    }

    pub fn get_keystroke_log(&self) -> Vec<Keystroke> {
        self.keystroke_log.clone()
    }

    pub fn is_finished(&self) -> bool {
        self.finished
    }

    pub fn get_progress(&self) -> f32 {
        if self.target_graphemes.is_empty() {
            1.0
        } else {
            self.current_position as f32 / self.target_graphemes.len() as f32
        }
    }

    pub fn get_target_text(&self) -> &str {
        &self.target_text
    }

    pub fn get_current_position(&self) -> usize {
        self.current_position
    }

    pub fn get_target_graphemes(&self) -> &[String] {
        &self.target_graphemes
    }

    /// Finalize and return complete result
    pub fn finalize(mut self, paper_id: String) -> TypingResult {
        self.finished = true;
        self.recalculate_stats();
        
        TypingResult {
            paper_id,
            timestamp: chrono::Utc::now(),
            duration_ms: self.stats.elapsed_ms,
            stats: self.stats,
            heatmap: self.heatmap,
            keystroke_log: self.keystroke_log,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_typing() {
        let config = TestConfig {
            duration_seconds: None,
            allow_backspace: true,
            require_exact_match: true,
            language: "en".to_string(),
            layout: "qwerty".to_string(),
        };
        let mut engine = TypingEngine::new("hello world".to_string(), config);
        
        engine.process_keystroke("h");
        engine.process_keystroke("e");
        engine.process_keystroke("l");
        engine.process_keystroke("l");
        engine.process_keystroke("o");
        engine.process_keystroke(" ");
        engine.process_keystroke("w");
        engine.process_keystroke("o");
        engine.process_keystroke("r");
        engine.process_keystroke("l");
        engine.process_keystroke("d");
        
        let stats = engine.get_stats();
        assert_eq!(stats.total_keystrokes, 11);
        assert_eq!(stats.correct_keystrokes, 11);
        assert_eq!(stats.errors, 0);
        assert_eq!(stats.accuracy, 100.0);
    }

    #[test]
    fn test_backspace() {
        let config = TestConfig {
            duration_seconds: None,
            allow_backspace: true,
            require_exact_match: true,
            language: "en".to_string(),
            layout: "qwerty".to_string(),
        };
        let mut engine = TypingEngine::new("hello".to_string(), config);
        
        engine.process_keystroke("h");
        engine.process_keystroke("e");
        engine.process_keystroke("x"); // error
        engine.process_keystroke("\u{8}"); // backspace
        engine.process_keystroke("l");
        engine.process_keystroke("l");
        engine.process_keystroke("o");
        
        let stats = engine.get_stats();
        assert_eq!(stats.total_keystrokes, 5); // h, e, l, l, o (backspace and x removed)
        assert_eq!(stats.correct_keystrokes, 5);
        assert_eq!(stats.errors, 0);
    }

    #[test]
    fn test_hindi_graphemes() {
        let config = TestConfig {
            duration_seconds: None,
            allow_backspace: true,
            require_exact_match: true,
            language: "hi".to_string(),
            layout: "inscript".to_string(),
        };
        // "नमस्ते" - 4 graphemes (न, म, स, ्, ते) but Unicode segmentation handles conjuncts
        let mut engine = TypingEngine::new("नमस्ते".to_string(), config);
        
        engine.process_keystroke("न");
        engine.process_keystroke("म");
        engine.process_keystroke("स");
        engine.process_keystroke("्");
        engine.process_keystroke("त");
        engine.process_keystroke("े");
        
        let stats = engine.get_stats();
        assert_eq!(stats.total_keystrokes, 6);
        assert_eq!(stats.correct_keystrokes, 6);
    }
}