//! Scoring algorithms for different exam types

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Scoring method for typing tests
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ScoringMethod {
    /// Standard WPM: (chars/5) / minutes
    Standard,
    /// Indian govt standard: Net WPM = Gross WPM - (errors * 2)
    IndianGovt,
    /// CPCT specific scoring
    Cpct,
    /// SSC specific scoring
    Ssc,
    /// Custom formula
    Custom { formula: String },
}

/// Detailed scoring result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScoreResult {
    pub gross_wpm: f32,
    pub net_wpm: f32,
    pub accuracy: f32,
    pub total_chars: u32,
    pub correct_chars: u32,
    pub errors: u32,
    pub penalty: f32,
    pub passing: bool,
    pub min_required_wpm: Option<f32>,
    pub min_required_accuracy: Option<f32>,
    pub details: HashMap<String, serde_json::Value>,
}

/// Exam-specific requirements
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExamRequirements {
    pub name: String,
    pub min_net_wpm: Option<f32>,
    pub min_accuracy: Option<f32>,
    pub max_errors: Option<u32>,
    pub duration_minutes: Option<u32>,
    pub scoring_method: ScoringMethod,
}

/// Calculate score based on exam requirements
pub fn calculate_score(
    gross_wpm: f32,
    accuracy: f32,
    total_chars: u32,
    correct_chars: u32,
    errors: u32,
    duration_minutes: f32,
    requirements: &ExamRequirements,
) -> ScoreResult {
    let net_wpm = match requirements.scoring_method {
        ScoringMethod::Standard => gross_wpm,
        ScoringMethod::IndianGovt => {
            // Standard Indian govt: Net = Gross - (errors * 2) / minutes
            let penalty = (errors as f32 * 2.0) / duration_minutes.max(0.0167); // min 1 second
            (gross_wpm - penalty).max(0.0)
        }
        ScoringMethod::Cpct => {
            // CPCT: Similar to IndianGovt but with specific rules
            let penalty = (errors as f32 * 2.0) / duration_minutes.max(0.0167);
            (gross_wpm - penalty).max(0.0)
        }
        ScoringMethod::Ssc => {
            // SSC: May have different penalty
            let penalty = (errors as f32 * 1.5) / duration_minutes.max(0.0167);
            (gross_wpm - penalty).max(0.0)
        }
        ScoringMethod::Custom { .. } => gross_wpm, // Would need expression evaluator
    };

    let penalty = gross_wpm - net_wpm;
    
    let passing = if let Some(min_wpm) = requirements.min_net_wpm {
        net_wpm >= min_wpm
    } else {
        true
    } && if let Some(min_acc) = requirements.min_accuracy {
        accuracy >= min_acc
    } else {
        true
    } && if let Some(max_err) = requirements.max_errors {
        errors <= max_err
    } else {
        true
    };

    let mut details = HashMap::new();
    details.insert("scoring_method".to_string(), serde_json::to_value(&requirements.scoring_method).unwrap());
    details.insert("penalty_per_error".to_string(), serde_json::Value::Number(
        serde_json::Number::from_f64(penalty / errors.max(1) as f64).unwrap()
    ));

    ScoreResult {
        gross_wpm,
        net_wpm,
        accuracy,
        total_chars,
        correct_chars,
        errors,
        penalty,
        passing,
        min_required_wpm: requirements.min_net_wpm,
        min_required_accuracy: requirements.min_accuracy,
        details,
    }
}

/// Predefined exam configurations
pub fn get_exam_requirements(exam_type: &str) -> ExamRequirements {
    match exam_type.to_lowercase().as_str() {
        "cpct" => ExamRequirements {
            name: "CPCT".to_string(),
            min_net_wpm: Some(30.0),
            min_accuracy: Some(90.0),
            max_errors: None,
            duration_minutes: Some(15),
            scoring_method: ScoringMethod::Cpct,
        },
        "cpct_hindi" => ExamRequirements {
            name: "CPCT Hindi".to_string(),
            min_net_wpm: Some(25.0),
            min_accuracy: Some(90.0),
            max_errors: None,
            duration_minutes: Some(15),
            scoring_method: ScoringMethod::Cpct,
        },
        "ssc" => ExamRequirements {
            name: "SSC".to_string(),
            min_net_wpm: Some(35.0),
            min_accuracy: Some(92.0),
            max_errors: None,
            duration_minutes: Some(10),
            scoring_method: ScoringMethod::Ssc,
        },
        "ssc_hindi" => ExamRequirements {
            name: "SSC Hindi".to_string(),
            min_net_wpm: Some(30.0),
            min_accuracy: Some(90.0),
            max_errors: None,
            duration_minutes: Some(10),
            scoring_method: ScoringMethod::Ssc,
        },
        "highcourt" => ExamRequirements {
            name: "High Court".to_string(),
            min_net_wpm: Some(40.0),
            min_accuracy: Some(95.0),
            max_errors: Some(5),
            duration_minutes: Some(10),
            scoring_method: ScoringMethod::IndianGovt,
        },
        "formatting" => ExamRequirements {
            name: "Letter Formatting".to_string(),
            min_net_wpm: None,
            min_accuracy: Some(95.0),
            max_errors: Some(10),
            duration_minutes: Some(30),
            scoring_method: ScoringMethod::Standard,
        },
        _ => ExamRequirements {
            name: "Custom".to_string(),
            min_net_wpm: None,
            min_accuracy: None,
            max_errors: None,
            duration_minutes: None,
            scoring_method: ScoringMethod::Standard,
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_standard_scoring() {
        let req = get_exam_requirements("custom");
        let result = calculate_score(40.0, 95.0, 1000, 950, 50, 5.0, &req);
        assert_eq!(result.net_wpm, 40.0);
        assert!(result.passing);
    }

    #[test]
    fn test_indian_govt_scoring() {
        let req = get_exam_requirements("highcourt");
        // 40 gross WPM, 50 errors in 5 minutes
        // Penalty = (50 * 2) / 5 = 20
        // Net = 40 - 20 = 20
        let result = calculate_score(40.0, 90.0, 1000, 900, 50, 5.0, &req);
        assert_eq!(result.net_wpm, 20.0);
        assert!(!result.passing); // Min 40 WPM required
    }

    #[test]
    fn test_cpct_scoring() {
        let req = get_exam_requirements("cpct");
        // 35 gross WPM, 20 errors in 15 minutes
        // Penalty = (20 * 2) / 15 = 2.67
        // Net = 35 - 2.67 = 32.33
        let result = calculate_score(35.0, 93.0, 1000, 930, 20, 15.0, &req);
        assert!((result.net_wpm - 32.33).abs() < 0.1);
        assert!(result.passing); // Min 30 WPM required
    }
}