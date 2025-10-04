// components/StyledTextInput.tsx

import React from 'react';
import { StyleSheet, TextInput, TextInputProps, Text, View } from 'react-native';
import { COLORS, FONT_SIZES } from '../constants/theme';

interface StyledTextInputProps extends TextInputProps {
  label?: string;
  error?: boolean;
  multiline?: boolean;
}

export default function StyledTextInput({ label, error, style, multiline, onFocus, ...props }: StyledTextInputProps) {
  const handleFocus = (e: any) => {
    console.log('🎯 StyledTextInput: onFocus handler called');
    if (onFocus) {
      console.log('✅ StyledTextInput: Calling parent onFocus');
      onFocus(e);
    } else {
      console.log('⚠️ StyledTextInput: No onFocus prop provided');
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          error && styles.inputError,
          style
        ]}
        placeholderTextColor={COLORS.textSecondary}
        multiline={multiline}
        onFocus={handleFocus}
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
  multilineInput: {
    textAlignVertical: 'top', // Fix for Android - align text to top instead of center
    paddingTop: 14, // Consistent padding for multiline
  },
  inputError: {
    borderColor: COLORS.error,
  },
});