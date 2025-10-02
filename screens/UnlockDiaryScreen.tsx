// screens/UnlockDiaryScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import StyledButton from '../components/StyledButton';
import StyledTextInput from '../components/StyledTextInput';
import { COLORS } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useSecurityStore } from '../store/securityStore';

type UnlockDiaryScreenProps = NativeStackScreenProps<RootStackParamList, 'UnlockDiary'>;

export default function UnlockDiaryScreen({ navigation }: UnlockDiaryScreenProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const { 
    unlockDiary, 
    getSecurityStatus
  } = useSecurityStore();

  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 30000; // 30 seconds

  useEffect(() => {
    // Check if user is already unlocked
    const status = getSecurityStatus();
    if (status.isUnlocked) {
      navigation.navigate('MainTabs', { screen: 'Diary', params: { screen: 'Home' } });
    }
  }, []);


  const handleUnlock = async () => {
    if (isLocked) {
      Alert.alert('Account Locked', 'Too many failed attempts. Please wait before trying again.');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your master password');
      return;
    }

    setIsLoading(true);
    try {
      const success = await unlockDiary(password);
      
      if (success) {
        setPassword('');
        navigation.navigate('MainTabs', { screen: 'Diary', params: { screen: 'Home' } });
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= MAX_ATTEMPTS) {
          setIsLocked(true);
          setTimeout(() => {
            setIsLocked(false);
            setAttempts(0);
          }, LOCKOUT_DURATION);
          
          Alert.alert(
            'Account Locked',
            `Too many failed attempts. Please wait ${LOCKOUT_DURATION / 1000} seconds before trying again.`
          );
        } else {
          Alert.alert(
            'Invalid Password',
            `Incorrect master password. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`
          );
        }
      }
    } catch (error) {
      console.error('Failed to unlock diary:', error);
      Alert.alert(
        'Error',
        'Failed to unlock diary. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };


  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password?',
      'Unfortunately, your master password cannot be recovered. If you have forgotten it, you will need to reset your diary data.\n\nThis will delete all your encrypted entries. Are you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Data',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Reset',
              'This action cannot be undone. All your diary entries will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => {
                    // TODO: Implement data reset
                    Alert.alert('Not Implemented', 'Data reset functionality will be implemented soon.');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🔐</Text>
          <Text style={styles.title}>Unlock Your Diary</Text>
          <Text style={styles.subtitle}>
            Enter your master password to access your encrypted diary entries
          </Text>
        </View>

        <View style={styles.form}>
          <StyledTextInput
            label="Master Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter your master password"
            autoFocus
            onSubmitEditing={handleUnlock}
            editable={!isLocked}
          />

          {attempts > 0 && !isLocked && (
            <Text style={styles.attemptsText}>
              {MAX_ATTEMPTS - attempts} attempts remaining
            </Text>
          )}

          {isLocked && (
            <View style={styles.lockedContainer}>
              <ActivityIndicator size="small" color={COLORS.error} />
              <Text style={styles.lockedText}>
                Account locked. Please wait before trying again.
              </Text>
            </View>
          )}

          <StyledButton
            title={isLoading ? 'Unlocking...' : 'Unlock Diary'}
            onPress={handleUnlock}
            disabled={isLoading || isLocked || !password.trim()}
            style={styles.unlockButton}
          />


          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Verifying password...</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.securityInfo}>
          <Text style={styles.securityTitle}>🔒 Security Notice</Text>
          <Text style={styles.securityText}>
            Your diary is protected with end-to-end encryption. Only you can access your entries with your master password.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 30,
  },
  attemptsText: {
    color: COLORS.warning,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
  },
  lockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    padding: 15,
    backgroundColor: COLORS.error + '20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  lockedText: {
    color: COLORS.error,
    fontSize: 14,
    marginLeft: 10,
    fontWeight: '500',
  },
  unlockButton: {
    marginTop: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  loadingText: {
    marginLeft: 10,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  forgotButton: {
    padding: 10,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  securityInfo: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  securityText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
