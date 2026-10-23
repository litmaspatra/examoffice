//! Exam paper format and parsing

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::engine::scoring::ExamRequirements;

/// Supported exam paper types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PaperType {
    /// Simple typing test - just type the given text
    Typing,
    /// Letter formatting - format a document according to rules
    Formatting,
    /// Code typing - type code with syntax highlighting
    Code,
    /// Mixed - multiple sections
    Mixed,
}

/// Language and keyboard layout
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum Language {
    English,
    Hindi,
    Marathi,
    Gujarati,
    Punjabi,
    Tamil,
    Telugu,
    Kannada,
    Malayalam,
    Bengali,
    Oriya,
    Assamese,
    Urdu,
    Custom(String),
}

impl Language {
    pub fn default_font(&self) -> &'static str {
        match self {
            Language::English => "JetBrains Mono",
            Language::Hindi => "Noto Sans Devanagari",
            Language::Marathi => "Noto Sans Devanagari",
            Language::Gujarati => "Noto Sans Gujarati",
            Language::Punjabi => "Noto Sans Gurmukhi",
            Language::Tamil => "Noto Sans Tamil",
            Language::Telugu => "Noto Sans Telugu",
            Language::Kannada => "Noto Sans Kannada",
            Language::Malayalam => "Noto Sans Malayalam",
            Language::Bengali => "Noto Sans Bengali",
            Language::Oriya => "Noto Sans Oriya",
            Language::Assamese => "Noto Sans Bengali", // Same script
            Language::Urdu => "Noto Nastaliq Urdu",
            Language::Custom(_) => "Noto Sans",
        }
    }

    pub fn default_layout(&self) -> &'static str {
        match self {
            Language::English => "qwerty",
            Language::Hindi => "inscript",
            Language::Marathi => "inscript",
            Language::Gujarati => "gujarati",
            Language::Punjabi => "gurmukhi",
            Language::Tamil => "tamil99",
            Language::Telugu => "telugu",
            Language::Kannada => "kannada",
            Language::Malayalam => "malayalam",
            Language::Bengali => "probhat",
            Language::Oriya => "oriya",
            Language::Assamese => "assamese",
            Language::Urdu => "urdu",
            Language::Custom(_) => "qwerty",
        }
    }
}

/// Keyboard layout mapping
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyboardLayout {
    pub name: String,
    pub display_name: String,
    pub language: Language,
    pub key_map: HashMap<String, String>, // physical key -> output char
    pub shift_map: HashMap<String, String>, // shifted key -> output char
    pub altgr_map: Option<HashMap<String, String>>,
}

/// A single paragraph/line in the exam
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaperSegment {
    pub id: String,
    pub segment_type: SegmentType,
    pub content: String,
    pub expected_format: Option<FormatSpec>,
    pub marks: Option<u32>,
}

/// Segment type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SegmentType {
    Paragraph,
    Heading,
    Table,
    List,
    Signature,
    Date,
    Reference,
    Subject,
    Body,
    Closing,
    Enclosure,
    CopyTo,
}

/// Format specification for formatting exams
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormatSpec {
    pub font_family: Option<String>,
    pub font_size: Option<f32>,
    pub font_weight: Option<String>, // normal, bold
    pub font_style: Option<String>, // normal, italic
    pub text_align: Option<String>, // left, center, right, justify
    pub text_decoration: Option<String>, // none, underline
    pub line_height: Option<f32>,
    pub margin: Option<String>,
    pub indent: Option<f32>,
}

/// Complete exam paper definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExamPaper {
    pub version: u32,
    pub metadata: PaperMetadata,
    pub requirements: ExamRequirements,
    pub segments: Vec<PaperSegment>,
    pub keyboard_layout: Option<KeyboardLayout>,
}

/// Paper metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaperMetadata {
    pub id: String,
    pub title: String,
    pub description: String,
    pub language: Language,
    pub paper_type: PaperType,
    pub author: String,
    pub license: String,
    pub tags: Vec<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub version: String,
    pub source_url: Option<String>,
}

