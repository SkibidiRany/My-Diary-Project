// screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import StyledButton from '../components/StyledButton';
import { COLORS } from '../constants/theme';
// This is the corrected import line
import { signInWithGoogle } from '../services';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      // It's good practice to stop loading even if there's an error
      setLoading(false);
      console.log("Sign in was cancelled or failed");
    }
    // The onAuthStateChanged listener handles navigation, so we don't need to setLoading(false) on success.
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Diary</Text>
      <Text style={styles.subtitle}>Save your thoughts in the cloud.</Text>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <StyledButton 
          title="Sign in with Google" 
          onPress={handlePress} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
  },
});