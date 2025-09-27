// utils/encryption.ts
import * as Crypto from 'expo-crypto';
import { DiaryEntry } from '../types';

// Polyfill Buffer for React Native
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// Encryption configuration
const PBKDF2_ITERATIONS = 100000; // OWASP recommended minimum
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16; // 128 bits for GCM

// Legacy encryption configuration (for backward compatibility)
const LEGACY_IV_LENGTH = 16; // 128 bits for legacy

/**
 * Generates a random salt for password-based key derivation
 */
export function generateSalt(): string {
  const bytes = Crypto.getRandomBytes(16);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * LEGACY: Derives an encryption key from a password and salt using simple SHA256
 * This is kept for backward compatibility with old encrypted data
 */
export async function deriveKeyFromPasswordLegacy(password: string, salt: string): Promise<string> {
  const key = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password + salt,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  
  console.log('🔑 Derived key with legacy SHA256:', { 
    password: password.substring(0, 5) + '...', 
    salt: salt.substring(0, 10) + '...', 
    key: key.substring(0, 20) + '...',
    keyLength: key.length 
  });
  
  return key;
}

/**
 * Derives an encryption key from a password and salt using PBKDF2
 * This is now secure with proper PBKDF2 implementation
 */
export async function deriveKeyFromPassword(password: string, salt: string): Promise<string> {
  const passwordBuffer = new TextEncoder().encode(password);
  const saltBuffer = new Uint8Array(salt.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  
  // Use Web Crypto API for proper PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    KEY_LENGTH * 8 // Convert bytes to bits
  );
  
  // Convert to base64 for storage
  const keyArray = new Uint8Array(derivedBits);
  const key = btoa(String.fromCharCode(...keyArray));
  
  console.log('🔑 Derived key with PBKDF2:', { 
    password: password.substring(0, 5) + '...', 
    salt: salt.substring(0, 10) + '...', 
    key: key.substring(0, 20) + '...',
    iterations: PBKDF2_ITERATIONS,
    keyLength: key.length 
  });
  
  return key;
}

/**
 * LEGACY: Encrypts a string using XOR cipher (for backward compatibility)
 */
export async function encryptStringLegacy(plaintext: string, key: string): Promise<string> {
  const iv = Crypto.getRandomBytes(LEGACY_IV_LENGTH);
  const keyBuffer = new Uint8Array(atob(key).split('').map(c => c.charCodeAt(0)));
  
  const plaintextBuffer = new TextEncoder().encode(plaintext);
  const encrypted = new Uint8Array(plaintextBuffer.length);
  
  for (let i = 0; i < plaintextBuffer.length; i++) {
    encrypted[i] = plaintextBuffer[i] ^ keyBuffer[i % keyBuffer.length];
  }
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.length);
  combined.set(iv);
  combined.set(encrypted, iv.length);
  
  const result = btoa(String.fromCharCode(...combined));
  console.log('🔐 Encrypting with legacy XOR:', { 
    original: plaintext.substring(0, 20) + '...', 
    encrypted: result.substring(0, 30) + '...',
    keyLength: key.length,
    keyBufferLength: keyBuffer.length
  });
  return result;
}

/**
 * LEGACY: Decrypts a string using XOR cipher (for backward compatibility)
 */
export async function decryptStringLegacy(encryptedData: string, key: string): Promise<string> {
  const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
  const iv = combined.slice(0, LEGACY_IV_LENGTH);
  const encrypted = combined.slice(LEGACY_IV_LENGTH);
  
  const keyBuffer = new Uint8Array(atob(key).split('').map(c => c.charCodeAt(0)));
  const decrypted = new Uint8Array(encrypted.length);
  
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ keyBuffer[i % keyBuffer.length];
  }
  
  return new TextDecoder().decode(decrypted);
}

/**
 * Encrypts a string using AES-256-GCM (secure encryption)
 */
export async function encryptString(plaintext: string, key: string): Promise<string> {
  try {
    // Generate random IV using a different approach to avoid type issues
    const ivBytes = Crypto.getRandomBytes(IV_LENGTH);
    const iv: Uint8Array = new Uint8Array(Array.from(ivBytes));
    
    // Import the key
    const keyBuffer = new Uint8Array(atob(key).split('').map(c => c.charCodeAt(0)));
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    // Encrypt the data
    const plaintextBuffer = new TextEncoder().encode(plaintext);
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
        tagLength: TAG_LENGTH * 8 // Convert bytes to bits
      },
      cryptoKey,
      plaintextBuffer
    );
    
    // Combine IV and encrypted data
    const encryptedArray = new Uint8Array(encryptedData);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv);
    combined.set(encryptedArray, iv.length);
    
    const result = btoa(String.fromCharCode(...combined));
    
    console.log('🔐 Encrypting with AES-256-GCM:', { 
      original: plaintext.substring(0, 20) + '...', 
      encrypted: result.substring(0, 30) + '...',
      ivLength: iv.length,
      encryptedLength: encryptedArray.length
    });
    
    return result;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts a string using AES-256-GCM (secure decryption)
 */
