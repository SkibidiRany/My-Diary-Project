import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

import AppNavigator from './navigation/AppNavigator';
import LoginScreen from './screens/LoginScreen';
import { auth } from './services/firebase';
import { useDiaryStore } from './store/diaryStore';
import { useSecurityStore } from './store/securityStore';
import { useUserStore } from './store/userStore';
import { COLORS } from './constants/theme';

type User = firebase.User;

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  
  const { initialize, isInitialized, syncCloudToLocal } = useDiaryStore();
  const { initializeSecurity, getSecurityStatus, isUnlocked } = useSecurityStore();
  const { fetchUserProfile, clearProfile, userProfile } = useUserStore();

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
          
          // Check if this is a first-time user (no profile exists)
          const currentProfile = useUserStore.getState().userProfile;
          const isFirstTimeUser = !currentProfile;
          
          setIsProfileLoaded(true); // Mark profile loading as complete
          
          if (isFirstTimeUser) {
            console.log('🆕 First-time user detected - profile setup required');
            // Don't initialize security or sync data yet - wait for profile setup
          } else {
            console.log('🔐 Initializing security...');
            await initializeSecurity(currentUser.uid);
            console.log('📱 Syncing data from cloud...');
            await syncCloudToLocal();
            console.log('🚀 Initializing app state...');
            await initialize();
            console.log('✅ App initialization complete');
          }
        } else {
          // User signed out, clear all data
          useDiaryStore.getState().clearLocalData();
          useSecurityStore.getState().clearSecurityData();
          clearProfile();
          setIsProfileLoaded(false); // Reset profile loaded state
        }
      } catch (error) {
        console.error('❌ Error during initialization:', error);
      } finally {
        if (!isAuthReady) {
          setIsAuthReady(true);
        }
      }
    };

    const unsubscribe = auth.onAuthStateChanged(handleUserChange);
    return unsubscribe;
  }, []);

  // Handle profile setup completion for first-time users
  useEffect(() => {
    const handleProfileSetupCompletion = async () => {
      if (user && userProfile && !isInitialized) {
        console.log('🔄 Profile setup completed, continuing initialization...');
        try {
          console.log('🔐 Initializing security...');
          await initializeSecurity(user.uid);
          console.log('📱 Syncing data from cloud...');
          await syncCloudToLocal();
          console.log('🚀 Initializing app state...');
          await initialize();
          console.log('✅ App initialization complete after profile setup');
        } catch (error) {
          console.error('❌ Error during post-profile-setup initialization:', error);
        }
      }
    };

    handleProfileSetupCompletion();
  }, [userProfile, user, isInitialized]);

  if (!isAuthReady) {
    console.log('📱 Showing loading screen: Auth not ready');
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

  // Show loading while profile is being fetched
  if (!isProfileLoaded) {
    console.log('📱 Showing loading screen: Profile loading');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Check if user needs profile setup (first-time user)
  if (!userProfile) {
    console.log('📱 Rendering: First Time Profile Setup');
    return (
      <NavigationContainer>
        <AppNavigator initialRouteName="FirstTimeProfileSetup" />
      </NavigationContainer>
    );
  }

  // Show loading if still initializing after profile setup
  if (!isInitialized) {
    console.log('📱 Showing loading screen: App initializing after profile setup');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
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