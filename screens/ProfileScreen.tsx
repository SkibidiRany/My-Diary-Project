// screens/ProfileScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import StyledButton from '../components/StyledButton';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';
import { signOut } from '../services';
import { auth } from '../services/firebase';
import { useDiaryStore } from '../store/diaryStore';
import { calculateWritingStreak } from '../utils/stats';

export default function ProfileScreen() {
  const user = auth.currentUser;
  const entries = useDiaryStore((state) => state.entries);

  const totalEntries = entries.length;
  const writingStreak = calculateWritingStreak(entries);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert("Error", "Could not sign out. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <View>
        {user && (
          <View style={styles.profileContainer}>
            <Image source={{ uri: user.photoURL || undefined }} style={styles.avatar} />
            <Text style={styles.name}>{user.displayName}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalEntries}</Text>
            <Text style={styles.statLabel}>Total Entries</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{writingStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>
      </View>

      <StyledButton
        title="Sign Out"
        onPress={handleSignOut}
        variant="destructive"
        style={styles.signOutButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.medium,
    backgroundColor: COLORS.background,
    // FIX 1: Removed 'justifyContent' to allow content to stack at the top
  },
  profileContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.large,
  },
  avatar: {
    width: 120, height: 120, borderRadius: 60,
    marginBottom: SPACING.medium, borderWidth: 3,
    borderColor: COLORS.primary,
  },
  name: {
    fontSize: FONT_SIZES.title, fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  email: {
    fontSize: FONT_SIZES.body, color: COLORS.textSecondary,
    marginTop: SPACING.small,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: SPACING.large,
    // FIX 2: Removed 'flex: 1' so this container doesn't stretch
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.medium,
    borderRadius: 12,
    width: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.small,
  },
  // Added style to push the sign out button to the bottom
  signOutButton: {
    marginTop: 'auto',
  }
});