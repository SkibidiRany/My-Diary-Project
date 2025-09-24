// store/diaryStore.ts
import { create } from 'zustand';
import * as db from '../services/database';
import { deleteEntryFromFirestore, fetchEntriesFromFirestore, syncEntryToFirestore } from '../services/firestoreService';
import { DiaryEntry } from '../types';

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
      const cloudEntries = await fetchEntriesFromFirestore();
      for (const entry of cloudEntries) {
        await db.upsertEntry(entry);
      }
    } catch (error) {
      console.error("Failed to sync from cloud:", error);
    }
  },

  addEntry: async (newEntry) => {
    try {
      const entryToSave: Omit<DiaryEntry, 'id'> = {
        ...newEntry,
        createdAt: new Date().toISOString(),
        modifiedAt: null,
      };
      const newId = await db.addEntry(entryToSave);
      const finalEntry = { ...entryToSave, id: newId };
      await get().fetchEntries();
      await syncEntryToFirestore(finalEntry);
    } catch (error) {
      console.error("Failed to add entry:", error);
    }
  },

  updateEntry: async (id, entry) => {
    try {
      const entryToUpdate: DiaryEntry = {
        ...entry,
        modifiedAt: new Date().toISOString(),
      };
      await db.updateEntry(id, entryToUpdate);
      await get().fetchEntries();
      await syncEntryToFirestore(entryToUpdate);
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
}));