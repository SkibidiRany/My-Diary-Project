// screens/ProfileScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import StyledButton from '../components/StyledButton';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';
// THE FIX: Import from the generic path, not the .native file
import { signOut } from '../services'; 
import { auth } from '../services/firebase';

export default function ProfileScreen() {
  const user = auth.currentUser;

  const handleSignOut = async () => {
    try {
      await signOut();
      // The onAuthStateChanged listener in App.tsx will handle navigation
    } catch (error) {
      Alert.alert("Error", "Could not sign out. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      {user && (
        <View style={styles.profileContainer}>
          <Image source={{ uri: user.photoURL || undefined }} style={styles.avatar} />
          <Text style={styles.name}>{user.displayName}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      )}
      <StyledButton
        title="Sign Out"
        onPress={handleSignOut}
        variant="destructive"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.medium,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
  },
  profileContainer: {
    alignItems: 'center',
    padding: SPACING.large,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: SPACING.medium,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  name: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  email: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.small,
  },
});