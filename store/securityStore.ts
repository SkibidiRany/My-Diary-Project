// store/securityStore.ts - Master Password Security Management
import { create } from 'zustand';
import { User } from 'firebase/auth';
import { 
  generateSalt, 
  deriveKeyFromPassword, 
  verifyPassword, 
  createKeyCheck,
  validateMasterPassword,
  getSecurityAuditLog,
  clearSecurityAuditLog
} from '../utils/encryption';
import { updateUserProfile, getUserProfile } from '../services/firestoreService';

interface SecurityState {
  // Master password state
  isUnlocked: boolean;
  masterPassword: string | null;
  encryptionKey: string | null;
  salt: string | null;
  keyCheck: string | null;
  
  // User state
  currentUserId: string | null;
  isInitialized: boolean;
  
  // Actions
  setMasterPassword: (password: string) => Promise<void>;
  unlockDiary: (password: string) => Promise<boolean>;
  lockDiary: () => void;
  initializeSecurity: (userId: string) => Promise<void>;
  clearSecurityData: () => void;
  getSecurityStatus: () => {
    isUnlocked: boolean;
    hasMasterPassword: boolean;
    isInitialized: boolean;
  };
  getSecurityAuditLog: () => any[];
  clearAuditLog: () => void;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  // Initial state
  isUnlocked: false,
  masterPassword: null,
  encryptionKey: null,
  salt: null,
  keyCheck: null,
  currentUserId: null,
  isInitialized: false,

  /**
   * Sets up master password for the first time
   */
  setMasterPassword: async (password: string) => {
    try {
      console.log('🔐 Setting up master password...');
      
      // Validate password strength
      const validation = validateMasterPassword(password);
      if (!validation.valid) {
        throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
      }

      const state = get();
      if (!state.currentUserId) {
        throw new Error('User not authenticated');
      }

      // Generate salt and derive key
      const salt = generateSalt();
      const encryptionKey = deriveKeyFromPassword(password, salt);
      const keyCheck = createKeyCheck(password, salt);

      // Store encryption metadata in user profile
      await updateUserProfile(state.currentUserId, {
        encryptionSalt: salt,
        keyCheck: keyCheck,
        hasEncryption: true
      });

      // Update state
      set({
        isUnlocked: true,
        masterPassword: password,
        encryptionKey: encryptionKey,
        salt: salt,
        keyCheck: keyCheck,
      });

      console.log('✅ Master password set successfully');
    } catch (error) {
      console.error('❌ Failed to set master password:', error);
      throw error;
    }
  },

  /**
   * Unlocks diary with master password
   */
  unlockDiary: async (password: string): Promise<boolean> => {
    try {
      console.log('🔓 Attempting to unlock diary...');
      
      const state = get();
      if (!state.isInitialized || !state.salt || !state.keyCheck) {
        console.error('Security not initialized or missing encryption data');
        return false;
      }

      // Verify password using key check
      const isValid = verifyPassword(password, state.salt, state.keyCheck);
      
      if (isValid) {
        // Derive encryption key
        const encryptionKey = deriveKeyFromPassword(password, state.salt);
        
        // Update state
        set({
          isUnlocked: true,
          masterPassword: password,
          encryptionKey: encryptionKey,
        });
        
        console.log('✅ Diary unlocked successfully');
        return true;
      } else {
        console.log('❌ Invalid master password');
        set({ isUnlocked: false });
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to unlock diary:', error);
      set({ isUnlocked: false });
      return false;
    }
  },

  /**
   * Locks the diary and clears sensitive data from memory
   */
  lockDiary: () => {
    console.log('🔒 Locking diary...');
    set({
      isUnlocked: false,
      masterPassword: null,
      encryptionKey: null,
    });
    console.log('✅ Diary locked');
  },


  /**
   * Initializes security for a user
   */
  initializeSecurity: async (userId: string) => {
    try {
      console.log(`🔐 Initializing security for user ${userId}...`);
      
      // Get user profile to check for existing encryption data
      const userProfile = await getUserProfile(userId);
      console.log('👤 User profile:', { 
        hasEncryption: userProfile?.hasEncryption, 
        hasSalt: !!userProfile?.encryptionSalt, 
        hasKeyCheck: !!userProfile?.keyCheck 
      });
      
      if (userProfile?.hasEncryption && userProfile.encryptionSalt && userProfile.keyCheck) {
        // User has encryption set up
        set({
          currentUserId: userId,
          isInitialized: true,
          salt: userProfile.encryptionSalt,
          keyCheck: userProfile.keyCheck,
        });
        console.log('✅ Security initialized - encryption enabled');
      } else {
        // User doesn't have encryption set up yet
        set({
          currentUserId: userId,
          isInitialized: true,
        });
        console.log('✅ Security initialized - no encryption yet');
      }
    } catch (error) {
      console.error('❌ Failed to initialize security:', error);
      throw error;
    }
  },

  /**
   * Clears all security data
   */
  clearSecurityData: () => {
    console.log('🗑️ Clearing security data...');
    set({
      isUnlocked: false,
      masterPassword: null,
      encryptionKey: null,
      salt: null,
      keyCheck: null,
      currentUserId: null,
      isInitialized: false,
    });
    console.log('✅ Security data cleared');
  },

  /**
   * Gets current security status
   */
  getSecurityStatus: () => {
    const state = get();
    return {
      isUnlocked: state.isUnlocked,
      hasMasterPassword: !!state.salt && !!state.keyCheck,
      isInitialized: state.isInitialized,
    };
  },

  /**
   * Gets security audit log
   */
  getSecurityAuditLog: () => {
    return getSecurityAuditLog();
  },

  /**
   * Clears security audit log
   */
  clearAuditLog: () => {
    clearSecurityAuditLog();
  },

}));
