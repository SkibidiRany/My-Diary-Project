// services/authService.native.ts
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { onAuthStateChanged, User } from 'firebase/auth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import React from 'react';
import { auth } from './firebase';
import { useDiaryStore } from '../store/diaryStore';

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
  await GoogleSignin.revokeAccess();
  await GoogleSignin.signOut();
  await auth.signOut();
  await useDiaryStore.getState().clearLocalData();
}

export function useAuthentication() {
  const [user, setUser] = React.useState<User>();
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? undefined);
    });
    return unsubscribe;
  }, []);
  return { user };
}