# Changelog

All notable changes to Examoffice will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure with Tauri 2 + React 18 + TypeScript
- Core typing engine in Rust (keystroke processing, WPM calculation, error heatmap)
- Multi-language support (English, Hindi with InScript layout)
- Exam modes: Practice (backspace allowed) and Exam (no backspace, timed)
- Scoring algorithms: Standard, Indian Govt, CPCT, SSC
- Letter formatting exercises (Hindi/English with font/size/alignment rules)
- Paper management: create, edit, import, export JSON papers
- Virtual keyboard (QWERTY + InScript) with visual feedback
- Theme system (light/dark/system) with CSS variables
- Settings panel (6 tabs: General, Appearance, Typing, Audio, Privacy, Advanced)
- History/results with filtering, sorting, pagination
- SQLite database with migrations
- AES-GCM encryption + Argon2 key derivation
- GitHub Actions CI/CD for Windows/Linux/macOS builds

### Changed
- N/A

### Fixed
- N/A

## [0.1.0] - 2026-10-23

### Added
- Initial release
- Free, open-source typing tutor & exam platform
- Support for government typing tests (CPCT, SSC, High Court)
- Cross-platform: Windows, Linux, macOS
- Privacy-first: no tracking, no cloud, all data local