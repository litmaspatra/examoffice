// Type definitions shared between frontend and backend

export interface Keystroke {
  char: string;
  correct: boolean;
  timestamp_ms: number;
  latency_ms: number;
}

export interface TypingStats {
  total_keystrokes: number;
  correct_keystrokes: number;
  errors: number;
  gross_wpm: number;
  net_wpm: number;
  accuracy: number;
  elapsed_ms: number;
  current_streak: number;
  best_streak: number;
}

export interface TypingResult {
  paper_id: string;
  timestamp: string; // ISO 8601
  duration_ms: number;
  stats: TypingStats;
  heatmap: Record<string, number>;
  keystroke_log: Keystroke[];
}

export interface TestConfig {
  duration_seconds: number | null;
  allow_backspace: boolean;
  require_exact_match: boolean;
  language: string;
  layout: string;
}

export interface ExamRequirements {
  name: string;
  min_net_wpm: number | null;
  min_accuracy: number | null;
  max_errors: number | null;
  duration_minutes: number | null;
  scoring_method: ScoringMethod;
}

export type ScoringMethod = 
  | "standard"
  | "indian_govt"
  | "cpct"
  | "ssc"
  | { custom: { formula: string } };

export interface ScoreResult {
  gross_wpm: number;
  net_wpm: number;
  accuracy: number;
  total_chars: number;
  correct_chars: number;
  errors: number;
  penalty: number;
  passing: boolean;
  min_required_wpm: number | null;
  min_required_accuracy: number | null;
  details: Record<string, unknown>;
}

export type Language = 
  | "english"
  | "hindi"
  | "marathi"
  | "gujarati"
  | "punjabi"
  | "tamil"
  | "telugu"
  | "kannada"
  | "malayalam"
  | "bengali"
  | "oriya"
  | "assamese"
  | "urdu"
  | { custom: string };

export type PaperType = 
  | "typing"
  | "formatting"
  | "code"
  | "mixed";

export interface KeyboardLayout {
  name: string;
  display_name: string;
  language: Language;
  key_map: Record<string, string>;
  shift_map: Record<string, string>;
  altgr_map?: Record<string, string>;
}

export interface FormatSpec {
  font_family?: string;
  font_size?: number;
  font_weight?: string;
  font_style?: string;
  text_align?: string;
  text_decoration?: string;
  line_height?: number;
  margin?: string;
  indent?: number;
}

export type SegmentType = 
  | "paragraph"
  | "heading"
  | "table"
  | "list"
  | "signature"
  | "date"
  | "reference"
  | "subject"
  | "body"
  | "closing"
  | "enclosure"
  | "copy_to";

export interface PaperSegment {
  id: string;
  segment_type: SegmentType;
  content: string;
  expected_format?: FormatSpec;
  marks?: number;
}

export interface PaperMetadata {
  id: string;
  title: string;
  description: string;
  language: Language;
  paper_type: PaperType;
  author: string;
  license: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  version: string;
  source_url?: string;
}

export interface ExamPaper {
  version: number;
  metadata: PaperMetadata;
  requirements: ExamRequirements;
  segments: PaperSegment[];
  keyboard_layout?: KeyboardLayout;
}

export interface EncryptedData {
  version: number;
  algorithm: string;
  salt: number[];
  nonce: number[];
  ciphertext: number[];
  auth_tag: number[];
}

export interface StorageStats {
  total_results: number;
  total_papers: number;
  average_wpm: number | null;
  best_wpm: number | null;
}

export interface UserSettings {
  theme: "light" | "dark" | "system";
  font_size: number;
  font_family: string;
  sound_enabled: boolean;
  keystroke_sound: boolean;
  error_sound: boolean;
  completion_sound: boolean;
  auto_save: boolean;
  show_virtual_keyboard: boolean;
  show_heatmap: boolean;
  show_realtime_stats: boolean;
  default_duration: number;
  allow_backspace: boolean;
  language: Language;
  layout: string;
}