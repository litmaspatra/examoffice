//! Examoffice library crate
//! 
//! This crate contains the core logic for the Examoffice typing tutor.

pub mod engine;
pub mod crypto;
pub mod fonts;
pub mod storage;
pub mod commands;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lib_compiles() {
        // Just verify the library compiles
        assert!(true);
    }
}