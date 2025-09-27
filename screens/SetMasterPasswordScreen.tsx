


// screens/SetMasterPasswordScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert, ScrollView } from 'react-native';
import StyledButton from '../components/StyledButton';
import PasswordInput from '../components/PasswordInput';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';
import { useSecurityStore } from '../store/securityStore';

export default function SetMasterPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const { setMasterPassword } = useSecurityStore();

  const validatePassword = (pwd: string) => {
    const errors: string[] = [];
    if (pwd.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push('Password must contain at least one number');
    }
    return errors;
  };

  const handleSetPassword = async () => {
    setErrors({});
    
    // Validate password
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setErrors({ password: passwordErrors[0] });
      return;
    }
    
    // Validate confirmation
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('🔐 Setting master password...');
      await setMasterPassword(password);
      console.log('🔐 Master password set successfully');
      Alert.alert(
        'Success!', 
        'Your diary is now protected with a master password. You can now start writing secure entries.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Failed to set master password:', error);
      Alert.alert('Error', 'Failed to set master password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🔒 Secure Your Diary</Text>
          <Text style={styles.subtitle}>
            Create a master password to encrypt your diary entries. This password will be required to access your diary on any device.
          </Text>
        </View>

        <View style={styles.form}>
          <PasswordInput
            label="Master Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a strong password"
            error={errors.password}
            showStrength={true}
          />
          
          <PasswordInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            error={errors.confirmPassword}
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>🔐 How it works:</Text>
          <Text style={styles.infoText}>
            • Your password is never stored anywhere{'\n'}
            • A unique encryption key is generated from your password{'\n'}
            • All diary entries are encrypted before saving{'\n'}
            • You can access your diary from any device with this password
          </Text>
        </View>

        <StyledButton
          title="Secure My Diary"
          onPress={handleSetPassword}
          disabled={isLoading || !password || !confirmPassword}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.medium,
  },
  header: {
    marginBottom: SPACING.large,
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.small,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: SPACING.large,
  },
  info: {
    backgroundColor: COLORS.card,
    padding: SPACING.medium,
    borderRadius: 12,
    marginBottom: SPACING.large,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoTitle: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.small,
  },
  infoText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});