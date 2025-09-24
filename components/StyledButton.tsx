// components/StyledButton.tsx

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { COLORS, FONT_SIZES } from '../constants/theme';

interface StyledButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

// FIX 1: Added "disabled" to the list of props the function receives
export default function StyledButton({ title, onPress, variant = 'primary', style, disabled }: StyledButtonProps) {
  const buttonStyles = [
    styles.button,
    styles[variant], // Apply variant style
    disabled && styles.disabled, 
    style, // Apply any custom styles passed in
  ];

  const textStyles = [
    styles.buttonText,
    variant === 'secondary' ? styles.textSecondary : styles.textPrimary,
  ];

  return (
    // Pass the disabled prop down to TouchableOpacity
    <TouchableOpacity style={buttonStyles} onPress={onPress} disabled={disabled}>
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: FONT_SIZES.body,
    fontWeight: 'bold',
  },
  // Variant styles
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  destructive: {
    backgroundColor: COLORS.destructive,
  },
  // FIX 2: Added the missing "disabled" style
  disabled: {
    opacity: 0.5,
  },
  // Text color styles
  textPrimary: {
    color: COLORS.card,
  },
  textSecondary: {
    color: COLORS.primary,
  },
});