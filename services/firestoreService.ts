// services/firestoreService.ts
import { DiaryEntry, UserProfile } from '../types';
import { auth, db, storage } from './firebase';

// Polyfill Buffer for React Native
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// --- IMAGE UPLOAD ---
export const uploadImageAndGetURL = async (uri: string): Promise<string> => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated for image upload.');

  // Create a blob from the local file URI
  const response = await fetch(uri);
  const blob = await response.blob();
  
  // Create a reference in Firebase Storage
  const fileRef = storage.ref(`diaries/${userId}/${new Date().getTime()}`);
  await fileRef.put(blob);
  
  // Get the public URL for the uploaded file
  return await fileRef.getDownloadURL();
};

// --- FIRESTORE DIARY ENTRY SYNC ---
const getEntriesCollection = () => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated for Firestore operations.');
  // This creates a user-specific path: /users/{userId}/entries
  return db.collection('users').doc(userId).collection('entries');
};

export const syncEntryToFirestore = (entry: DiaryEntry) => {
  if (!entry.id) return Promise.reject("Entry requires an ID to be synced.");
  console.log('☁️ Syncing entry to Firebase:', { 
    id: entry.id, 
    title: entry.title?.substring(0, 30) + '...', 
    content: entry.content?.substring(0, 30) + '...',
    isEncrypted: entry.title?.includes('encrypted') || entry.content?.includes('encrypted')
  });
  const entryRef = getEntriesCollection().doc(entry.id.toString());
  // set with merge:true will create the doc if it doesn't exist, or update it if it does.
  return entryRef.set(entry, { merge: true });
};

export const deleteEntryFromFirestore = (entryId: number) => {
  const entryRef = getEntriesCollection().doc(entryId.toString());
  return entryRef.delete();
};

export const fetchEntriesFromFirestore = async (): Promise<DiaryEntry[]> => {
  const entriesSnapshot = await getEntriesCollection().get();
  return entriesSnapshot.docs.map(doc => doc.data() as DiaryEntry);
};

// --- FIRESTORE USER PROFILE SYNC ---

/**
 * Retrieves a user's profile document from Firestore.
 * @param userId The unique ID of the user.
 * @returns The user's profile data or null if not found.
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userDocRef = db.collection('users').doc(userId);
  const docSnap = await userDocRef.get();

  if (docSnap.exists) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

/**
 * Creates or updates a user's profile document in Firestore.
 * @param userId The unique ID of the user.
 * @param data An object containing the profile fields to create or update.
 */
export const updateUserProfile = async (userId: string, data: Partial<UserProfile>): Promise<void> => {
  const userDocRef = db.collection('users').doc(userId);
  // Using set with merge: true creates the doc if it doesn't exist,
  // and updates it if it does, without overwriting existing fields.
  await userDocRef.set(data, { merge: true });
};