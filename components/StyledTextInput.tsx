// components/StyledTextInput.tsx

import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { COLORS, FONT_SIZES } from '../constants/theme';

export default function StyledTextInput(props: TextInputProps) {
  return (
    <TextInput
      style={styles.input}
      placeholderTextColor={COLORS.textSecondary}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
});