impl ExamPaper {
    /// Get full text for typing tests (concatenate all segments)
    pub fn get_full_text(&self) -> String {
        self.segments
            .iter()
            .map(|s| s.content.as_str())
            .collect::<Vec<_>>()
            .join("\n\n")
    }

    /// Get total marks
    pub fn total_marks(&self) -> u32 {
        self.segments.iter().filter_map(|s| s.marks).sum()
    }

    /// Validate paper structure
    pub fn validate(&self) -> Result<(), String> {
        if self.segments.is_empty() {
            return Err("Paper must have at least one segment".to_string());
        }
        if self.metadata.id.is_empty() {
            return Err("Paper must have an ID".to_string());
        }
        Ok(())
    }
}

/// Built-in exam papers (embedded at compile time)
pub mod builtin {
    use super::*;

    pub fn cpct_hindi_practice() -> ExamPaper {
        ExamPaper {
            version: 1,
            metadata: PaperMetadata {
                id: "cpct-hindi-practice-1".to_string(),
                title: "CPCT Hindi Typing Practice - Set 1".to_string(),
                description: "Practice paper for CPCT Hindi typing test".to_string(),
                language: Language::Hindi,
                paper_type: PaperType::Typing,
                author: "Examoffice Community".to_string(),
                license: "CC0-1.0".to_string(),
                tags: vec!["cpct".to_string(), "hindi".to_string(), "practice".to_string()],
                created_at: chrono::Utc::now(),
                updated_at: chrono::Utc::now(),
                version: "1.0".to_string(),
                source_url: None,
            },
            requirements: get_exam_requirements("cpct_hindi"),
            segments: vec![
                PaperSegment {
                    id: "para1".to_string(),
                    segment_type: SegmentType::Paragraph,
                    content: "भारत एक महान देश है। यहाँ अनेक धर्मों के लोग मिलजुल कर रहते हैं।".to_string(),
                    expected_format: None,
                    marks: Some(5),
                },
                PaperSegment {
                    id: "para2".to_string(),
                    segment_type: SegmentType::Paragraph,
                    content: "हमारा संविधान हमें मौलिक अधिकार देता है। हमें अपने कर्तव्यों का पालन करना चाहिए।".to_string(),
                    expected_format: None,
                    marks: Some(5),
                },
                PaperSegment {
                    id: "para3".to_string(),
                    segment_type: SegmentType::Paragraph,
                    content: "पर्यावरण की रक्षा हम सबका कर्तव्य है। पेड़ लगाएँ, पानी बचाएँ।".to_string(),
                    expected_format: None,
                    marks: Some(5),
                },
            ],
            keyboard_layout: None,
        }
    }

    pub fn english_typing_practice() -> ExamPaper {
        ExamPaper {
            version: 1,
            metadata: PaperMetadata {
                id: "english-typing-practice-1".to_string(),
                title: "English Typing Practice - Set 1".to_string(),
                description: "Practice paper for English typing test".to_string(),
                language: Language::English,
                paper_type: PaperType::Typing,
                author: "Examoffice Community".to_string(),
                license: "CC0-1.0".to_string(),
                tags: vec!["english".to_string(), "practice".to_string()],
                created_at: chrono::Utc::now(),
                updated_at: chrono::Utc::now(),
                version: "1.0".to_string(),
                source_url: None,
            },
            requirements: get_exam_requirements("ssc"),
            segments: vec![
                PaperSegment {
                    id: "para1".to_string(),
                    segment_type: SegmentType::Paragraph,
                    content: "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet.".to_string(),
                    expected_format: None,
                    marks: Some(10),
                },
                PaperSegment {
                    id: "para2".to_string(),
                    segment_type: SegmentType::Paragraph,
                    content: "Typing is a valuable skill in the modern world. Regular practice improves speed and accuracy significantly.".to_string(),
                    expected_format: None,
                    marks: Some(10),
                },
            ],
            keyboard_layout: None,
        }
    }

