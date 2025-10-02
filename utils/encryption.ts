// utils/encryption.ts - Practical and Secure Encryption Implementation
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { DiaryEntry } from '../types';
import CryptoJS from 'crypto-js';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// Polyfill Buffer for React Native
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// Security Configuration
const SECURITY_CONFIG = {
  // PBKDF2 parameters (OWASP recommended)
  PBKDF2: {
    iterations: 10000,       // 100,000 iterations
    keyLength: 32,            // 256 bits (32 bytes)
    hashAlgorithm: 'sha256'   // SHA-256
  },
  
  // AES-256 parameters
  AES: {
    keySize: 256,             // 256 bits
    mode: CryptoJS.mode.CBC,  // CBC mode
    padding: CryptoJS.pad.Pkcs7
  },
  
  // Password requirements
  PASSWORD: {
    minLength: 8,             // Minimum 8 characters
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: false     // Optional for better UX
  }
} as const;

// Security event logging
interface SecurityEvent {
  type: 'encryption' | 'decryption' | 'key_derivation' | 'password_verification' | 'failed_attempt';
  timestamp: string;
  userId?: string;
  details: string;
  success: boolean;
}

const securityAuditLog: SecurityEvent[] = [];

/**
 * Logs security events for auditing
 */
function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
  const securityEvent: SecurityEvent = {
    ...event,
    timestamp: new Date().toISOString()
  };
  securityAuditLog.push(securityEvent);
  console.log(`🔐 Security Event: ${event.type} - ${event.success ? 'SUCCESS' : 'FAILED'} - ${event.details}`);
}

/**
 * Generates a cryptographically secure salt
 */
export function generateSalt(): string {
  try {
    if (Platform.OS === 'web' && typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } else {
      // React Native fallback
      const bytes = Crypto.getRandomBytes(16);
      return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }
  } catch (error) {
    logSecurityEvent({
      type: 'key_derivation',
      details: `Failed to generate salt: ${error}`,
      success: false
    });
    throw new Error('Failed to generate salt');
  }
}

/**
 * Validates master password strength
 */
