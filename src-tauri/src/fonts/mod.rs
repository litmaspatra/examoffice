//! Font handling for Examoffice
//! Supports loading, shaping, and rendering fonts for multiple scripts

use fontdue::{Font, FontSettings, Metrics, RasterizedGlyph};
use ab_glyph::{FontRef, PxScale, point};
use std::collections::HashMap;
use std::path::Path;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum FontError {
    #[error("Font not found: {0}")]
    NotFound(String),
    #[error("Failed to load font: {0}")]
    LoadFailed(String),
    #[error("Glyph not found: {0}")]
    GlyphNotFound(char),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

/// Font manager for loading and caching fonts
pub struct FontManager {
    fonts: HashMap<String, Font>,
    ab_fonts: HashMap<String, FontRef<'static>>,
    fallback_font: Option<Font>,
}

impl FontManager {
    pub fn new() -> Result<Self, FontError> {
        Ok(Self {
            fonts: HashMap::new(),
            ab_fonts: HashMap::new(),
            fallback_font: None,
        })
    }

    /// Load a font from file
    pub fn load_font(&mut self, name: &str, path: &Path) -> Result<(), FontError> {
        let data = std::fs::read(path)?;
        
        // Load with fontdue for rasterization
        let font = Font::from_bytes(data.clone(), FontSettings::default())
            .map_err(|e| FontError::LoadFailed(e.to_string()))?;
        
        // Load with ab_glyph for layout
        let ab_font = FontRef::try_from_vec(data)
            .map_err(|e| FontError::LoadFailed(e.to_string()))?;
        
        self.fonts.insert(name.to_string(), font);
        self.ab_fonts.insert(name.to_string(), ab_font);
        
        Ok(())
    }

    /// Load a font from bytes
    pub fn load_font_from_bytes(&mut self, name: &str, data: Vec<u8>) -> Result<(), FontError> {
        let font = Font::from_bytes(data.clone(), FontSettings::default())
            .map_err(|e| FontError::LoadFailed(e.to_string()))?;
        
        let ab_font = FontRef::try_from_vec(data)
            .map_err(|e| FontError::LoadFailed(e.to_string()))?;
        
        self.fonts.insert(name.to_string(), font);
        self.ab_fonts.insert(name.to_string(), ab_font);
        
        Ok(())
    }

    /// Set fallback font
    pub fn set_fallback(&mut self, name: &str) -> Result<(), FontError> {
        if let Some(font) = self.fonts.get(name) {
            self.fallback_font = Some(font.clone());
            Ok(())
        } else {
            Err(FontError::NotFound(name.to_string()))
        }
    }

    /// Get a font by name
    pub fn get_font(&self, name: &str) -> Option<&Font> {
        self.fonts.get(name).or(self.fallback_font.as_ref())
    }

    /// Get an ab_glyph font by name
    pub fn get_ab_font(&self, name: &str) -> Option<&FontRef<'static>> {
        self.ab_fonts.get(name)
    }

    /// Rasterize a glyph
    pub fn rasterize_glyph(&self, font_name: &str, ch: char, size: f32) -> Result<(Metrics, Vec<u8>), FontError> {
        let font = self.get_font(font_name)
            .ok_or_else(|| FontError::NotFound(font_name.to_string()))?;
        
        let (metrics, bitmap) = font.rasterize(ch, size);
        Ok((metrics, bitmap))
    }

    /// Get glyph metrics
    pub fn glyph_metrics(&self, font_name: &str, ch: char, size: f32) -> Result<Metrics, FontError> {
        let font = self.get_font(font_name)
            .ok_or_else(|| FontError::NotFound(font_name.to_string()))?;
        
        let metrics = font.metrics(ch, size);
        Ok(metrics)
    }

    /// Layout text using ab_glyph (for complex scripts)
    pub fn layout_text(
        &self,
        font_name: &str,
        text: &str,
        font_size: f32,
    ) -> Result<Vec<PositionedGlyph>, FontError> {
        let font = self.get_ab_font(font_name)
            .ok_or_else(|| FontError::NotFound(font_name.to_string()))?;
        
        let scale = PxScale::from(font_size);
        let mut glyphs = Vec::new();
        let mut x = 0.0;
        
        for ch in text.chars() {
            let glyph_id = font.glyph_id(ch);
            if glyph_id.0 == 0 && ch != '\0' {
                // Glyph not found, try fallback
                if let Some(fallback) = &self.fallback_font {
                    // Would need ab_glyph fallback too
                }
                continue;
            }
            
            let h_metrics = font.glyph_horizontal_metrics(glyph_id, scale);
            let v_metrics = font.glyph_vertical_metrics(glyph_id, scale);
            
            glyphs.push(PositionedGlyph {
                ch,
                glyph_id,
                x,
                y: 0.0,
                advance_width: h_metrics.advance_width,
                left_side_bearing: h_metrics.left_side_bearing,
                ascent: v_metrics.ascent,
                descent: v_metrics.descent,
            });
            
            x += h_metrics.advance_width;
        }
        
        Ok(glyphs)
    }

    /// Measure text width
    pub fn measure_text(&self, font_name: &str, text: &str, font_size: f32) -> Result<f32, FontError> {
        let font = self.get_ab_font(font_name)
            .ok_or_else(|| FontError::NotFound(font_name.to_string()))?;
        
        let scale = PxScale::from(font_size);
        let mut width = 0.0;
        
        for ch in text.chars() {
            let glyph_id = font.glyph_id(ch);
            let h_metrics = font.glyph_horizontal_metrics(glyph_id, scale);
            width += h_metrics.advance_width;
        }
        
        Ok(width)
    }

    /// Get available font names
    pub fn font_names(&self) -> Vec<String> {
        self.fonts.keys().cloned().collect()
    }
}

impl Default for FontManager {
    fn default() -> Self {
        Self::new().unwrap()
    }
}

/// A positioned glyph for rendering
#[derive(Debug, Clone)]
pub struct PositionedGlyph {
    pub ch: char,
    pub glyph_id: ab_glyph::GlyphId,
    pub x: f32,
    pub y: f32,
    pub advance_width: f32,
    pub left_side_bearing: f32,
    pub ascent: f32,
    pub descent: f32,
}

/// Built-in font names
pub mod builtin {
    pub const NOTO_DEVANAGARI: &str = "Noto Sans Devanagari";
    pub const NOTO_SANS: &str = "Noto Sans";
    pub const JETBRAINS_MONO: &str = "JetBrains Mono";
    pub const LOHIT_DEVANAGARI: &str = "Lohit Devanagari";
    pub const MANGAL: &str = "Mangal"; // Microsoft font, not bundled
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_font_manager_creation() {
        let manager = FontManager::new();
        assert!(manager.is_ok());
    }
}