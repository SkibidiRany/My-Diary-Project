// components/KeyboardAwareScrollView.tsx

import React, { ReactNode, forwardRef } from 'react';
import { 
  KeyboardAvoidingView, 
  ScrollView, 
  Platform, 
  StyleSheet, 
  ViewStyle,
  ScrollViewProps 
} from 'react-native';

interface KeyboardAwareScrollViewProps extends Omit<ScrollViewProps, 'contentContainerStyle'> {
  children: ReactNode;
  contentContainerStyle?: ViewStyle;
  keyboardVerticalOffset?: number;
  enableOnAndroid?: boolean;
  extraScrollHeight?: number;
  extraHeight?: number;
}

/**
 * A comprehensive KeyboardAwareScrollView component that combines KeyboardAvoidingView and ScrollView
 * with platform-specific optimizations and consistent behavior across all screens.
 * 
 * Features:
 * - Platform-specific keyboard behavior (padding for iOS, height for Android)
 * - Configurable keyboard vertical offset
 * - Extra scroll height for better field visibility
 * - Consistent styling and behavior across all screens
 * - Proper keyboard dismiss handling
 * - Ref forwarding support
 * 
 * Usage:
 * ```tsx
 * <KeyboardAwareScrollView
 *   ref={scrollViewRef}
 *   keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
 *   extraScrollHeight={50}
 * >
 *   <YourContent />
 * </KeyboardAwareScrollView>
 * ```
 */
const KeyboardAwareScrollView = forwardRef<ScrollView, KeyboardAwareScrollViewProps>(({
  children,
  contentContainerStyle,
  keyboardVerticalOffset = Platform.OS === 'ios' ? 64 : 0,
  enableOnAndroid = true,
  extraScrollHeight = 50,
  extraHeight = 100,
  style,
  ...scrollViewProps
}, ref) => {
  const defaultContentStyle: ViewStyle = {
    flexGrow: 1,
    paddingBottom: extraHeight,
  };

  const combinedContentStyle = contentContainerStyle 
    ? [defaultContentStyle, contentContainerStyle]
    : defaultContentStyle;

  // For Android, we can disable KeyboardAvoidingView if needed
  if (Platform.OS === 'android' && !enableOnAndroid) {
    return (
      <ScrollView
        ref={ref}
        style={style}
        contentContainerStyle={combinedContentStyle}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView
        ref={ref}
        contentContainerStyle={combinedContentStyle}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

KeyboardAwareScrollView.displayName = 'KeyboardAwareScrollView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

// Export types for TypeScript usage
export type { KeyboardAwareScrollViewProps };
export default KeyboardAwareScrollView;