    pub fn letter_formatting_hindi() -> ExamPaper {
        ExamPaper {
            version: 1,
            metadata: PaperMetadata {
                id: "letter-formatting-hindi-1".to_string(),
                title: "Hindi Letter Formatting - Office Order".to_string(),
                description: "Format a Hindi office order according to government standards".to_string(),
                language: Language::Hindi,
                paper_type: PaperType::Formatting,
                author: "Examoffice Community".to_string(),
                license: "CC0-1.0".to_string(),
                tags: vec!["hindi".to_string(), "formatting".to_string(), "office-order".to_string()],
                created_at: chrono::Utc::now(),
                updated_at: chrono::Utc::now(),
                version: "1.0".to_string(),
                source_url: None,
            },
            requirements: get_exam_requirements("formatting"),
            segments: vec![
                PaperSegment {
                    id: "heading".to_string(),
                    segment_type: SegmentType::Heading,
                    content: "कार्यालय आदेश".to_string(),
                    expected_format: Some(FormatSpec {
                        font_family: Some("Noto Sans Devanagari".to_string()),
                        font_size: Some(20.0),
                        font_weight: Some("bold".to_string()),
                        font_style: Some("normal".to_string()),
                        text_align: Some("center".to_string()),
                        text_decoration: Some("none".to_string()),
                        line_height: Some(1.5),
                        margin: None,
                        indent: None,
                    }),
                    marks: Some(5),
                },
                PaperSegment {
                    id: "subheading".to_string(),
                    segment_type: SegmentType::Heading,
                    content: "कार्यालय ज्ञापन".to_string(),
                    expected_format: Some(FormatSpec {
                        font_family: Some("Noto Sans Devanagari".to_string()),
                        font_size: Some(16.0),
                        font_weight: Some("normal".to_string()),
                        font_style: Some("normal".to_string()),
                        text_align: Some("center".to_string()),
                        text_decoration: Some("underline".to_string()),
                        line_height: Some(1.5),
                        margin: None,
                        indent: None,
                    }),
                    marks: Some(5),
                },
                PaperSegment {
                    id: "body".to_string(),
                    segment_type: SegmentType::Body,
                    content: "यह सूचित किया जाता है कि कल दिनांक 15 अक्टूबर 2024 को कार्यालय में विशेष बैठक आयोजित की जाएगी। सभी अधिकारी एवं कर्मचारी समय पर उपस्थित हों।".to_string(),
                    expected_format: Some(FormatSpec {
                        font_family: Some("Noto Sans Devanagari".to_string()),
                        font_size: Some(16.0),
                        font_weight: Some("normal".to_string()),
                        font_style: Some("normal".to_string()),
                        text_align: Some("justify".to_string()),
                        text_decoration: Some("none".to_string()),
                        line_height: Some(1.5),
                        margin: None,
                        indent: Some(24.0),
                    }),
                    marks: Some(10),
                },
                PaperSegment {
                    id: "signature".to_string(),
                    segment_type: SegmentType::Signature,
                    content: "हस्ताक्षर\nवरिष्ठ अधिकारी\nकार्यालय प्रमुख".to_string(),
                    expected_format: Some(FormatSpec {
                        font_family: Some("Noto Sans Devanagari".to_string()),
                        font_size: Some(16.0),
                        font_weight: Some("bold".to_string()),
                        font_style: Some("normal".to_string()),
                        text_align: Some("right".to_string()),
                        text_decoration: Some("none".to_string()),
                        line_height: Some(1.5),
                        margin: None,
                        indent: None,
                    }),
                    marks: Some(5),
                },
            ],
            keyboard_layout: None,
        }
    }

    pub fn all_builtin() -> Vec<ExamPaper> {
        vec![
            cpct_hindi_practice(),
            english_typing_practice(),
            letter_formatting_hindi(),
        ]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_paper_creation() {
        let paper = builtin::cpct_hindi_practice();
        assert_eq!(paper.metadata.id, "cpct-hindi-practice-1");
        assert_eq!(paper.segments.len(), 3);
        assert!(paper.validate().is_ok());
    }

    #[test]
    fn test_full_text() {
        let paper = builtin::english_typing_practice();
        let text = paper.get_full_text();
        assert!(text.contains("quick brown fox"));
        assert!(text.contains("valuable skill"));
    }
}