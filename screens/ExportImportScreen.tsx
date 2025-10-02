// screens/ExportImportScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  Platform,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import StyledButton from '../components/StyledButton';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';
import { useDiaryStore } from '../store/diaryStore';

const InfoCard = ({ 
  title, 
  description, 
  icon 
}: { 
  title: string; 
  description: string; 
  icon: React.ComponentProps<typeof Feather>['name'];
}) => (
  <View style={styles.infoCard}>
    <View style={styles.infoCardHeader}>
      <View style={styles.infoCardIcon}>
        <Feather name={icon} size={24} color={COLORS.primary} />
      </View>
      <Text style={styles.infoCardTitle}>{title}</Text>
    </View>
    <Text style={styles.infoCardDescription}>{description}</Text>
  </View>
);

export default function ExportImportScreen() {
  const { exportDiary, importDiary } = useDiaryStore();
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [importFileContent, setImportFileContent] = useState('');

  const handleExportDiary = async () => {
    setShowExportModal(true);
  };

  const handleExportConfirm = async () => {
    if (!exportPassword || exportPassword.trim() === '') {
      Alert.alert('Error', 'Password is required for export');
      return;
    }
    
    try {
      setIsExporting(true);
      setShowExportModal(false);
      
      const encryptedData = await exportDiary(exportPassword);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `diary-backup-${timestamp}.encrypted`;
      
      if (Platform.OS === 'web') {
        // Web version - create download link
        const blob = new Blob([encryptedData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        Alert.alert("Export Complete", `Backup file "${filename}" has been downloaded.`);
      } else {
        // Mobile version - save to file system
        const fileUri = FileSystem.documentDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, encryptedData);
        
        // Try to save to Downloads folder if available (Android)
        if (Platform.OS === 'android') {
          try {
            const downloadDir = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot('Download');
            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(downloadDir);
            
            if (permissions.granted) {
              const downloadUri = await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, filename, 'text/plain');
              await FileSystem.writeAsStringAsync(downloadUri, encryptedData);
              Alert.alert("Export Complete", `Backup saved to Downloads folder as: ${filename}`);
            } else {
              Alert.alert("Export Complete", `Backup saved to app directory as: ${filename}`);
            }
          } catch (error) {
            Alert.alert("Export Complete", `Backup saved to app directory as: ${filename}`);
          }
        } else {
          Alert.alert("Export Complete", `Backup saved as: ${filename}\n\nYou can find it in the Files app.`);
        }
      }
      
      Alert.alert("Success", "Encrypted diary backup created successfully!");
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert("Export Failed", `Could not export your diary. Error: ${error}`);
    } finally {
      setIsExporting(false);
      setExportPassword('');
    }
  };

  const handleImportDiary = async () => {
    try {
      let fileContent: string;
      
      if (Platform.OS === 'web') {
        // Web version with file input
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
            
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
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
          return;
        }
        
        fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      }
      
      setImportFileContent(fileContent);
      setShowImportModal(true);
      
    } catch (error) {
      console.error('Import setup error:', error);
      Alert.alert("Import Failed", "Could not select or read file. Please try again.");
    }
  };

  const handleImportConfirm = async () => {
    if (!importPassword || importPassword.trim() === '') {
      Alert.alert('Error', 'Password is required for import');
      return;
    }
    
    try {
      setIsImporting(true);
      setShowImportModal(false);
      
      Alert.alert(
        "Importing...", 
        "Please wait while we import and sync your diary entries.",
        [],
        { cancelable: false }
      );
      
      await importDiary(importFileContent, importPassword);
      Alert.alert("Success", "Diary imported and synced successfully!");
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert("Import Failed", "Could not import your diary. Please check your password and file.");
    } finally {
      setIsImporting(false);
      setImportPassword('');
      setImportFileContent('');
    }
  };

  const handleModalCancel = (type: 'export' | 'import') => {
    if (type === 'export') {
      setShowExportModal(false);
      setExportPassword('');
    } else {
      setShowImportModal(false);
      setImportPassword('');
      setImportFileContent('');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <InfoCard
          title="Export Your Diary"
          description="Create an encrypted backup of all your diary entries. This backup can be restored on any device."
          icon="download"
        />

        <StyledButton 
          title={isExporting ? "Exporting..." : "Export Diary"} 
          onPress={handleExportDiary} 
          variant="primary"
          disabled={isExporting}
          style={styles.actionButton}
        />

        <InfoCard
          title="Import Diary Backup"
          description="Restore your diary entries from an encrypted backup file. All entries will be synced to the cloud."
          icon="upload"
        />

        <StyledButton 
          title={isImporting ? "Importing..." : "Import Diary"} 
          onPress={handleImportDiary} 
          variant="secondary"
          disabled={isImporting}
          style={styles.actionButton}
        />

        <View style={styles.warningCard}>
          <Feather name="info" size={20} color={COLORS.warning} />
          <Text style={styles.warningText}>
            Always remember your master password. Without it, your backup files cannot be decrypted.
          </Text>
        </View>
      </View>

      {/* Export Password Modal */}
      <Modal
        visible={showExportModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => handleModalCancel('export')}
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
                onPress={() => handleModalCancel('export')} 
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
        onRequestClose={() => handleModalCancel('import')}
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
                onPress={() => handleModalCancel('import')} 
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

      {/* Loading overlay */}
      {(isExporting || isImporting) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            {isExporting ? 'Creating backup...' : 'Importing entries...'}
          </Text>
        </View>
      )}
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
  infoCard: {
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
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.small,
  },
  infoCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.medium,
  },
  infoCardTitle: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  infoCardDescription: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  actionButton: {
    marginBottom: SPACING.large,
  },
  warningCard: {
    backgroundColor: `${COLORS.warning}15`,
    borderRadius: 12,
    padding: SPACING.medium,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.medium,
  },
  warningText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.warning,
    marginLeft: SPACING.small,
    flex: 1,
    lineHeight: 20,
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.medium,
    textAlign: 'center',
  },
});
