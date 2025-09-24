// services/authService.web.ts
import { onAuthStateChanged, User } from 'firebase/auth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import React from 'react';
import { auth } from './firebase';
import { useDiaryStore } from '../store/diaryStore';

export async function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  return auth.signInWithPopup(provider);
}

export async function signOut() {
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