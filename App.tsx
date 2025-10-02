import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { onAuthStateChanged, User } from 'firebase/auth';

import AppNavigator from './navigation/AppNavigator';
import LoginScreen from './screens/LoginScreen';
import { auth } from './services/firebase';
import { useDiaryStore } from './store/diaryStore';
import { useSecurityStore } from './store/securityStore';
import { useUserStore } from './store/userStore';
import { COLORS } from './constants/theme';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const { initialize, isInitialized, syncCloudToLocal } = useDiaryStore();
  const { initializeSecurity, getSecurityStatus, isUnlocked } = useSecurityStore();
  const { fetchUserProfile, clearProfile } = useUserStore();

  useEffect(() => {
    const handleUserChange = async (currentUser: User | null) => {
      console.log('👤 User state changed:', { 
        hasUser: !!currentUser, 
        userId: currentUser?.uid,
        email: currentUser?.email 
      });
      setUser(currentUser);
      
      try {
        if (currentUser) {
          console.log('📱 Initializing user profile...');
          await fetchUserProfile(currentUser.uid);
          console.log('🔐 Initializing security...');
          await initializeSecurity(currentUser.uid);
          console.log('📱 Syncing data from cloud...');
          await syncCloudToLocal();
          console.log('🚀 Initializing app state...');
          await initialize();
          console.log('✅ App initialization complete');
        } else {
          // User signed out, clear all data
          useDiaryStore.getState().clearLocalData();
          useSecurityStore.getState().clearSecurityData();
          clearProfile();
        }
      } catch (error) {
        console.error('❌ Error during initialization:', error);
      } finally {
        if (!isAuthReady) {
          setIsAuthReady(true);
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, handleUserChange);
    return unsubscribe;
  }, []);

  if (!isAuthReady || (user && !isInitialized)) {
    console.log('📱 Showing loading screen:', { 
      isAuthReady, 
      hasUser: !!user, 
      isInitialized
    });
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <NavigationContainer>
        <LoginScreen />
      </NavigationContainer>
    );
  }

  // Check security status for authenticated user
  const securityStatus = getSecurityStatus();
  
  if (!securityStatus.isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!securityStatus.hasMasterPassword) {
    // User needs to set up master password
    console.log('📱 Rendering: Set Master Password');
    return (
      <NavigationContainer>
        <AppNavigator initialRouteName="SetMasterPassword" />
      </NavigationContainer>
    );
  }

  if (!isUnlocked) {
    // User needs to unlock diary
    console.log('📱 Rendering: Unlock Diary');
    return (
      <NavigationContainer>
        <AppNavigator initialRouteName="UnlockDiary" />
      </NavigationContainer>
    );
  }

  // Show main app if authenticated and unlocked
  console.log('📱 Rendering: Main App (AppNavigator)');
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});