// services/database.ts
import * as SQLite from 'expo-sqlite';
import { DiaryEntry } from '../types';

// Use the ASYNC method to open the database, which is safe for web
const dbPromise = SQLite.openDatabaseAsync('diary.db');

export const initDatabase = async () => {
  const db = await dbPromise;
  await db.execAsync(`PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS entries (id INTEGER PRIMARY KEY NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, emoji TEXT, imageUri TEXT, createdAt TEXT NOT NULL, modifiedAt TEXT, isPrivate INTEGER NOT NULL DEFAULT 0);`);
};

export const addEntry = async (entry: Omit<DiaryEntry, 'id'>): Promise<number> => {
  const db = await dbPromise;
  const result = await db.runAsync(
    'INSERT INTO entries (title, content, emoji, imageUri, createdAt, modifiedAt, isPrivate) VALUES (?, ?, ?, ?, ?, ?, ?)',
    entry.title, entry.content, entry.emoji, entry.imageUri, entry.createdAt, entry.modifiedAt ?? null, entry.isPrivate ? 1 : 0
  );
  return result.lastInsertRowId;
};

export const upsertEntry = async (entry: DiaryEntry) => {
  const db = await dbPromise;
  await db.runAsync(
      `INSERT INTO entries (id, title, content, emoji, imageUri, createdAt, modifiedAt, isPrivate) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, content = excluded.content, emoji = excluded.emoji, imageUri = excluded.imageUri, createdAt = excluded.createdAt, modifiedAt = excluded.modifiedAt, isPrivate = excluded.isPrivate;`,
      entry.id!, entry.title, entry.content, entry.emoji, entry.imageUri, entry.createdAt, entry.modifiedAt ?? null, entry.isPrivate ? 1 : 0
  );
};

export const fetchEntries = async (): Promise<DiaryEntry[]> => {
  const db = await dbPromise;
  const allRows = await db.getAllAsync<DiaryEntry>('SELECT * FROM entries ORDER BY createdAt DESC');
  return allRows.map(row => ({ ...row, isPrivate: !!row.isPrivate }));
};

export const updateEntry = async (id: number, entry: DiaryEntry) => {
  const db = await dbPromise;
  await db.runAsync(
    'UPDATE entries SET title = ?, content = ?, emoji = ?, imageUri = ?, isPrivate = ?, modifiedAt = ? WHERE id = ?',
    entry.title, entry.content, entry.emoji, entry.imageUri, entry.isPrivate ? 1 : 0, entry.modifiedAt ?? null, id
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