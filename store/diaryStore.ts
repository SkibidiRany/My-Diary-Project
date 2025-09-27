// store/diaryStore.ts
import { create } from 'zustand';
import * as db from '../services/database';
import { deleteEntryFromFirestore, fetchEntriesFromFirestore, syncEntryToFirestore } from '../services/firestoreService';
import { encryptDiaryEntry, decryptDiaryEntry } from '../utils/encryption';

// Polyfill Buffer for React Native
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}
import { DiaryEntry } from '../types';
import { useSecurityStore } from './securityStore';

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
  exportDiary: () => Promise<string>;
  importDiary: (encryptedData: string) => Promise<void>;
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
      const entries = await db.fetchEntries();
      const { encryptionKey, legacyEncryptionKey, isUnlocked } = useSecurityStore.getState();
      
      if (isUnlocked && encryptionKey) {
        // Decrypt entries for display using smart decryption
        const decryptedEntries = await Promise.all(
          entries.map(entry => decryptDiaryEntry(entry, encryptionKey, legacyEncryptionKey || undefined))
        );
        set({ entries: decryptedEntries });
      } else {
        set({ entries });
      }
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
      const cloudEntries = await fetchEntriesFromFirestore();
      const { encryptionKey, legacyEncryptionKey, isUnlocked } = useSecurityStore.getState();
      
      if (isUnlocked && encryptionKey) {
        // Decrypt cloud entries before storing locally using smart decryption
        const decryptedEntries = await Promise.all(
          cloudEntries.map(entry => decryptDiaryEntry(entry, encryptionKey, legacyEncryptionKey || undefined))
        );
        for (const entry of decryptedEntries) {
          await db.upsertEntry(entry);
        }
      } else {
        // Store encrypted entries as-is if not unlocked
        for (const entry of cloudEntries) {
          await db.upsertEntry(entry);
        }
      }
    } catch (error) {
      console.error("Failed to sync from cloud:", error);
    }
  },

  addEntry: async (newEntry) => {
    try {
      const { encryptionKey, isUnlocked } = useSecurityStore.getState();
      console.log('🔐 Security state:', { isUnlocked, hasKey: !!encryptionKey, keyLength: encryptionKey?.length });
      
      const entryToSave: Omit<DiaryEntry, 'id'> = {
        ...newEntry,
        createdAt: new Date().toISOString(),
        modifiedAt: null,
      };
      
      let finalEntry: DiaryEntry;
      
      if (isUnlocked && encryptionKey) {
        // Encrypt the entry before saving
        console.log('🔐 Encrypting entry before saving:', { title: entryToSave.title, content: entryToSave.content?.substring(0, 50) + '...' });
        const encryptedEntry = await encryptDiaryEntry(entryToSave, encryptionKey);
        console.log('🔐 Encrypted entry:', { title: encryptedEntry.title, content: encryptedEntry.content?.substring(0, 50) + '...' });
        const newId = await db.addEntry(encryptedEntry);
        finalEntry = { ...encryptedEntry, id: newId };
      } else {
        // Save without encryption if not unlocked
        console.log('⚠️ Saving entry WITHOUT encryption (not unlocked or no key)');
        const newId = await db.addEntry(entryToSave);
        finalEntry = { ...entryToSave, id: newId };
      }
      
      await get().fetchEntries();
      await syncEntryToFirestore(finalEntry);
    } catch (error) {
      console.error("Failed to add entry:", error);
    }
  },

  updateEntry: async (id, entry) => {
    try {
      const { encryptionKey, isUnlocked } = useSecurityStore.getState();
      
      const entryToUpdate: DiaryEntry = {
        ...entry,
        modifiedAt: new Date().toISOString(),
      };
      
      let finalEntry: DiaryEntry;
      
      if (isUnlocked && encryptionKey) {
        // Encrypt the entry before saving
        finalEntry = await encryptDiaryEntry(entryToUpdate, encryptionKey);
      } else {
        finalEntry = entryToUpdate;
      }
      
      await db.updateEntry(id, finalEntry);
      await get().fetchEntries();
      await syncEntryToFirestore(finalEntry);
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

  exportDiary: async () => {
    try {
      const { encryptionKey, isUnlocked } = useSecurityStore.getState();
      
      if (!isUnlocked || !encryptionKey) {
        throw new Error('Diary must be unlocked to export');
      }
      
      const { encryptDiaryExport } = await import('../utils/encryption');
      return await encryptDiaryExport(get().entries, encryptionKey);
    } catch (error) {
      console.error("Failed to export diary:", error);
      throw error;
    }
  },

  importDiary: async (encryptedData) => {
    try {
      const { encryptionKey, isUnlocked } = useSecurityStore.getState();
      
      if (!isUnlocked || !encryptionKey) {
        throw new Error('Diary must be unlocked to import');
      }
      
      const { decryptDiaryExport } = await import('../utils/encryption');
      const importedEntries = await decryptDiaryExport(encryptedData, encryptionKey);
      
      // Add imported entries to the database
      for (const entry of importedEntries) {
        if (entry.id) {
          await db.upsertEntry(entry);
        }
      }
      
      await get().fetchEntries();
    } catch (error) {
      console.error("Failed to import diary:", error);
      throw error;
    }
  },
}));