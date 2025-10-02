// screens/SecuritySettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert,
  Switch,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import StyledButton from '../components/StyledButton';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';
import { useSecurityStore } from '../store/securityStore';
import { RootStackParamList } from '../navigation/AppNavigator';

type SecurityNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SecurityCard = ({ 
  title, 
  description, 
  icon,
  children 
}: { 
  title: string; 
  description: string; 
  icon: React.ComponentProps<typeof Feather>['name'];
  children?: React.ReactNode;
}) => (
  <View style={styles.securityCard}>
    <View style={styles.cardHeader}>
      <View style={styles.cardIcon}>
        <Feather name={icon} size={24} color={COLORS.primary} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
    </View>
    {children && <View style={styles.cardActions}>{children}</View>}
  </View>
);

const StatusIndicator = ({ 
  status, 
  activeText, 
  inactiveText 
}: { 
  status: boolean; 
  activeText: string; 
  inactiveText: string;
}) => (
  <View style={[styles.statusIndicator, status ? styles.statusActive : styles.statusInactive]}>
    <Feather 
      name={status ? "check-circle" : "x-circle"} 
      size={16} 
      color={status ? COLORS.success : COLORS.textSecondary} 
    />
    <Text style={[styles.statusText, status ? styles.statusActiveText : styles.statusInactiveText]}>
      {status ? activeText : inactiveText}
    </Text>
  </View>
);

