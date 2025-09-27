// store/securityStore.ts
import { create } from 'zustand';
import { deriveKeyFromPassword, deriveKeyFromPasswordLegacy, generateSalt } from '../utils/encryption';
import { updateUserProfile, getUserProfile } from '../services/firestoreService';

// Polyfill Buffer for React Native
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

interface SecurityState {
  isUnlocked: boolean;
  encryptionKey: string | null;
  legacyEncryptionKey: string | null; // For backward compatibility
  salt: string | null;
  isInitialized: boolean;
  setMasterPassword: (password: string) => Promise<void>;
  unlockDiary: (password: string) => Promise<boolean>;
  lockDiary: () => void;
  initializeSecurity: (userId: string) => Promise<void>;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  isUnlocked: false,
  encryptionKey: null,
  legacyEncryptionKey: null,
  salt: null,
  isInitialized: false,

  setMasterPassword: async (password: string) => {
    try {
      console.log('🔐 Setting master password...');
      const salt = generateSalt();
      const key = await deriveKeyFromPassword(password, salt);
      const legacyKey = await deriveKeyFromPasswordLegacy(password, salt);
      
      console.log('🔐 Master password set successfully:', { 
        hasKey: !!key, 
        hasLegacyKey: !!legacyKey,
        keyLength: key?.length,
        saltLength: salt?.length 
      });
      
      set({ 
        encryptionKey: key, 
        legacyEncryptionKey: legacyKey,
        salt, 
        isUnlocked: true,
        isInitialized: true 
      });
      
      // Store salt in user profile
      const auth = require('../services/firebase').auth;
      const userId = auth.currentUser?.uid;
      if (userId) {
        console.log('🔐 Storing salt in user profile:', { userId, saltLength: salt.length });
        await updateUserProfile(userId, { encryptionSalt: salt });
        console.log('🔐 Salt stored in user profile successfully');
      } else {
        console.error('❌ No user ID available to store salt');
      }
    } catch (error) {
      console.error('Failed to set master password:', error);
      throw error;
    }
  },

  unlockDiary: async (password: string) => {
    try {
      const { salt } = get();
      console.log('🔓 Attempting to unlock diary:', { hasSalt: !!salt, saltLength: salt?.length });
      if (!salt) {
        throw new Error('No salt found. Please set up master password first.');
      }
      
      const key = await deriveKeyFromPassword(password, salt);
      const legacyKey = await deriveKeyFromPasswordLegacy(password, salt);
      console.log('🔓 Unlock successful:', { hasKey: !!key, hasLegacyKey: !!legacyKey, keyLength: key?.length });
      set({ encryptionKey: key, legacyEncryptionKey: legacyKey, isUnlocked: true });
      return true;
    } catch (error) {
      console.error('Failed to unlock diary:', error);
      return false;
    }
  },

  lockDiary: () => {
    set({ 
      isUnlocked: false, 
      encryptionKey: null,
      legacyEncryptionKey: null
    });
  },

  initializeSecurity: async (userId: string) => {
    try {
      const { isInitialized } = get();
      if (isInitialized) {
        console.log('🔐 Security already initialized, skipping...');
        return;
      }
      
      console.log('🔐 Initializing security for user:', userId);
      const userProfile = await getUserProfile(userId);
      console.log('🔐 User profile loaded:', { 
        hasProfile: !!userProfile, 
        hasEncryptionSalt: !!userProfile?.encryptionSalt,
        saltLength: userProfile?.encryptionSalt?.length 
      });
      
      if (userProfile?.encryptionSalt) {
        console.log('🔐 Security initialized with existing salt');
        set({ 
          salt: userProfile.encryptionSalt,
          isInitialized: true 
        });
      } else {
        console.log('🔐 No encryption salt found - user needs to set master password');
        // Security is initialized but user needs to set master password
        set({ isInitialized: true });
      }
    } catch (error) {
      console.error('Failed to initialize security:', error);
      set({ isInitialized: true });
    }
  },
}));
