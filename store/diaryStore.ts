// store/diaryStore.ts
import { create } from 'zustand';
import * as db from '../services/database';
import { deleteEntryFromFirestore, fetchEntriesFromFirestore, syncEntryToFirestore } from '../services/firestoreService';
import { DiaryEntry } from '../types';
import { useSecurityStore } from './securityStore';
import { createEncryptedBackup, restoreFromBackup } from '../utils/encryption';

// Polyfill Buffer for React Native
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

interface DiaryState {
  entries: DiaryEntry[];
  isInitialized: boolean;
  initialize: () => Promise<void>;
  fetchEntries: () => Promise<void>;
  addEntry: (newEntry: Omit<DiaryEntry, 'id' | 'createdAt' | 'modifiedAt'>) => Promise<void>;
  updateEntry: (id: number, entry: DiaryEntry) => Promise<void>;
  deleteEntry: (id: number) => Promise<void>;
  clearLocalData: () => Promise<void>;
  syncCloudToLocal: () => Promise<void>;
  exportDiary: (masterPassword: string) => Promise<string>;
  importDiary: (backupData: string, masterPassword: string) => Promise<void>;
}

export const useDiaryStore = create<DiaryState>((set, get) => ({
  entries: [],
  isInitialized: false,

  initialize: async () => {
    try {
      if (!get().isInitialized) {
        await db.initDatabase();
        set({ isInitialized: true });
      }
      await get().fetchEntries();
    } catch (error) {
      console.error("Failed to initialize database:", error);
    }
  },

  fetchEntries: async () => {
    try {
      const securityState = useSecurityStore.getState();
      const entries = await db.fetchEntries(securityState.encryptionKey || undefined);
      set({ entries });
    } catch (error) {
      console.error("Failed to fetch entries:", error);
    }
  },

  clearLocalData: async () => {
    await db.clearDatabase();
    set({ entries: [], isInitialized: false });
  },

  syncCloudToLocal: async () => {
    try {
      const securityState = useSecurityStore.getState();
      const cloudEntries = await fetchEntriesFromFirestore(securityState.encryptionKey || undefined);
      for (const entry of cloudEntries) {
        await db.upsertEntry(entry, securityState.encryptionKey || undefined);
      }
      await get().fetchEntries();
    } catch (error) {
      console.error("Failed to sync from cloud:", error);
    }
  },

  addEntry: async (newEntry) => {
    try {
      const securityState = useSecurityStore.getState();
      console.log('🔐 Adding entry with security state:', {
        isUnlocked: securityState.isUnlocked,
        hasEncryptionKey: !!securityState.encryptionKey,
        hasSalt: !!securityState.salt
      });
      
      const entryToSave: Omit<DiaryEntry, 'id'> = {
        ...newEntry,
        createdAt: new Date().toISOString(),
        modifiedAt: null,
      };
      
      const newId = await db.addEntry(entryToSave, securityState.encryptionKey || undefined);
      const finalEntry = { ...entryToSave, id: newId };
      
      await get().fetchEntries();
      await syncEntryToFirestore(finalEntry, securityState.encryptionKey || undefined);
    } catch (error) {
      console.error("Failed to add entry:", error);
    }
  },

  updateEntry: async (id, entry) => {
    try {
      const securityState = useSecurityStore.getState();
      const entryToUpdate: DiaryEntry = {
        ...entry,
        modifiedAt: new Date().toISOString(),
      };
      
      await db.updateEntry(id, entryToUpdate, securityState.encryptionKey || undefined);
      await get().fetchEntries();
      await syncEntryToFirestore(entryToUpdate, securityState.encryptionKey || undefined);
    } catch (error) {
      console.error("Failed to update entry:", error);
    }
  },

  deleteEntry: async (id) => {
    try {
      await db.deleteEntry(id);
      await get().fetchEntries();
      await deleteEntryFromFirestore(id);
    } catch (error) {
      console.error("Failed to delete entry:", error);
    }
  },

  exportDiary: async (masterPassword: string) => {
    try {
      const securityState = useSecurityStore.getState();
      if (!securityState.isUnlocked) {
        throw new Error('Diary must be unlocked to export');
      }
      
      return createEncryptedBackup(get().entries, masterPassword);
    } catch (error) {
      console.error("Failed to export diary:", error);
      throw error;
    }
  },

  importDiary: async (backupData: string, masterPassword: string) => {
    try {
      const securityState = useSecurityStore.getState();
      if (!securityState.isUnlocked) {
        throw new Error('Diary must be unlocked to import');
      }
      
      console.log('🔄 Starting diary import process...');
      const importedEntries = restoreFromBackup(backupData, masterPassword);
      console.log(`📥 Restored ${importedEntries.length} entries from backup`);
      
      // Add imported entries to both local database and Firebase
      for (const entry of importedEntries) {
        if (entry.id) {
          console.log(`🔄 Importing entry ${entry.id}: ${entry.title}`);
          
          // Save to local database
          await db.upsertEntry(entry, securityState.encryptionKey || undefined);
          console.log(`✅ Entry ${entry.id} saved to local database`);
          
          // Sync to Firebase
          try {
            await syncEntryToFirestore(entry, securityState.encryptionKey || undefined);
            console.log(`✅ Entry ${entry.id} synced to Firebase`);
          } catch (syncError) {
            console.error(`❌ Failed to sync entry ${entry.id} to Firebase:`, syncError);
            // Continue with other entries even if one fails to sync
          }
        }
      }
      
      // Refresh local entries to reflect the imported data
      await get().fetchEntries();
      console.log('✅ Import process completed successfully');
    } catch (error) {
      console.error("❌ Failed to import diary:", error);
      throw error;
    }
  },
}));