export default function SecuritySettingsScreen() {
  const navigation = useNavigation<SecurityNavigationProp>();
  const { 
    getSecurityStatus, 
    lockDiary,
    isUnlocked,
    getSecurityAuditLog,
    clearAuditLog
  } = useSecurityStore();
  
  const [securityStatus, setSecurityStatus] = useState(getSecurityStatus());
  const [auditLog, setAuditLog] = useState(getSecurityAuditLog());

  useEffect(() => {
    setSecurityStatus(getSecurityStatus());
    setAuditLog(getSecurityAuditLog());
  }, [isUnlocked]);

  const handleLockUnlockToggle = () => {
    console.log('🔒 [SecuritySettings] Lock/Unlock button pressed, Platform:', Platform.OS);
    
    if (isUnlocked) {
      const performLock = () => {
        console.log('🔒 [SecuritySettings] Performing diary lock...');
        try {
          lockDiary();
          setSecurityStatus(getSecurityStatus());
          console.log('✅ [SecuritySettings] Diary locked successfully');
          
          // Show success message
          if (Platform.OS === 'web') {
            window.alert('Your diary has been locked successfully.');
          } else {
            Alert.alert('Diary Locked', 'Your diary has been locked successfully.');
          }
        } catch (error) {
          console.error('❌ [SecuritySettings] Error locking diary:', error);
          if (Platform.OS === 'web') {
            window.alert('Error: Could not lock diary. Please try again.');
          } else {
            Alert.alert('Error', 'Could not lock diary. Please try again.');
          }
        }
      };

      if (Platform.OS === 'web') {
        // Use window.confirm for web
        const confirmed = window.confirm('Are you sure you want to lock your diary? You will need to enter your master password to access it again.');
        if (confirmed) {
          performLock();
        }
      } else {
        // Use React Native Alert for mobile
        Alert.alert(
          'Lock Diary',
          'Are you sure you want to lock your diary? You will need to enter your master password to access it again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Lock', 
              style: 'destructive',
              onPress: performLock
            }
          ]
        );
      }
    } else {
      console.log('🔓 [SecuritySettings] Navigating to unlock screen');
      navigation.navigate('UnlockDiary');
    }
  };

  const handleSetupMasterPassword = () => {
    navigation.navigate('SetMasterPassword');
  };

  const handleClearAuditLog = () => {
    console.log('🗑️ [SecuritySettings] Clear audit log button pressed, Platform:', Platform.OS);
    
    const performClear = () => {
      console.log('🗑️ [SecuritySettings] Clearing audit log...');
      try {
        clearAuditLog();
        setAuditLog([]);
        console.log('✅ [SecuritySettings] Audit log cleared successfully');
        
        // Show success message
        if (Platform.OS === 'web') {
          window.alert('Security audit log has been cleared.');
        } else {
          Alert.alert('Log Cleared', 'Security audit log has been cleared.');
        }
      } catch (error) {
        console.error('❌ [SecuritySettings] Error clearing audit log:', error);
        if (Platform.OS === 'web') {
          window.alert('Error: Could not clear audit log. Please try again.');
        } else {
          Alert.alert('Error', 'Could not clear audit log. Please try again.');
        }
      }
    };

    if (Platform.OS === 'web') {
      // Use window.confirm for web
      const confirmed = window.confirm('Are you sure you want to clear the security audit log?');
      if (confirmed) {
        performClear();
      }
    } else {
      // Use React Native Alert for mobile
      Alert.alert(
        'Clear Security Log',
        'Are you sure you want to clear the security audit log?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Clear', 
            style: 'destructive',
            onPress: performClear
          }
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Security Status Overview */}
        <View style={styles.statusOverview}>
          <Text style={styles.sectionTitle}>Security Status</Text>
          <StatusIndicator 
            status={securityStatus.hasMasterPassword}
            activeText="Master password set"
            inactiveText="No master password"
          />
          <StatusIndicator 
            status={securityStatus.isUnlocked}
            activeText="Diary unlocked"
            inactiveText="Diary locked"
          />
          <StatusIndicator 
            status={securityStatus.isInitialized}
            activeText="Security initialized"
            inactiveText="Security not initialized"
          />
        </View>

        {/* Master Password Management */}
        <SecurityCard
          title="Master Password"
          description={securityStatus.hasMasterPassword 
            ? "Your diary is protected with a master password" 
            : "Set up a master password to encrypt your diary entries"
          }
          icon="key"
        >
          {!securityStatus.hasMasterPassword ? (
            <StyledButton
              title="Set Master Password"
              onPress={handleSetupMasterPassword}
              variant="primary"
            />
          ) : (
            <View style={styles.passwordActions}>
              <Text style={styles.passwordSetText}>
                Master password is configured and active
              </Text>
            </View>
          )}
        </SecurityCard>

        {/* Diary Lock/Unlock */}
        {securityStatus.hasMasterPassword && (
          <SecurityCard
            title="Diary Access"
            description={isUnlocked 
              ? "Your diary is currently unlocked and accessible" 
              : "Your diary is locked. Enter your master password to access it"
            }
            icon={isUnlocked ? "unlock" : "lock"}
          >
            <StyledButton
              title={isUnlocked ? "Lock Diary" : "Unlock Diary"}
              onPress={handleLockUnlockToggle}
              variant={isUnlocked ? "destructive" : "primary"}
            />
          </SecurityCard>
        )}

        {/* Encryption Information */}
        <SecurityCard
          title="Encryption"
          description="Your diary entries are encrypted using AES-256 encryption with your master password"
          icon="shield"
        >
          <View style={styles.encryptionInfo}>
            <Text style={styles.encryptionText}>
              🔒 All entries are encrypted locally before being stored
            </Text>
            <Text style={styles.encryptionText}>
              🔑 Only you have access to your master password
            </Text>
            <Text style={styles.encryptionText}>
              ☁️ Encrypted data is safely backed up to the cloud
            </Text>
          </View>
        </SecurityCard>

        {/* Security Audit Log */}
        {auditLog.length > 0 && (
          <SecurityCard
            title="Security Log"
            description={`${auditLog.length} security events recorded`}
            icon="file-text"
          >
            <View style={styles.auditLogContainer}>
              {auditLog.slice(0, 3).map((event, index) => (
                <View key={index} style={styles.auditLogItem}>
                  <Text style={styles.auditLogText}>
                    {event.type}: {event.message}
                  </Text>
                  <Text style={styles.auditLogTime}>
                    {new Date(event.timestamp).toLocaleString()}
                  </Text>
                </View>
              ))}
              {auditLog.length > 3 && (
                <Text style={styles.auditLogMore}>
                  +{auditLog.length - 3} more events
                </Text>
              )}
              <StyledButton
                title="Clear Log"
                onPress={handleClearAuditLog}
                variant="secondary"
                style={styles.clearLogButton}
              />
            </View>
          </SecurityCard>
        )}

        {/* Security Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Security Tips</Text>
          <View style={styles.tip}>
            <Feather name="info" size={16} color={COLORS.primary} />
            <Text style={styles.tipText}>
              Use a strong, unique master password that you can remember
            </Text>
          </View>
          <View style={styles.tip}>
            <Feather name="info" size={16} color={COLORS.primary} />
            <Text style={styles.tipText}>
              Lock your diary when not in use for additional security
            </Text>
          </View>
          <View style={styles.tip}>
            <Feather name="info" size={16} color={COLORS.primary} />
            <Text style={styles.tipText}>
              Regularly export your diary to create secure backups
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.medium,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.medium,
  },
  statusOverview: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.large,
    marginBottom: SPACING.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.small,
    paddingHorizontal: SPACING.medium,
    borderRadius: 8,
    marginBottom: SPACING.small,
  },
  statusActive: {
    backgroundColor: `${COLORS.success}15`,
  },
  statusInactive: {
    backgroundColor: `${COLORS.textSecondary}15`,
  },
  statusText: {
    fontSize: FONT_SIZES.body,
    marginLeft: SPACING.small,
  },
  statusActiveText: {
    color: COLORS.success,
    fontWeight: '500',
  },
  statusInactiveText: {
    color: COLORS.textSecondary,
  },
  securityCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.large,
    marginBottom: SPACING.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.medium,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.medium,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.small,
  },
  cardDescription: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  cardActions: {
    marginTop: SPACING.medium,
  },
  passwordActions: {
    alignItems: 'center',
  },
  passwordSetText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.success,
    textAlign: 'center',
    fontWeight: '500',
  },
  encryptionInfo: {
    marginTop: SPACING.small,
  },
  encryptionText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.small,
    lineHeight: 20,
  },
  auditLogContainer: {
    marginTop: SPACING.small,
  },
  auditLogItem: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.medium,
    marginBottom: SPACING.small,
  },
  auditLogText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  auditLogTime: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  auditLogMore: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.medium,
    fontStyle: 'italic',
  },
  clearLogButton: {
    marginTop: SPACING.small,
  },
  tipsCard: {
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 12,
    padding: SPACING.large,
    marginTop: SPACING.medium,
  },
  tipsTitle: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.medium,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.small,
  },
  tipText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginLeft: SPACING.small,
    flex: 1,
    lineHeight: 20,
  },
});
