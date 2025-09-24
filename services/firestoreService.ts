// services/firestoreService.ts
import { DiaryEntry } from '../types';
import { auth, db, storage } from './firebase';

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

// --- FIRESTORE DATA SYNC ---
const getEntriesCollection = () => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated for Firestore operations.');
  // This creates a user-specific path: /users/{userId}/entries
  return db.collection('users').doc(userId).collection('entries');
};

export const syncEntryToFirestore = (entry: DiaryEntry) => {
  if (!entry.id) return Promise.reject("Entry requires an ID to be synced.");
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

