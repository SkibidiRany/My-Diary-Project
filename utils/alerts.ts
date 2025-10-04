import { Alert, Platform } from 'react-native';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

export const showAlert = (options: AlertOptions) => {
  if (Platform.OS === 'web') {
    // Web implementation using native confirm/alert
    if (options.buttons && options.buttons.length > 1) {
      // For multiple buttons, use confirm for the first destructive button
      const destructiveButton = options.buttons.find(btn => btn.style === 'destructive');
      if (destructiveButton) {
        const confirmed = window.confirm(`${options.title}\n\n${options.message || ''}`);
        if (confirmed && destructiveButton.onPress) {
          destructiveButton.onPress();
        }
      } else {
        // For non-destructive multiple buttons, use the first button
        const firstButton = options.buttons[0];
        if (firstButton.onPress) {
          firstButton.onPress();
        }
      }
    } else {
      // Single button or no buttons - use alert
      window.alert(`${options.title}\n\n${options.message || ''}`);
      const button = options.buttons?.[0];
      if (button?.onPress) {
        button.onPress();
      }
    }
  } else {
    // Mobile implementation using React Native Alert
    Alert.alert(options.title, options.message, options.buttons);
  }
};

// Convenience functions for common alert types
export const showSuccessAlert = (message: string, onPress?: () => void) => {
  showAlert({
    title: 'Success',
    message,
    buttons: [
      {
        text: 'OK',
        onPress
      }
    ]
  });
};

export const showErrorAlert = (message: string, onPress?: () => void) => {
  showAlert({
    title: 'Error',
    message,
    buttons: [
      {
        text: 'OK',
        onPress
      }
    ]
  });
};

export const showConfirmAlert = (
  title: string, 
  message: string, 
  onConfirm: () => void, 
  onCancel?: () => void
) => {
  showAlert({
    title,
    message,
    buttons: [
      {
        text: 'Cancel',
        onPress: onCancel,
        style: 'cancel'
      },
      {
        text: 'Confirm',
        onPress: onConfirm,
        style: 'destructive'
      }
    ]
  });
};
