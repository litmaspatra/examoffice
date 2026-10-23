//! Encryption utilities for Examoffice
//! Uses AES-GCM for authenticated encryption and Argon2 for key derivation

use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier, Algorithm, Version, Params};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CryptoError {
    #[error("Encryption failed: {0}")]
    Encryption(String),
    #[error("Decryption failed: {0}")]
    Decryption(String),
    #[error("Key derivation failed: {0}")]
    KeyDerivation(String),
    #[error("Invalid format: {0}")]
    InvalidFormat(String),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

/// Encrypted data container
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedData {
    pub version: u32,
    pub algorithm: String,
    pub salt: Vec<u8>,
    pub nonce: Vec<u8>,
    pub ciphertext: Vec<u8>,
    pub auth_tag: Vec<u8>,
}

/// Derive encryption key from password using Argon2id
pub fn derive_key(password: &[u8], salt: &[u8]) -> Result<[u8; 32], CryptoError> {
    let mut key = [0u8; 32];
    let params = Params::new(65536, 3, 1, Some(32))
        .map_err(|e| CryptoError::KeyDerivation(e.to_string()))?;
    
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    argon2.hash_password_into(password, salt, &mut key)
        .map_err(|e| CryptoError::KeyDerivation(e.to_string()))?;
    
    Ok(key)
}

/// Encrypt data with password
pub fn encrypt(data: &[u8], password: &str) -> Result<EncryptedData, CryptoError> {
    let mut salt = [0u8; 16];
    OsRng.fill_bytes(&mut salt);
    
    let key = derive_key(password.as_bytes(), &salt)?;
    let cipher = Aes256Gcm::new_from_slice(&key)
        .map_err(|e| CryptoError::Encryption(e.to_string()))?;
    
    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    let ciphertext = cipher.encrypt(nonce, data)
        .map_err(|e| CryptoError::Encryption(e.to_string()))?;
    
    // AES-GCM appends auth tag to ciphertext
    let (ciphertext_only, auth_tag) = ciphertext.split_at(ciphertext.len() - 16);
    
    Ok(EncryptedData {
        version: 1,
        algorithm: "AES-256-GCM".to_string(),
        salt: salt.to_vec(),
        nonce: nonce_bytes.to_vec(),
        ciphertext: ciphertext_only.to_vec(),
        auth_tag: auth_tag.to_vec(),
    })
}

/// Decrypt data with password
pub fn decrypt(encrypted: &EncryptedData, password: &str) -> Result<Vec<u8>, CryptoError> {
    if encrypted.version != 1 {
        return Err(CryptoError::InvalidFormat("Unsupported version".to_string()));
    }
    if encrypted.algorithm != "AES-256-GCM" {
        return Err(CryptoError::InvalidFormat("Unsupported algorithm".to_string()));
    }
    if encrypted.salt.len() != 16 {
        return Err(CryptoError::InvalidFormat("Invalid salt length".to_string()));
    }
    if encrypted.nonce.len() != 12 {
        return Err(CryptoError::InvalidFormat("Invalid nonce length".to_string()));
    }
    if encrypted.auth_tag.len() != 16 {
        return Err(CryptoError::InvalidFormat("Invalid auth tag length".to_string()));
    }
    
    let key = derive_key(password.as_bytes(), &encrypted.salt)?;
    let cipher = Aes256Gcm::new_from_slice(&key)
        .map_err(|e| CryptoError::Decryption(e.to_string()))?;
    
    let nonce = Nonce::from_slice(&encrypted.nonce);
    
    // Reconstruct full ciphertext with auth tag
    let mut full_ciphertext = encrypted.ciphertext.clone();
    full_ciphertext.extend_from_slice(&encrypted.auth_tag);
    
    let plaintext = cipher.decrypt(nonce, full_ciphertext.as_ref())
        .map_err(|e| CryptoError::Decryption(e.to_string()))?;
    
    Ok(plaintext)
}

/// Generate a secure random password
pub fn generate_password(length: usize) -> String {
    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let mut rng = OsRng;
    let mut password = String::with_capacity(length);
    for _ in 0..length {
        let idx = (rng.next_u32() as usize) % CHARSET.len();
        password.push(CHARSET[idx] as char);
    }
    password
}

/// Hash a password for storage (using Argon2)
pub fn hash_password(password: &str) -> Result<String, CryptoError> {
    let salt = argon2::password_hash::SaltString::generate(&mut OsRng);
    let params = Params::new(65536, 3, 1, None)
        .map_err(|e| CryptoError::KeyDerivation(e.to_string()))?;
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    
    let password_hash = argon2.hash_password(password.as_bytes(), &salt)
        .map_err(|e| CryptoError::KeyDerivation(e.to_string()))?;
    
    Ok(password_hash.to_string())
}

/// Verify a password against a hash
pub fn verify_password(password: &str, hash: &str) -> Result<bool, CryptoError> {
    let parsed_hash = PasswordHash::new(hash)
        .map_err(|e| CryptoError::KeyDerivation(e.to_string()))?;
    
    let params = Params::new(65536, 3, 1, None)
        .map_err(|e| CryptoError::KeyDerivation(e.to_string()))?;
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    
    Ok(argon2.verify_password(password.as_bytes(), &parsed_hash).is_ok())
}

/// Compute SHA-256 hash of data
pub fn sha256(data: &[u8]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hasher.finalize().into()
}

/// Compute SHA-256 hash of file
pub fn sha256_file(path: &std::path::Path) -> Result<[u8; 32], CryptoError> {
    let data = std::fs::read(path)?;
    Ok(sha256(&data))
}

/// Simple XOR-based obfuscation (for non-sensitive data like test papers)
/// NOT cryptographically secure - use encrypt() for sensitive data
pub fn obfuscate(data: &[u8], key: &[u8]) -> Vec<u8> {
    data.iter()
        .enumerate()
        .map(|(i, &b)| b ^ key[i % key.len()])
        .collect()
}

/// Deobfuscate (same as obfuscate for XOR)
pub fn deobfuscate(data: &[u8], key: &[u8]) -> Vec<u8> {
    obfuscate(data, key)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt() {
        let data = b"Hello, Examoffice! This is a test message.";
        let password = "test-password-123";
        
        let encrypted = encrypt(data, password).unwrap();
        let decrypted = decrypt(&encrypted, password).unwrap();
        
        assert_eq!(data, decrypted.as_slice());
    }

    #[test]
    fn test_wrong_password_fails() {
        let data = b"Secret data";
        let encrypted = encrypt(data, "correct-password").unwrap();
        
        let result = decrypt(&encrypted, "wrong-password");
        assert!(result.is_err());
    }

    #[test]
    fn test_password_hashing() {
        let password = "my-secure-password";
        let hash = hash_password(password).unwrap();
        
        assert!(verify_password(password, &hash).unwrap());
        assert!(!verify_password("wrong-password", &hash).unwrap());
    }

    #[test]
    fn test_obfuscate() {
        let data = b"Test data for obfuscation";
        let key = b"secret-key";
        
        let obfuscated = obfuscate(data, key);
        let deobfuscated = deobfuscate(&obfuscated, key);
        
        assert_eq!(data, deobfuscated.as_slice());
        assert_ne!(data, obfuscated.as_slice());
    }
}