// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

// Polyfill Buffer for React Native
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}
import AppNavigator from './navigation/AppNavigator';
import LoginScreen from './screens/LoginScreen';
import SetMasterPasswordScreen from './screens/SetMasterPasswordScreen';
import UnlockDiaryScreen from './screens/UnlockDiaryScreen';
import { auth } from './services/firebase';
import { useDiaryStore } from './store/diaryStore';
import { useSecurityStore } from './store/securityStore';
import { COLORS } from './constants/theme';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const { initialize, isInitialized, syncCloudToLocal } = useDiaryStore();
  const { isUnlocked, isInitialized: securityInitialized, initializeSecurity, salt } = useSecurityStore();

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
          console.log('🔐 Initializing security for user:', currentUser.uid);
          // Initialize security first
          await initializeSecurity(currentUser.uid);
          console.log('📱 Syncing data from cloud...');
          // Then sync data from cloud
          await syncCloudToLocal();
          console.log('🚀 Initializing app state...');
          // Finally initialize the app state
          await initialize();
          console.log('✅ App initialization complete');
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

  if (!isAuthReady || (user && !isInitialized) || (user && !securityInitialized)) {
    console.log('📱 Showing loading screen:', { 
      isAuthReady, 
      hasUser: !!user, 
      isInitialized, 
      securityInitialized 
    });
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    console.log('📱 Rendering: LoginScreen');
    return (
      <NavigationContainer>
        <LoginScreen />
      </NavigationContainer>
    );
  }

  // Show master password setup if not initialized or no salt
  if (!securityInitialized || !salt) {
    console.log('📱 Rendering: SetMasterPasswordScreen', { securityInitialized, hasSalt: !!salt });
    return <SetMasterPasswordScreen />;
  }

  // Show unlock screen if locked
  if (!isUnlocked) {
    console.log('📱 Rendering: UnlockDiaryScreen');
    return <UnlockDiaryScreen />;
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