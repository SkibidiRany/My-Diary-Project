// components/PasswordInput.tsx
import React, { useState } from 'react';
import { StyleSheet, TextInput, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONT_SIZES } from '../constants/theme';

interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  showStrength?: boolean;
}

export default function PasswordInput({ 
  value, 
  onChangeText, 
  placeholder = "Enter password",
  label,
  error,
  showStrength = false 
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = showStrength ? getPasswordStrength(value) : 0;
  const strengthColors = ['#ff4444', '#ff8800', '#ffbb00', '#88cc00', '#00aa00'];
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.inputError]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          secureTextEntry={!isVisible}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setIsVisible(!isVisible)}
        >
          <Feather 
            name={isVisible ? "eye-off" : "eye"} 
            size={20} 
            color={COLORS.textSecondary} 
          />
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {showStrength && value.length > 0 && (
        <View style={styles.strengthContainer}>
          <View style={styles.strengthBar}>
            {[1, 2, 3, 4, 5].map((level) => (
              <View
                key={level}
                style={[
                  styles.strengthSegment,
                  {
                    backgroundColor: level <= strength 
                      ? strengthColors[strength - 1] 
                      : COLORS.border
                  }
                ]}
              />
            ))}
          </View>
          <Text style={styles.strengthText}>
            {strength > 0 ? strengthLabels[strength - 1] : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: COLORS.destructive,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.destructive,
    marginTop: 4,
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthBar: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  strengthSegment: {
    flex: 1,
    marginRight: 2,
  },
  strengthText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