export async function decryptString(encryptedData: string, key: string): Promise<string> {
  try {
    // Decode the combined data
    const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
    const iv = combined.slice(0, IV_LENGTH);
    const encrypted = combined.slice(IV_LENGTH);
    
    // Import the key
    const keyBuffer = new Uint8Array(atob(key).split('').map(c => c.charCodeAt(0)));
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
        tagLength: TAG_LENGTH * 8 // Convert bytes to bits
      },
      cryptoKey,
      encrypted
    );
    
    const decryptedArray = new Uint8Array(decryptedData);
    return new TextDecoder().decode(decryptedArray);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data - invalid key or corrupted data');
  }
}

/**
 * Detects if a string is encrypted with the legacy method
 * Legacy method uses 16-byte IV, new method uses 12-byte IV
 */
function isLegacyEncrypted(encryptedData: string): boolean {
  try {
    const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
    return combined.length >= LEGACY_IV_LENGTH && combined.length < IV_LENGTH + 100; // Rough heuristic
  } catch {
    return false;
  }
}

/**
 * Smart decrypt function that tries both legacy and new methods
 */
export async function decryptStringSmart(encryptedData: string, key: string, legacyKey?: string): Promise<string> {
  try {
    // First try the new AES-256-GCM method
    if (!isLegacyEncrypted(encryptedData)) {
      console.log('🔓 Attempting decryption with AES-256-GCM...');
      return await decryptString(encryptedData, key);
    }
  } catch (error) {
    console.log('🔓 AES-256-GCM decryption failed, trying legacy method...');
  }
  
  // If new method fails or data looks legacy, try legacy method
  if (legacyKey) {
    console.log('🔓 Attempting decryption with legacy XOR...');
    return await decryptStringLegacy(encryptedData, legacyKey);
  }
  
  throw new Error('Failed to decrypt data - no compatible method found');
}

/**
 * Encrypts a diary entry's sensitive fields
 */
export async function encryptDiaryEntry(entry: DiaryEntry, key: string): Promise<DiaryEntry> {
  const encryptedEntry = { ...entry };
  
  if (entry.title) {
    encryptedEntry.title = await encryptString(entry.title, key);
  }
  if (entry.content) {
    encryptedEntry.content = await encryptString(entry.content, key);
  }
  if (entry.emoji) {
    encryptedEntry.emoji = await encryptString(entry.emoji, key);
  }
  if (entry.imageUri) {
    encryptedEntry.imageUri = await encryptString(entry.imageUri, key);
  }
  
  return encryptedEntry;
}

/**
 * Decrypts a diary entry's sensitive fields with backward compatibility
 */
export async function decryptDiaryEntry(entry: DiaryEntry, key: string, legacyKey?: string): Promise<DiaryEntry> {
  const decryptedEntry = { ...entry };
  
  if (entry.title) {
    decryptedEntry.title = await decryptStringSmart(entry.title, key, legacyKey);
  }
  if (entry.content) {
    decryptedEntry.content = await decryptStringSmart(entry.content, key, legacyKey);
  }
  if (entry.emoji) {
    decryptedEntry.emoji = await decryptStringSmart(entry.emoji, key, legacyKey);
  }
  if (entry.imageUri) {
    decryptedEntry.imageUri = await decryptStringSmart(entry.imageUri, key, legacyKey);
  }
  
  return decryptedEntry;
}

/**
 * Encrypts a complete diary export
 */
export async function encryptDiaryExport(entries: DiaryEntry[], key: string): Promise<string> {
  const exportData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    entries: entries
  };
  
  const jsonString = JSON.stringify(exportData);
  return await encryptString(jsonString, key);
}

/**
 * Decrypts a diary export
 */
export async function decryptDiaryExport(encryptedData: string, key: string): Promise<DiaryEntry[]> {
  const decryptedJson = await decryptString(encryptedData, key);
  const exportData = JSON.parse(decryptedJson);
  return exportData.entries || [];
}
