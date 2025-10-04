// services/database.ts
import * as SQLite from 'expo-sqlite';
import { DiaryEntry, Category } from '../types';
import { encryptString, decryptString, encryptDiaryEntry, decryptDiaryEntry } from '../utils/encryption';

// Polyfill Buffer for React Native
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// Use the ASYNC method to open the database, which is safe for web
const dbPromise = SQLite.openDatabaseAsync('diary.db');

export const initDatabase = async () => {
  const db = await dbPromise;
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      emoji TEXT,
      imageUri TEXT,
      createdAt TEXT NOT NULL,
      createdFor TEXT NOT NULL,
      modifiedAt TEXT,
      isPrivate INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL,
      icon TEXT,
      createdAt TEXT NOT NULL,
      modifiedAt TEXT,
      isDefault INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS entry_categories (
      entryId INTEGER NOT NULL,
      categoryId INTEGER NOT NULL,
      PRIMARY KEY (entryId, categoryId),
      FOREIGN KEY (entryId) REFERENCES entries(id) ON DELETE CASCADE,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
    );
  `);
  
  // Check if createdFor column exists, if not add it and migrate existing data
  await migrateDatabase();
};

const migrateDatabase = async () => {
  const db = await dbPromise;
  
  try {
    // Check if createdFor column exists
    const tableInfo = await db.getAllAsync("PRAGMA table_info(entries)");
    const hasCreatedFor = tableInfo.some((column: any) => column.name === 'createdFor');
    
    if (!hasCreatedFor) {
      console.log('🔄 Migrating database: Adding createdFor column...');
      
      // Add the createdFor column
      await db.execAsync(`
        ALTER TABLE entries ADD COLUMN createdFor TEXT;
      `);
      
      // Update existing entries to set createdFor = createdAt
      await db.execAsync(`
        UPDATE entries SET createdFor = createdAt WHERE createdFor IS NULL;
      `);
      
      // Make createdFor NOT NULL after setting values
      await db.execAsync(`
        CREATE TABLE entries_new (
          id INTEGER PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          emoji TEXT,
          imageUri TEXT,
          createdAt TEXT NOT NULL,
          createdFor TEXT NOT NULL,
          modifiedAt TEXT,
          isPrivate INTEGER NOT NULL DEFAULT 0
        );
      `);
      
      await db.execAsync(`
        INSERT INTO entries_new SELECT * FROM entries;
      `);
      
      await db.execAsync(`
        DROP TABLE entries;
      `);
      
      await db.execAsync(`
        ALTER TABLE entries_new RENAME TO entries;
      `);
      
      console.log('✅ Database migration completed successfully');
    }

    // Categories table is ready - no default categories will be created
    console.log('✅ Categories table ready');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    throw error;
  }
};


export const addEntry = async (entry: Omit<DiaryEntry, 'id'>, encryptionKey?: string): Promise<number> => {
  const db = await dbPromise;
  
  let entryToStore = entry;
  
  // Encrypt entry if encryption key is provided
  if (encryptionKey) {
    entryToStore = encryptDiaryEntry(entry as DiaryEntry, encryptionKey);
  }
  
  const result = await db.runAsync(
    'INSERT INTO entries (title, content, emoji, imageUri, createdAt, createdFor, modifiedAt, isPrivate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    entryToStore.title, 
    entryToStore.content, 
    entryToStore.emoji || null, 
    entryToStore.imageUri || null, 
    entryToStore.createdAt, 
    entryToStore.createdFor,
    entryToStore.modifiedAt || null, 
    entryToStore.isPrivate ? 1 : 0
  );
  return result.lastInsertRowId;
};

export const upsertEntry = async (entry: DiaryEntry, encryptionKey?: string) => {
  const db = await dbPromise;
  
  let entryToStore = entry;
  
  // Encrypt entry if encryption key is provided
  if (encryptionKey) {
    entryToStore = encryptDiaryEntry(entry, encryptionKey);
  }
  
  await db.runAsync(
      `INSERT INTO entries (id, title, content, emoji, imageUri, createdAt, createdFor, modifiedAt, isPrivate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, content = excluded.content, emoji = excluded.emoji, imageUri = excluded.imageUri, createdAt = excluded.createdAt, createdFor = excluded.createdFor, modifiedAt = excluded.modifiedAt, isPrivate = excluded.isPrivate;`,
      entryToStore.id!, 
      entryToStore.title, 
      entryToStore.content, 
      entryToStore.emoji || null, 
      entryToStore.imageUri || null, 
      entryToStore.createdAt, 
      entryToStore.createdFor,
      entryToStore.modifiedAt || null, 
      entryToStore.isPrivate ? 1 : 0
  );
};

export const fetchEntries = async (encryptionKey?: string): Promise<DiaryEntry[]> => {
  const db = await dbPromise;
  const allRows = await db.getAllAsync<DiaryEntry>('SELECT * FROM entries ORDER BY createdAt DESC');
  
  // Decrypt all entries if encryption key is provided
  if (encryptionKey) {
    const decryptedEntries: DiaryEntry[] = [];
    
    for (const row of allRows) {
      try {
        const decryptedEntry = decryptDiaryEntry({ ...row, isPrivate: !!row.isPrivate }, encryptionKey);
        decryptedEntries.push(decryptedEntry);
      } catch (error) {
        console.error(`Failed to decrypt entry ${row.id}:`, error);
        // If decryption fails, try to return the entry as-is (might be plaintext)
        decryptedEntries.push({ ...row, isPrivate: !!row.isPrivate });
      }
    }
    
    return decryptedEntries;
  } else {
    // Return entries as-is if no encryption key provided
    return allRows.map(row => ({ ...row, isPrivate: !!row.isPrivate }));
  }
};

export const updateEntry = async (id: number, entry: DiaryEntry, encryptionKey?: string) => {
  const db = await dbPromise;
  
  let entryToStore = entry;
  
  // Encrypt entry if encryption key is provided
  if (encryptionKey) {
    entryToStore = encryptDiaryEntry(entry, encryptionKey);
  }
  
  await db.runAsync(
    'UPDATE entries SET title = ?, content = ?, emoji = ?, imageUri = ?, createdAt = ?, createdFor = ?, isPrivate = ?, modifiedAt = ? WHERE id = ?',
    entryToStore.title, 
    entryToStore.content, 
    entryToStore.emoji || null, 
    entryToStore.imageUri || null, 
    entryToStore.createdAt,
    entryToStore.createdFor,
    entryToStore.isPrivate ? 1 : 0, 
    entryToStore.modifiedAt || null, 
    id
  );
};

export const deleteEntry = async (id: number) => {
  const db = await dbPromise;
  await db.runAsync('DELETE FROM entries WHERE id = ?', id);
};

export const clearDatabase = async () => {
  const db = await dbPromise;
  await db.execAsync('DELETE FROM entries;');
};

// ===== CATEGORY DATABASE FUNCTIONS =====

export const addCategory = async (category: Omit<Category, 'id'>): Promise<number> => {
  const db = await dbPromise;
  
  const result = await db.runAsync(
    'INSERT INTO categories (name, color, icon, createdAt, modifiedAt, isDefault) VALUES (?, ?, ?, ?, ?, ?)',
    category.name,
    category.color,
    category.icon || null,
    category.createdAt,
    category.modifiedAt || null,
    category.isDefault ? 1 : 0
  );
  return result.lastInsertRowId;
};

export const fetchCategories = async (): Promise<Category[]> => {
  const db = await dbPromise;
  const allRows = await db.getAllAsync<Category>('SELECT * FROM categories ORDER BY name ASC');
  
  return allRows.map(row => ({
    ...row,
    isDefault: !!row.isDefault
  }));
};

export const updateCategory = async (id: number, category: Category) => {
  const db = await dbPromise;
  
  await db.runAsync(
    'UPDATE categories SET name = ?, color = ?, icon = ?, modifiedAt = ? WHERE id = ?',
    category.name,
    category.color,
    category.icon || null,
    category.modifiedAt || null,
    id
  );
};

export const deleteCategory = async (id: number) => {
  const db = await dbPromise;
  
  // First check if it's a default category
  const category = await db.getFirstAsync('SELECT isDefault FROM categories WHERE id = ?', id);
  if (category && (category as any).isDefault) {
    throw new Error('Cannot delete default categories');
  }
  
  // Delete all entry-category relationships first
  await db.runAsync('DELETE FROM entry_categories WHERE categoryId = ?', id);
  
  // Then delete the category
  await db.runAsync('DELETE FROM categories WHERE id = ?', id);
};

// ===== ENTRY-CATEGORY RELATIONSHIP FUNCTIONS =====

export const addEntryToCategory = async (entryId: number, categoryId: number) => {
  const db = await dbPromise;
  
  try {
    await db.runAsync(
      'INSERT INTO entry_categories (entryId, categoryId) VALUES (?, ?)',
      entryId,
      categoryId
    );
  } catch (error) {
    // Ignore unique constraint violations (entry already in category)
    if (!(error as any).message?.includes('UNIQUE constraint failed')) {
      throw error;
    }
  }
};

export const removeEntryFromCategory = async (entryId: number, categoryId: number) => {
  const db = await dbPromise;
  await db.runAsync(
    'DELETE FROM entry_categories WHERE entryId = ? AND categoryId = ?',
    entryId,
    categoryId
  );
};

export const getEntryCategories = async (entryId: number): Promise<Category[]> => {
  const db = await dbPromise;
  const rows = await db.getAllAsync<Category>(`
    SELECT c.* FROM categories c
    INNER JOIN entry_categories ec ON c.id = ec.categoryId
    WHERE ec.entryId = ?
    ORDER BY c.name ASC
  `, entryId);
  
  return rows.map(row => ({
    ...row,
    isDefault: !!row.isDefault
  }));
};

export const getCategoryEntries = async (categoryId: number): Promise<DiaryEntry[]> => {
  const db = await dbPromise;
  const rows = await db.getAllAsync<DiaryEntry>(`
    SELECT e.* FROM entries e
    INNER JOIN entry_categories ec ON e.id = ec.entryId
    WHERE ec.categoryId = ?
    ORDER BY e.createdAt DESC
  `, categoryId);
  
  return rows.map(row => ({ ...row, isPrivate: !!row.isPrivate }));
};

export const setEntryCategories = async (entryId: number, categoryIds: number[]) => {
  const db = await dbPromise;
  
  // Remove all existing relationships for this entry
  await db.runAsync('DELETE FROM entry_categories WHERE entryId = ?', entryId);
  
  // Add new relationships
  for (const categoryId of categoryIds) {
    await addEntryToCategory(entryId, categoryId);
  }
};

export const getEntriesWithCategories = async (encryptionKey?: string): Promise<DiaryEntry[]> => {
  const db = await dbPromise;
  const allRows = await db.getAllAsync<DiaryEntry>('SELECT * FROM entries ORDER BY createdAt DESC');
  
  // Decrypt all entries if encryption key is provided
  let entries: DiaryEntry[];
  if (encryptionKey) {
    const decryptedEntries: DiaryEntry[] = [];
    
    for (const row of allRows) {
      try {
        const decryptedEntry = decryptDiaryEntry({ ...row, isPrivate: !!row.isPrivate }, encryptionKey);
        decryptedEntries.push(decryptedEntry);
      } catch (error) {
        console.error(`Failed to decrypt entry ${row.id}:`, error);
        // If decryption fails, try to return the entry as-is (might be plaintext)
        decryptedEntries.push({ ...row, isPrivate: !!row.isPrivate });
      }
    }
    
    entries = decryptedEntries;
  } else {
    // Return entries as-is if no encryption key provided
    entries = allRows.map(row => ({ ...row, isPrivate: !!row.isPrivate }));
  }

  // Fetch categories for each entry
  for (const entry of entries) {
    if (entry.id) {
      entry.categoryIds = (await getEntryCategories(entry.id)).map(cat => cat.id!);
    }
  }

  return entries;
};