// screens/ProfileScreen.tsx
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, ScrollView, ActivityIndicator, Platform, Modal, TextInput } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import StyledButton from '../components/StyledButton';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { signOut } from '../services';
import { auth } from '../services/firebase';
import { useDiaryStore } from '../store/diaryStore';
import { useSecurityStore } from '../store/securityStore';
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
  const { exportDiary, importDiary } = useDiaryStore();
  const { 
    getSecurityStatus, 
    lockDiary,
    isUnlocked
  } = useSecurityStore();
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [importFileContent, setImportFileContent] = useState('');

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

  const handleExportDiary = async () => {
    console.log('🔄 Export button pressed');
    setShowExportModal(true);
  };

  const handleExportConfirm = async () => {
    console.log('🔄 Export password entered, starting export...');
    console.log('🔄 Password length:', exportPassword.length);
    
    if (!exportPassword || exportPassword.trim() === '') {
      console.log('❌ No password provided');
      Alert.alert('Error', 'Password is required for export');
      return;
    }
    
    try {
      setIsExporting(true);
      setShowExportModal(false);
      console.log('🔄 Calling exportDiary function...');
      
      const encryptedData = await exportDiary(exportPassword);
      console.log('✅ Export data created, length:', encryptedData.length);
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `diary-backup-${timestamp}.encrypted`;
      
      if (Platform.OS === 'web') {
        // Web version - create download link
        console.log('🔄 Creating web download...');
        
        const blob = new Blob([encryptedData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('✅ File download initiated');
        Alert.alert("Export Complete", `Backup file "${filename}" has been downloaded to your computer.`);
      } else {
        // Mobile version - save to file system
        const fileUri = FileSystem.documentDirectory + filename;
        console.log('🔄 Writing file to:', fileUri);
        
        await FileSystem.writeAsStringAsync(fileUri, encryptedData);
        console.log('✅ File written successfully');
        
        // Try to save to Downloads folder if available (Android)
        if (Platform.OS === 'android') {
          try {
            const downloadDir = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot('Download');
            console.log('🔄 Attempting to save to Downloads folder...');
            
            // Request permissions to write to Downloads
            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(downloadDir);
            
            if (permissions.granted) {
              const downloadUri = await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, filename, 'text/plain');
              await FileSystem.writeAsStringAsync(downloadUri, encryptedData);
              console.log('✅ File saved to Downloads folder');
              Alert.alert("Export Complete", `Backup saved to Downloads folder as: ${filename}`);
            } else {
              console.log('⚠️ Downloads folder permission denied, file saved to app directory');
              Alert.alert("Export Complete", `Backup saved to app directory as: ${filename}\n\nPath: ${fileUri}`);
            }
          } catch (error) {
            console.log('⚠️ Could not save to Downloads, using app directory:', error);
            Alert.alert("Export Complete", `Backup saved to app directory as: ${filename}\n\nPath: ${fileUri}`);
          }
        } else {
          // iOS - file is saved to app's Documents directory
          console.log('✅ File saved to Documents directory');
          Alert.alert("Export Complete", `Backup saved as: ${filename}\n\nYou can find it in the Files app under this app's folder.`);
        }
      }
      
      Alert.alert("Success", "Encrypted diary backup created successfully!");
    } catch (error) {
      console.error('❌ Export error:', error);
      Alert.alert("Export Failed", `Could not export your diary. Error: ${error}`);
    } finally {
      setIsExporting(false);
      setExportPassword('');
      console.log('🔄 Export process completed');
    }
  };

  const handleExportCancel = () => {
    console.log('🔄 Export cancelled by user');
    setShowExportModal(false);
    setExportPassword('');
  };

  const handleImportDiary = async () => {
    try {
      console.log('🔄 Import button pressed');
      
      let fileContent: string;
      
      if (Platform.OS === 'web') {
        // Web version with file input
        console.log('🔄 Creating web file picker...');
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.encrypted,text/plain';
        
        const filePromise = new Promise<string>((resolve, reject) => {
          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) {
              reject(new Error('No file selected'));
              return;
            }
            
            console.log('🔄 File selected, reading content...');
            const reader = new FileReader();
            reader.onload = () => {
              console.log('✅ File content read, length:', (reader.result as string).length);
              resolve(reader.result as string);
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
          };
          
          input.oncancel = () => reject(new Error('File selection cancelled'));
        });
        
        input.click();
        fileContent = await filePromise;
      } else {
        // Mobile version with DocumentPicker
        const result = await DocumentPicker.getDocumentAsync({
          type: 'text/plain',
          copyToCacheDirectory: true,
        });
        
        if (result.canceled) {
          console.log('🔄 Import file selection cancelled');
          return;
        }
        
        console.log('🔄 File selected, reading content...');
        fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
        console.log('✅ File content read, length:', fileContent.length);
      }
      
      setImportFileContent(fileContent);
      setShowImportModal(true);
      
    } catch (error) {
      console.error('❌ Import setup error:', error);
      Alert.alert("Import Failed", "Could not select or read file. Please try again.");
      setIsImporting(false);
    }
  };

  const handleImportConfirm = async () => {
    console.log('🔄 Import password entered, starting import...');
    console.log('🔄 Password length:', importPassword.length);
    
    if (!importPassword || importPassword.trim() === '') {
      console.log('❌ No password provided');
      Alert.alert('Error', 'Password is required for import');
      return;
    }
    
    try {
      setIsImporting(true);
      setShowImportModal(false);
      console.log('🔄 Calling importDiary function...');
      
      // Show a loading alert for longer imports
      Alert.alert(
        "Importing...", 
        "Please wait while we import and sync your diary entries to the cloud. This may take a moment.",
        [],
        { cancelable: false }
      );
      
      await importDiary(importFileContent, importPassword);
      console.log('✅ Import completed successfully');
      
      Alert.alert("Success", "Diary imported and synced to cloud successfully! Your entries are now safely backed up.");
    } catch (error) {
      console.error('❌ Import error:', error);
      Alert.alert("Import Failed", "Could not import your diary. Please check your password and make sure the file is a valid encrypted backup.");
    } finally {
      setIsImporting(false);
      setImportPassword('');
      setImportFileContent('');
      console.log('🔄 Import process completed');
    }
  };

  const handleImportCancel = () => {
    console.log('🔄 Import cancelled by user');
    setShowImportModal(false);
    setImportPassword('');
    setImportFileContent('');
  };


  const handleLockUnlockToggle = () => {
    if (isUnlocked) {
      lockDiary();
      Alert.alert('Diary Locked', 'Your diary has been locked. You will need to enter your master password to access it again.');
                } else {
      navigation.navigate('UnlockDiary');
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

      <View style={styles.exportSection}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <StyledButton 
          title={isExporting ? "Exporting..." : "Export Diary"} 
          onPress={handleExportDiary} 
          variant="secondary" 
          disabled={isExporting}
        />
        <StyledButton 
          title={isImporting ? "Importing..." : "Import Diary"} 
          onPress={handleImportDiary} 
          variant="secondary" 
          disabled={isImporting}
        />
      </View>

      {/* Security Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.buttonContainer}>
          <StyledButton 
            title={isUnlocked ? "Lock Diary" : "Unlock Diary"}
            onPress={handleLockUnlockToggle}
            variant="secondary" 
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <StyledButton title="Edit Profile" onPress={() => navigation.navigate('EditProfile')} variant="secondary" />
        <StyledButton title="Sign Out" onPress={handleSignOut} variant="destructive" />
      </View>

      {/* Export Password Modal */}
      <Modal
        visible={showExportModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleExportCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Export Diary</Text>
            <Text style={styles.modalSubtitle}>Enter your master password to create an encrypted backup:</Text>
            
            <TextInput
              style={styles.modalInput}
              value={exportPassword}
              onChangeText={setExportPassword}
              placeholder="Master password"
              secureTextEntry={true}
              autoFocus={true}
              placeholderTextColor={COLORS.textSecondary}
            />
            
            <View style={styles.modalButtons}>
              <StyledButton 
                title="Cancel" 
                onPress={handleExportCancel} 
                variant="secondary"
                style={styles.modalButton}
              />
              <StyledButton 
                title="Export" 
                onPress={handleExportConfirm} 
                variant="primary"
                style={styles.modalButton}
                disabled={!exportPassword.trim()}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Import Password Modal */}
      <Modal
        visible={showImportModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleImportCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Import Diary</Text>
            <Text style={styles.modalSubtitle}>Enter your master password to decrypt the backup:</Text>
            
            <TextInput
              style={styles.modalInput}
              value={importPassword}
              onChangeText={setImportPassword}
              placeholder="Master password"
              secureTextEntry={true}
              autoFocus={true}
              placeholderTextColor={COLORS.textSecondary}
            />
            
            <View style={styles.modalButtons}>
              <StyledButton 
                title="Cancel" 
                onPress={handleImportCancel} 
                variant="secondary"
                style={styles.modalButton}
              />
              <StyledButton 
                title="Import" 
                onPress={handleImportConfirm} 
                variant="primary"
                style={styles.modalButton}
                disabled={!importPassword.trim()}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  exportSection: {
    paddingHorizontal: SPACING.medium,
    paddingBottom: SPACING.large,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.medium,
  },
  section: {
    padding: SPACING.medium,
    backgroundColor: COLORS.card,
    marginVertical: SPACING.small,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonContainer: {
    paddingHorizontal: SPACING.medium,
    paddingBottom: SPACING.large,
    gap: SPACING.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.large,
    margin: SPACING.large,
    minWidth: 300,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.small,
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.large,
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.medium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
    marginBottom: SPACING.large,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.medium,
  },
  modalButton: {
    flex: 1,
  },
});