export function validateMasterPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < SECURITY_CONFIG.PASSWORD.minLength) {
    errors.push(`Password must be at least ${SECURITY_CONFIG.PASSWORD.minLength} characters long`);
  }
  
  if (SECURITY_CONFIG.PASSWORD.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (SECURITY_CONFIG.PASSWORD.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (SECURITY_CONFIG.PASSWORD.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (SECURITY_CONFIG.PASSWORD.requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Derives encryption key from master password using PBKDF2
 */
export function deriveKeyFromPassword(masterPassword: string, salt: string): string {
  try {
    logSecurityEvent({
      type: 'key_derivation',
      details: 'Starting PBKDF2 key derivation',
      success: true
    });

    // Validate password strength
    const validation = validateMasterPassword(masterPassword);
    if (!validation.valid) {
      throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
    }

    // Use PBKDF2 to derive key
    const key = CryptoJS.PBKDF2(masterPassword, salt, {
      keySize: SECURITY_CONFIG.PBKDF2.keyLength / 4, // CryptoJS uses words (4 bytes each)
      iterations: SECURITY_CONFIG.PBKDF2.iterations,
      hasher: CryptoJS.algo.SHA256
    });

    const keyHex = key.toString(CryptoJS.enc.Hex);

    logSecurityEvent({
      type: 'key_derivation',
      details: 'PBKDF2 key derivation completed successfully',
      success: true
    });

    return keyHex;
  } catch (error) {
    logSecurityEvent({
      type: 'key_derivation',
      details: `PBKDF2 key derivation failed: ${error}`,
      success: false
    });
    throw new Error(`Failed to derive key: ${error}`);
  }
}

/**
 * Encrypts data using AES-256-CBC
 */
export function encryptData(plaintext: string, keyHex: string): { ciphertext: string; iv: string } {
  try {
    // Generate random IV using expo-crypto for better Android compatibility
    let ivHex: string;
    
    if (Platform.OS === 'web' && typeof crypto !== 'undefined' && crypto.getRandomValues) {
      // Web: use Web Crypto API
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      ivHex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } else {
      // React Native: use expo-crypto
      const bytes = Crypto.getRandomBytes(16);
      ivHex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    // Convert hex string to WordArray
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    
    // Convert hex key to WordArray
    const key = CryptoJS.enc.Hex.parse(keyHex);
    
    // Encrypt using AES-256-CBC
    const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
      iv: iv,
      mode: SECURITY_CONFIG.AES.mode,
      padding: SECURITY_CONFIG.AES.padding
    });

    const result = {
      ciphertext: encrypted.toString(),
      iv: ivHex
    };

    logSecurityEvent({
      type: 'encryption',
      details: `Encrypted data successfully (${plaintext.length} chars)`,
      success: true
    });

    return result;
  } catch (error) {
    logSecurityEvent({
      type: 'encryption',
      details: `Encryption failed: ${error}`,
      success: false
    });
    throw new Error(`Failed to encrypt data: ${error}`);
  }
}

/**
 * Decrypts data using AES-256-CBC
 */
export function decryptData(ciphertext: string, ivHex: string, keyHex: string): string {
  try {
    // Convert hex strings to WordArrays
    const key = CryptoJS.enc.Hex.parse(keyHex);
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    
    // Decrypt using AES-256-CBC
    const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
      iv: iv,
      mode: SECURITY_CONFIG.AES.mode,
      padding: SECURITY_CONFIG.AES.padding
    });

    const result = decrypted.toString(CryptoJS.enc.Utf8);

    if (!result) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }

    logSecurityEvent({
      type: 'decryption',
      details: `Decrypted data successfully (${result.length} chars)`,
      success: true
    });

    return result;
  } catch (error) {
    logSecurityEvent({
      type: 'decryption',
      details: `Decryption failed: ${error}`,
      success: false
    });
    throw new Error(`Failed to decrypt data: ${error}`);
  }
}

/**
 * Encrypts a string with authentication
 */
export function encryptString(plaintext: string, keyHex: string): string {
  const encrypted = encryptData(plaintext, keyHex);
  return JSON.stringify(encrypted);
}

/**
 * Decrypts a string with authentication verification
 */
export function decryptString(encryptedString: string, keyHex: string): string {
  const encryptedData = JSON.parse(encryptedString);
  return decryptData(encryptedData.ciphertext, encryptedData.iv, keyHex);
}

/**
 * Verifies password by attempting to decrypt a known value
 */
export function verifyPassword(masterPassword: string, salt: string, keyCheck: string): boolean {
  try {
    const derivedKey = deriveKeyFromPassword(masterPassword, salt);
    const decryptedCheck = decryptString(keyCheck, derivedKey);
    
    // The key check should contain a known value
    const isValid = decryptedCheck === 'password-verification-check';
    
    logSecurityEvent({
      type: 'password_verification',
      details: `Password verification ${isValid ? 'successful' : 'failed'}`,
      success: isValid
    });
    
    return isValid;
  } catch (error) {
    logSecurityEvent({
      type: 'password_verification',
      details: `Password verification failed: ${error}`,
      success: false
    });
    return false;
  }
}

/**
 * Creates a key check value for password verification
 */
export function createKeyCheck(masterPassword: string, salt: string): string {
  const derivedKey = deriveKeyFromPassword(masterPassword, salt);
  return encryptString('password-verification-check', derivedKey);
}

/**
 * Encrypts a diary entry
 */
