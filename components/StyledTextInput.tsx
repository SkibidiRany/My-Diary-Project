// components/StyledTextInput.tsx

import React from 'react';
import { StyleSheet, TextInput, TextInputProps, Text, View } from 'react-native';
import { COLORS, FONT_SIZES } from '../constants/theme';

interface StyledTextInputProps extends TextInputProps {
  label?: string;
  error?: boolean;
}

export default function StyledTextInput({ label, error, style, ...props }: StyledTextInputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          style
        ]}
        placeholderTextColor={COLORS.textSecondary}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: FONT_SIZES.caption,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
});