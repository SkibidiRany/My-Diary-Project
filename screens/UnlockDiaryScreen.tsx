// screens/UnlockDiaryScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import StyledButton from '../components/StyledButton';
import PasswordInput from '../components/PasswordInput';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';
import { useSecurityStore } from '../store/securityStore';

export default function UnlockDiaryScreen() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { unlockDiary, lockDiary } = useSecurityStore();

  const handleUnlock = async () => {
    if (!password.trim()) {
      setError('Please enter your master password');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const success = await unlockDiary(password);
      if (!success) {
        setError('Incorrect password. Please try again.');
      }
    } catch (error) {
      setError('Failed to unlock diary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password?',
      'Unfortunately, if you forget your master password, your encrypted diary entries cannot be recovered. This is by design to protect your privacy.\n\nIf you have exported your diary before, you can import it on a new device with a new password.',
      [{ text: 'I Understand' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Feather name="lock" size={64} color={COLORS.primary} />
        </View>
        
        <Text style={styles.title}>Unlock Your Diary</Text>
        <Text style={styles.subtitle}>
          Enter your master password to access your encrypted diary entries
        </Text>

        <View style={styles.form}>
          <PasswordInput
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError('');
            }}
            placeholder="Enter master password"
            error={error}
          />
        </View>

        <StyledButton
          title="Unlock Diary"
          onPress={handleUnlock}
          disabled={isLoading || !password.trim()}
        />

        <TouchableOpacity 
          style={styles.forgotButton}
          onPress={handleForgotPassword}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.medium,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.large,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.small,
  },
  subtitle: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.large,
    lineHeight: 22,
  },
  form: {
    marginBottom: SPACING.large,
  },
  forgotButton: {
    alignItems: 'center',
    marginTop: SPACING.medium,
  },
  forgotText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});
