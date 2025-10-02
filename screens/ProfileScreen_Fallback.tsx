// screens/ProfileScreen_Fallback.tsx - Simplified version without LinearGradient
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  Dimensions,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { auth } from '../services/firebase';
import { useDiaryStore } from '../store/diaryStore';
import { useSecurityStore } from '../store/securityStore';
import { useUserStore } from '../store/userStore';
import { calculateWritingStreak } from '../utils/stats';

type ProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentProps<typeof Feather>['name'];
  subtitle?: string;
  color?: string;
}

const StatCard = ({ title, value, icon, subtitle, color = COLORS.primary }: StatCardProps) => (
  <View style={[styles.statCard, { backgroundColor: COLORS.card }]}>
    <View style={[styles.statCardIcon, { backgroundColor: COLORS.accent }]}>
      <Feather name={icon} size={24} color={color} />
    </View>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
    {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
  </View>
);

interface QuickActionProps {
  title: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  color?: string;
}

const QuickAction = ({ title, icon, onPress, color = COLORS.primary }: QuickActionProps) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.quickActionIcon, { backgroundColor: COLORS.accent }]}>
      <Feather name={icon} size={20} color={color} />
    </View>
    <Text style={styles.quickActionTitle}>{title}</Text>
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigationProp>();
  const authUser = auth.currentUser;
  const entries = useDiaryStore((state) => state.entries);
  const { userProfile, fetchUserProfile, isLoading } = useUserStore();
  const { getSecurityStatus } = useSecurityStore();

  useEffect(() => {
    if (authUser?.uid) {
      fetchUserProfile(authUser.uid);
    }
  }, [authUser]);

  const handleSettingsPress = () => {
    navigation.navigate('Settings', { screen: 'SettingsHome' });
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'newEntry':
        navigation.navigate('NewEntry', {});
        break;
      case 'calendar':
        navigation.navigate('MainTabs', { screen: 'Calendar' });
        break;
      case 'editProfile':
        navigation.navigate('EditProfile');
        break;
      case 'diary':
        navigation.navigate('MainTabs', { screen: 'Diary' });
        break;
    }
  };

  if (isLoading || !authUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const totalEntries = entries.length;
  const writingStreak = calculateWritingStreak(entries);
  const securityStatus = getSecurityStatus();
  
  const daysSinceFirst = entries.length > 0 ? 
    Math.floor((Date.now() - new Date(entries[entries.length - 1].createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      bounces={true}
    >
      {/* Profile Header */}
      <View style={styles.headerContainer}>
        {/* Settings Icon */}
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={handleSettingsPress}
          activeOpacity={0.7}
        >
          <Feather name="settings" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Profile Photo */}
        <View style={styles.profilePhotoContainer}>
          <Image 
            source={authUser?.photoURL ? { uri: authUser.photoURL } : require('../assets/icon.png')} 
            style={styles.profilePhoto}
          />
        </View>

        {/* User Information */}
        <Text style={styles.displayName}>{authUser?.displayName || 'Anonymous User'}</Text>
        <Text style={styles.email}>{authUser?.email}</Text>
        
        {/* Member Since */}
        <View style={styles.memberSinceContainer}>
          <Feather name="calendar" size={14} color={COLORS.textSecondary} />
          <Text style={styles.memberSince}>
            Member since {authUser?.metadata?.creationTime ? 
              new Date(authUser.metadata.creationTime).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
              }) : 'Recently'}
          </Text>
        </View>

        {/* Bio */}
        {userProfile?.bio && (
          <View style={styles.bioContainer}>
            <Text style={styles.bioText}>{userProfile.bio}</Text>
          </View>
        )}
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Your Writing Journey</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Entries"
            value={totalEntries}
            icon="book-open"
            subtitle={totalEntries === 1 ? "entry" : "entries"}
            color={COLORS.primary}
          />
          <StatCard
            title="Writing Streak"
            value={writingStreak}
            icon="zap"
            subtitle={writingStreak === 1 ? "day" : "days"}
            color={COLORS.success}
          />
          <StatCard
            title="Days Active"
            value={daysSinceFirst}
            icon="calendar"
            subtitle="since first entry"
            color={COLORS.secondary}
          />
          <StatCard
            title="Security"
            value={securityStatus.isUnlocked ? "Unlocked" : "Locked"}
            icon={securityStatus.isUnlocked ? "unlock" : "lock"}
            subtitle={securityStatus.hasMasterPassword ? "Protected" : "No password"}
            color={COLORS.warning}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickAction
            title="New Entry"
            icon="plus"
            onPress={() => handleQuickAction('newEntry')}
            color={COLORS.primary}
          />
          <QuickAction
            title="View Diary"
            icon="book"
            onPress={() => handleQuickAction('diary')}
            color={COLORS.secondary}
          />
          <QuickAction
            title="Calendar"
            icon="calendar"
            onPress={() => handleQuickAction('calendar')}
            color={COLORS.success}
          />
          <QuickAction
            title="Edit Profile"
            icon="edit-3"
            onPress={() => handleQuickAction('editProfile')}
            color={COLORS.warning}
          />
        </View>
      </View>

      {/* Profile Details */}
      {(userProfile?.username || userProfile?.birthdate || userProfile?.pronouns) && (
        <View style={styles.profileDetailsSection}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          <View style={styles.profileDetailsCard}>
            {userProfile?.username && (
              <View style={styles.profileDetailRow}>
                <Feather name="at-sign" size={16} color={COLORS.textSecondary} />
                <View style={styles.profileDetailContent}>
                  <Text style={styles.profileDetailLabel}>Username</Text>
                  <Text style={styles.profileDetailValue}>{userProfile.username}</Text>
                </View>
              </View>
            )}
            {userProfile?.birthdate && (
              <View style={styles.profileDetailRow}>
                <Feather name="gift" size={16} color={COLORS.textSecondary} />
                <View style={styles.profileDetailContent}>
                  <Text style={styles.profileDetailLabel}>Birthday</Text>
                  <Text style={styles.profileDetailValue}>{userProfile.birthdate}</Text>
                </View>
              </View>
            )}
            {userProfile?.pronouns && (
              <View style={styles.profileDetailRow}>
                <Feather name="user" size={16} color={COLORS.textSecondary} />
                <View style={styles.profileDetailContent}>
                  <Text style={styles.profileDetailLabel}>Pronouns</Text>
                  <Text style={styles.profileDetailValue}>{userProfile.pronouns}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.medium,
  },
  headerContainer: {
    backgroundColor: COLORS.card,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: SPACING.large,
    paddingHorizontal: SPACING.large,
    alignItems: 'center',
    marginBottom: SPACING.large,
  },
  settingsButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: SPACING.large,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profilePhotoContainer: {
    marginBottom: SPACING.medium,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.background,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  displayName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.small,
  },
  email: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.medium,
  },
  memberSinceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.medium,
  },
  memberSince: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.small,
    fontWeight: '500',
  },
  bioContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.medium,
    marginTop: SPACING.small,
    maxWidth: width - (SPACING.large * 2),
  },
  bioText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  statsSection: {
    paddingHorizontal: SPACING.medium,
    marginBottom: SPACING.large,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.medium,
    marginLeft: SPACING.small,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - SPACING.medium * 3) / 2,
    borderRadius: 16,
    padding: SPACING.large,
    alignItems: 'center',
    marginBottom: SPACING.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.medium,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: SPACING.small,
  },
  statTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  quickActionsSection: {
    paddingHorizontal: SPACING.medium,
    marginBottom: SPACING.large,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: (width - SPACING.medium * 3) / 2,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.large,
    alignItems: 'center',
    marginBottom: SPACING.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.small,
  },
  quickActionTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  profileDetailsSection: {
    paddingHorizontal: SPACING.medium,
    marginBottom: SPACING.large,
  },
  profileDetailsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.large,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.medium,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  profileDetailContent: {
    marginLeft: SPACING.medium,
    flex: 1,
  },
  profileDetailLabel: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  profileDetailValue: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: SPACING.large * 2,
  },
});
