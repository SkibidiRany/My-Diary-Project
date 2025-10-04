// types/index.ts

/**
 * This is the blueprint for a single diary entry.
 * It defines all the properties an entry can have.
 */
export interface DiaryEntry {
  id?: number; // The database will generate this, so it's optional
  title: string;
  content: string;
  emoji: string | null;
  imageUri: string | null;
  createdAt: string;
  createdFor: string; // The date this entry was written for (not when it was created)
  modifiedAt?: string | null; 
  isPrivate: boolean;
  categoryIds?: number[]; // Array of category IDs this entry belongs to
}

/**
 * This is the blueprint for a category.
 * Categories help organize diary entries.
 */
export interface Category {
  id?: number; // The database will generate this, so it's optional
  name: string;
  color: string; // Hex color code for visual identification
  icon?: string; // Emoji or icon identifier
  createdAt: string;
  modifiedAt?: string | null;
  isDefault: boolean; // Whether it's a system-created default category
}

/**
 * Junction table interface for many-to-many relationship between entries and categories
 */
export interface EntryCategory {
  entryId: number;
  categoryId: number;
}

/**
 * Defines the structure for a user's public-facing profile data.
 */
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  username?: string;
  birthdate?: string;
  pronouns?: string;
  bio?: string;
  // Encryption fields
  hasEncryption?: boolean;
  encryptionSalt?: string;
  keyCheck?: string;
}

/**
 * Interface for diary export data
 */
export interface DiaryExport {
  version: string;
  timestamp: string;
  entries: DiaryEntry[];
}