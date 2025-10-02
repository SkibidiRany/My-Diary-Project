// screens/SettingsScreen.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Platform 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';
import { signOut } from '../services';
import { SettingsStackParamList } from '../navigation/AppNavigator';

type SettingsNavigationProp = NativeStackNavigationProp<SettingsStackParamList>;

interface SettingsItemProps {
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  iconColor?: string;
  showChevron?: boolean;
  destructive?: boolean;
}

const SettingsItem = ({ 
  title, 
  subtitle, 
  icon, 
  onPress, 
  iconColor = COLORS.primary,
  showChevron = true,
  destructive = false
}: SettingsItemProps) => (
  <TouchableOpacity style={styles.settingsItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.settingsItemLeft}>
      <View style={[styles.iconContainer, destructive && styles.destructiveIconContainer]}>
        <Feather 
          name={icon} 
          size={20} 
          color={destructive ? COLORS.destructive : iconColor} 
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.settingsTitle, destructive && styles.destructiveText]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.settingsSubtitle}>{subtitle}</Text>
        )}
      </View>
    </View>
    {showChevron && (
      <Feather 
        name="chevron-right" 
        size={20} 
        color={COLORS.textSecondary} 
      />
    )}
  </TouchableOpacity>
);

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsNavigationProp>();

  const handleSignOut = async () => {
    console.log('🚪 [SettingsScreen] Sign out button pressed, Platform:', Platform.OS);
    
    const performSignOut = async () => {
      console.log('🚪 [SettingsScreen] Performing sign out...');
      try {
        console.log('🚪 [SettingsScreen] Calling signOut function...');
        await signOut();
        console.log('🚪 [SettingsScreen] signOut function completed');
      } catch (error) {
        console.error('🚪 [SettingsScreen] Error during sign out:', error);
        if (Platform.OS === 'web') {
          // Use window.confirm and window.alert on web
          window.alert("Error: Could not sign out. Please try again.");
        } else {
          Alert.alert("Error", "Could not sign out. Please try again.");
        }
      }
    };

    if (Platform.OS === 'web') {
      // Use window.confirm for web
      const confirmed = window.confirm("Are you sure you want to sign out?");
      if (confirmed) {
        await performSignOut();
      }
    } else {
      // Use React Native Alert for mobile
      Alert.alert(
        "Sign Out",
        "Are you sure you want to sign out?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Sign Out",
            style: "destructive",
            onPress: performSignOut
          }
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SectionHeader title="Data Management" />
      <View style={styles.section}>
        <SettingsItem
          title="Export & Import"
          subtitle="Backup and restore your diary"
          icon="download"
          onPress={() => navigation.navigate('ExportImport')}
        />
      </View>

      <SectionHeader title="Security & Privacy" />
      <View style={styles.section}>
        <SettingsItem
          title="Security Settings"
          subtitle="Master password and encryption"
          icon="shield"
          onPress={() => navigation.navigate('SecuritySettings')}
        />
      </View>

      <SectionHeader title="Account" />
      <View style={styles.section}>
        <SettingsItem
          title="Sign Out"
          subtitle="Sign out of your account"
          icon="log-out"
          onPress={handleSignOut}
          showChevron={false}
          destructive={true}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  sectionHeader: {
    fontSize: FONT_SIZES.caption,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.large,
    marginBottom: SPACING.small,
    marginHorizontal: SPACING.medium,
  },
  section: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.medium,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.medium,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.medium,
  },
  destructiveIconContainer: {
    backgroundColor: `${COLORS.destructive}20`,
  },
  textContainer: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  destructiveText: {
    color: COLORS.destructive,
  },
  settingsSubtitle: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
  },
});
