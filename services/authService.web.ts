// services/authService.web.ts
console.log('🌐 [authService.web.ts] Loading WEB authentication service');
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import React from 'react';
import { auth } from './firebase';
import { useDiaryStore } from '../store/diaryStore';

// Use Firebase compat types for consistency
type User = firebase.User;

export async function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  return auth.signInWithPopup(provider);
}

export async function signOut() {
  console.log('🔥 [WEB] Starting sign out process...');
  try {
    console.log('🔥 [WEB] Calling auth.signOut()...');
    await auth.signOut();
    console.log('🔥 [WEB] Firebase auth.signOut() completed');
    
    console.log('🔥 [WEB] Clearing local data...');
    await useDiaryStore.getState().clearLocalData();
    console.log('🔥 [WEB] Local data cleared');
    
    console.log('✅ [WEB] Sign out completed successfully');
  } catch (error) {
    console.error('❌ [WEB] Error during sign out:', error);
    throw error;
  }
}

export function useAuthentication() {
  const [user, setUser] = React.useState<User | null>(null);
  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });
    return unsubscribe;
  }, []);
  return { user };
}