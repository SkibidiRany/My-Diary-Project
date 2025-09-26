// screens/ProfileScreen.tsx
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import StyledButton from '../components/StyledButton';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { signOut } from '../services';
import { auth } from '../services/firebase';
import { useDiaryStore } from '../store/diaryStore';
import { useUserStore } from '../store/userStore';
import { calculateWritingStreak } from '../utils/stats';

type ProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * A helper component to render profile information rows neatly.
 */
const InfoRow = ({ label, value, isBio = false }: { label: string; value?: string; isBio?: boolean }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={isBio ? styles.bioText : styles.infoValue}>
      {value || 'Not set'}
    </Text>
  </View>
);

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigationProp>();
  const authUser = auth.currentUser;
  const entries = useDiaryStore((state) => state.entries);
  const { userProfile, fetchUserProfile, isLoading } = useUserStore();

  useEffect(() => {
    if (authUser?.uid) {
      fetchUserProfile(authUser.uid);
    }
  }, [authUser]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert("Error", "Could not sign out. Please try again.");
    }
  };

  if (isLoading || !authUser) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const totalEntries = entries.length;
  const writingStreak = calculateWritingStreak(entries);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileContainer}>
        <Image source={{ uri: authUser.photoURL || undefined }} style={styles.avatar} />
        <Text style={styles.name}>{authUser.displayName}</Text>
        <Text style={styles.email}>{authUser.email}</Text>
      </View>
      
      <View style={styles.infoSection}>
        <InfoRow label="Username" value={userProfile?.username} />
        <InfoRow label="Birthdate" value={userProfile?.birthdate} />
        <InfoRow label="Pronouns" value={userProfile?.pronouns} />
        <InfoRow label="Bio" value={userProfile?.bio} isBio />
      </View>

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

      <View style={styles.buttonContainer}>
        <StyledButton title="Edit Profile" onPress={() => navigation.navigate('EditProfile')} variant="secondary" />
        <StyledButton title="Sign Out" onPress={handleSignOut} variant="destructive" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  profileContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.large,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  infoSection: {
    padding: SPACING.medium,
  },
  infoRow: {
    marginBottom: SPACING.large,
  },
  infoLabel: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.small,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary
  },
  bioText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    fontStyle: 'italic',
    lineHeight: 22
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.medium,
    paddingBottom: SPACING.large,
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
  buttonContainer: {
    paddingHorizontal: SPACING.medium,
    paddingBottom: SPACING.large,
    gap: SPACING.medium,
  },
});