// screens/SetMasterPasswordScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import StyledButton from '../components/StyledButton';
import StyledTextInput from '../components/StyledTextInput';
import { COLORS } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useSecurityStore } from '../store/securityStore';
import { validateMasterPassword } from '../utils/encryption';

type SetMasterPasswordScreenProps = NativeStackScreenProps<RootStackParamList, 'SetMasterPassword'>;

export default function SetMasterPasswordScreen({ navigation }: SetMasterPasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const { setMasterPassword } = useSecurityStore();

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    // Clear errors when user starts typing
    if (passwordErrors.length > 0) {
      setPasswordErrors([]);
    }
  };

  const validatePasswords = () => {
    const errors: string[] = [];

    // Validate password strength
    const passwordValidation = validateMasterPassword(password);
    if (!passwordValidation.valid) {
      errors.push(...passwordValidation.errors);
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      errors.push('Passwords do not match');
    }

    setPasswordErrors(errors);
    return errors.length === 0;
  };

  const handleSetPassword = async () => {
    if (!validatePasswords()) {
      return;
    }

    setIsLoading(true);
    try {
      await setMasterPassword(password);
      console.log('✅ Master password setup complete - app will automatically navigate to diary');
      // Note: No manual navigation needed! 
      // App.tsx will automatically detect isUnlocked=true and render the main diary
    } catch (error) {
      console.error('Failed to set master password:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to set master password. Please try again.'
      );
      setIsLoading(false); // Only reset loading on error
    }
    // Don't reset isLoading on success - let the transition happen smoothly
  };

  const renderPasswordRequirements = () => {
    const requirements = [
      { text: 'At least 8 characters', met: password.length >= 8 },
      { text: 'One uppercase letter', met: /[A-Z]/.test(password) },
      { text: 'One lowercase letter', met: /[a-z]/.test(password) },
      { text: 'One number', met: /\d/.test(password) },
    ];

    return (
      <View style={styles.requirementsContainer}>
        <Text style={styles.requirementsTitle}>Password Requirements:</Text>
        {requirements.map((req, index) => (
          <Text
            key={index}
            style={[
              styles.requirement,
              { color: req.met ? COLORS.success : COLORS.text }
            ]}
          >
            {req.met ? '✓' : '○'} {req.text}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Set Master Password</Text>
          <Text style={styles.subtitle}>
            Create a strong password to encrypt your diary entries. This password will be required to access your diary.
          </Text>

          <View style={styles.form}>
            <StyledTextInput
              label="Master Password"
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry
              placeholder="Enter your master password"
              error={passwordErrors.length > 0}
            />

            <StyledTextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Confirm your master password"
              error={passwordErrors.length > 0}
            />

            {password.length > 0 && renderPasswordRequirements()}

            {passwordErrors.length > 0 && (
              <View style={styles.errorContainer}>
                {passwordErrors.map((error, index) => (
                  <Text key={index} style={styles.errorText}>
                    • {error}
                  </Text>
                ))}
              </View>
            )}

            <StyledButton
              title={isLoading ? 'Setting up encryption...' : 'Set Master Password'}
              onPress={handleSetPassword}
              disabled={isLoading || password.length === 0 || confirmPassword.length === 0}
              style={styles.button}
            />

            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Setting up encryption...</Text>
              </View>
            )}
          </View>

          <View style={styles.securityInfo}>
            <Text style={styles.securityTitle}>🔐 Security Information</Text>
            <Text style={styles.securityText}>
              • Your password is never stored on our servers{'\n'}
              • All diary entries are encrypted before being saved{'\n'}
              • You'll need this password to access your diary{'\n'}
              • Make sure to remember this password - it cannot be recovered
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
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
    marginBottom: 30,
    lineHeight: 22,
  },
  form: {
    marginBottom: 30,
  },
  requirementsContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  requirement: {
    fontSize: 13,
    marginBottom: 4,
  },
  errorContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: COLORS.error + '20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    marginBottom: 2,
  },
  button: {
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
    marginBottom: 10,
  },
  securityText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
