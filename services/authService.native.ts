// services/authService.native.ts
console.log('📱 [authService.native.ts] Loading NATIVE authentication service');
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import React from 'react';
import { auth } from './firebase';
import { useDiaryStore } from '../store/diaryStore';

// Use Firebase compat types for consistency
type User = firebase.User;

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
});

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices();
  await GoogleSignin.signIn();
  const { idToken } = await GoogleSignin.getTokens();
  if (!idToken) throw new Error('Google Sign-In failed: no idToken returned.');
  const googleCredential = firebase.auth.GoogleAuthProvider.credential(idToken);
  return auth.signInWithCredential(googleCredential);
}

export async function signOut() {
  console.log('🔥 [NATIVE] Starting sign out process...');
  try {
    console.log('🔥 [NATIVE] Revoking Google access...');
    await GoogleSignin.revokeAccess();
    console.log('🔥 [NATIVE] Google access revoked');
    
    console.log('🔥 [NATIVE] Signing out from Google...');
    await GoogleSignin.signOut();
    console.log('🔥 [NATIVE] Google sign out completed');
    
    console.log('🔥 [NATIVE] Calling auth.signOut()...');
    await auth.signOut();
    console.log('🔥 [NATIVE] Firebase auth.signOut() completed');
    
    console.log('🔥 [NATIVE] Clearing local data...');
    await useDiaryStore.getState().clearLocalData();
    console.log('🔥 [NATIVE] Local data cleared');
    
    console.log('✅ [NATIVE] Sign out completed successfully');
  } catch (error) {
    console.error('❌ [NATIVE] Error during sign out:', error);
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