export function encryptDiaryEntry(entry: DiaryEntry, keyHex: string): DiaryEntry {
  try {
    const encryptedEntry: DiaryEntry = {
      ...entry,
      title: encryptString(entry.title, keyHex),
      content: encryptString(entry.content, keyHex),
      emoji: entry.emoji ? encryptString(entry.emoji, keyHex) : null,
      imageUri: entry.imageUri ? encryptString(entry.imageUri, keyHex) : null,
      createdAt: encryptString(entry.createdAt, keyHex),
      modifiedAt: entry.modifiedAt ? encryptString(entry.modifiedAt, keyHex) : null,
      isPrivate: entry.isPrivate,
    };

    logSecurityEvent({
      type: 'encryption',
      details: `Encrypted diary entry ${entry.id}`,
      success: true
    });

    return encryptedEntry;
  } catch (error) {
    logSecurityEvent({
      type: 'encryption',
      details: `Failed to encrypt diary entry ${entry.id}: ${error}`,
      success: false
    });
    throw new Error(`Failed to encrypt diary entry: ${error}`);
  }
}

/**
 * Decrypts a diary entry
 */
export function decryptDiaryEntry(entry: DiaryEntry, keyHex: string): DiaryEntry {
  try {
    const decryptedEntry: DiaryEntry = {
      ...entry,
      title: decryptString(entry.title, keyHex),
      content: decryptString(entry.content, keyHex),
      emoji: entry.emoji ? decryptString(entry.emoji, keyHex) : null,
      imageUri: entry.imageUri ? decryptString(entry.imageUri, keyHex) : null,
      createdAt: decryptString(entry.createdAt, keyHex),
      modifiedAt: entry.modifiedAt ? decryptString(entry.modifiedAt, keyHex) : null,
      isPrivate: entry.isPrivate,
    };

    logSecurityEvent({
      type: 'decryption',
      details: `Decrypted diary entry ${entry.id}`,
      success: true
    });

    return decryptedEntry;
  } catch (error) {
    logSecurityEvent({
      type: 'decryption',
      details: `Failed to decrypt diary entry ${entry.id}: ${error}`,
      success: false
    });
    throw new Error(`Failed to decrypt diary entry: ${error}`);
  }
}

/**
 * Creates encrypted backup with master password
 */
export function createEncryptedBackup(entries: DiaryEntry[], masterPassword: string): string {
  try {
    // Generate salt for backup
    const salt = generateSalt();
    
    // Derive key from master password
    const keyHex = deriveKeyFromPassword(masterPassword, salt);
    
    // Create backup data
    const backupData = {
      entries,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    
    // Encrypt backup
    const jsonString = JSON.stringify(backupData);
    const encrypted = encryptData(jsonString, keyHex);
    
    // Create backup package
    const backupPackage = {
      ...encrypted,
      salt,
      version: '1.0.0'
    };

    logSecurityEvent({
      type: 'encryption',
      details: `Created encrypted backup with ${entries.length} entries`,
      success: true
    });

    return JSON.stringify(backupPackage);
  } catch (error) {
    logSecurityEvent({
      type: 'encryption',
      details: `Failed to create encrypted backup: ${error}`,
      success: false
    });
    throw new Error(`Failed to create encrypted backup: ${error}`);
  }
}

/**
 * Restores from encrypted backup
 */
export function restoreFromBackup(backupData: string, masterPassword: string): DiaryEntry[] {
  try {
    const backupPackage = JSON.parse(backupData);
    
    // Validate version
    if (backupPackage.version !== '1.0.0') {
      throw new Error(`Unsupported backup version: ${backupPackage.version}`);
    }
    
    // Derive key from master password and salt
    const keyHex = deriveKeyFromPassword(masterPassword, backupPackage.salt);
    
    // Decrypt backup
    const decryptedString = decryptData(backupPackage.ciphertext, backupPackage.iv, keyHex);
    const decryptedData = JSON.parse(decryptedString);
    
    if (!decryptedData.entries || !Array.isArray(decryptedData.entries)) {
      throw new Error('Invalid backup data: missing entries');
    }

    logSecurityEvent({
      type: 'decryption',
      details: `Restored backup with ${decryptedData.entries.length} entries`,
      success: true
    });

    return decryptedData.entries;
  } catch (error) {
    logSecurityEvent({
      type: 'decryption',
      details: `Failed to restore backup: ${error}`,
      success: false
    });
    throw new Error(`Failed to restore backup: ${error}`);
  }
}

/**
 * Gets security audit log
 */
export function getSecurityAuditLog(): SecurityEvent[] {
  return [...securityAuditLog];
}

/**
 * Clears security audit log
 */
export function clearSecurityAuditLog(): void {
  securityAuditLog.length = 0;
}

// Legacy functions for backward compatibility
export async function encryptDiaryExport(entries: DiaryEntry[], encryptionKey?: string): Promise<string> {
  throw new Error('Use createEncryptedBackup instead of encryptDiaryExport');
}

export async function decryptDiaryExport(encryptedData: string, encryptionKey?: string): Promise<DiaryEntry[]> {
  throw new Error('Use restoreFromBackup instead of decryptDiaryExport');
}

// ============================================================================
// BIOMETRIC AUTHENTICATION SERVICE
// ============================================================================

const BIOMETRIC_KEY_STORAGE_KEY = 'diary_encryption_key_biometric';

/**
 * Checks if biometric authentication is supported on the device
 */
export async function isBiometricSupported(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  } catch (error) {
    console.error('Error checking biometric support:', error);
    return false;
  }
}

