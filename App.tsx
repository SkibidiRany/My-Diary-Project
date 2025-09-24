// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import LoginScreen from './screens/LoginScreen';
import { auth } from './services/firebase';
import { useDiaryStore } from './store/diaryStore';
import { COLORS } from './constants/theme';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const { initialize, isInitialized, syncCloudToLocal } = useDiaryStore();

  useEffect(() => {
    const handleUserChange = async (currentUser: User | null) => {
      setUser(currentUser);
      if (currentUser) {
        // When a user logs in, first sync their data from the cloud
        await syncCloudToLocal();
        // Then initialize the app state with the freshly synced local data
        await initialize();
      }
      if (!isAuthReady) {
        setIsAuthReady(true);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, handleUserChange);
    return unsubscribe;
  }, []);

  if (!isAuthReady || (user && !isInitialized)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppNavigator /> : <LoginScreen />}
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