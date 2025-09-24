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
  modifiedAt?: string | null; 
  isPrivate: boolean;
}