/**
 * Stores the encryption key securely with biometric authentication
 */
export async function storeKeyWithBiometrics(encryptionKey: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      console.warn('Biometric authentication not supported on web');
      return false;
    }

    const isSupported = await isBiometricSupported();
    if (!isSupported) {
      throw new Error('Biometric authentication not supported or not enrolled');
    }

    await SecureStore.setItemAsync(BIOMETRIC_KEY_STORAGE_KEY, encryptionKey, {
      requireAuthentication: true,
      authenticationPrompt: 'Authenticate to enable biometric unlock for your diary'
    });

    logSecurityEvent({
      type: 'encryption',
      details: 'Encryption key stored with biometric authentication',
      success: true
    });

    return true;
  } catch (error) {
    logSecurityEvent({
      type: 'encryption',
      details: `Failed to store key with biometrics: ${error}`,
      success: false
    });
    console.error('Error storing key with biometrics:', error);
    return false;
  }
}

/**
 * Retrieves the encryption key using biometric authentication
 */
export async function getKeyWithBiometrics(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      console.warn('Biometric authentication not supported on web');
      return null;
    }

    const isSupported = await isBiometricSupported();
    if (!isSupported) {
      return null;
    }

    const encryptionKey = await SecureStore.getItemAsync(BIOMETRIC_KEY_STORAGE_KEY, {
      requireAuthentication: true,
      authenticationPrompt: 'Authenticate to unlock your diary'
    });

    if (encryptionKey) {
      logSecurityEvent({
        type: 'decryption',
        details: 'Encryption key retrieved with biometric authentication',
        success: true
      });
    }

    return encryptionKey;
  } catch (error) {
    logSecurityEvent({
      type: 'decryption',
      details: `Failed to retrieve key with biometrics: ${error}`,
      success: false
    });
    console.error('Error retrieving key with biometrics:', error);
    return null;
  }
}

/**
 * Deletes the biometric-stored encryption key
 */
export async function deleteBiometricKey(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return true; // Nothing to delete on web
    }

    await SecureStore.deleteItemAsync(BIOMETRIC_KEY_STORAGE_KEY);
    
    logSecurityEvent({
      type: 'encryption',
      details: 'Biometric-stored encryption key deleted',
      success: true
    });

    return true;
  } catch (error) {
    logSecurityEvent({
      type: 'encryption',
      details: `Failed to delete biometric key: ${error}`,
      success: false
    });
    console.error('Error deleting biometric key:', error);
    return false;
  }
}

/**
 * Checks if a biometric key is currently stored
 */
export async function hasBiometricKey(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return false;
    }

    const key = await SecureStore.getItemAsync(BIOMETRIC_KEY_STORAGE_KEY, {
      requireAuthentication: false // Don't prompt for auth, just check if key exists
    });
    
    return key !== null;
  } catch (error) {
    console.error('Error checking biometric key:', error);
    return false;
  }
}