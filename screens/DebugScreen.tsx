// screens/DebugScreen.tsx - Debug screen to check encryption status
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSecurityStore } from '../store/securityStore';
import { useDiaryStore } from '../store/diaryStore';
import { COLORS } from '../constants/theme';

export default function DebugScreen() {
  const securityState = useSecurityStore();
  const diaryState = useDiaryStore();

  const testEncryption = async () => {
    try {
      const { encryptString, decryptString, deriveKeyFromPassword, generateSalt } = await import('../utils/encryption');
      const testText = "This is a test message for encryption";
      const testPassword = "testpassword123";
      
      console.log('🔐 Testing encryption...');
      
      // Generate salt and derive key
      const salt = generateSalt();
      const keyHex = deriveKeyFromPassword(testPassword, salt);
      
      const encrypted = encryptString(testText, keyHex);
      console.log('🔐 Encrypted:', encrypted);
      
      const decrypted = decryptString(encrypted, keyHex);
      console.log('🔐 Decrypted:', decrypted);
      
      console.log('🔐 Test successful:', testText === decrypted);
    } catch (error) {
      console.error('🔐 Encryption test failed:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔐 Security Debug</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security State</Text>
        <Text style={styles.text}>Is Initialized: {securityState.isInitialized ? '✅' : '❌'}</Text>
        <Text style={styles.text}>Is Unlocked: {securityState.isUnlocked ? '✅' : '❌'}</Text>
        <Text style={styles.text}>Has Master Password: {securityState.salt ? '✅' : '❌'}</Text>
        <Text style={styles.text}>Has Encryption Key: {securityState.encryptionKey ? '✅' : '❌'}</Text>
        <Text style={styles.text}>Current User ID: {securityState.currentUserId || 'None'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diary State</Text>
        <Text style={styles.text}>Is Initialized: {diaryState.isInitialized ? '✅' : '❌'}</Text>
        <Text style={styles.text}>Entries Count: {diaryState.entries.length}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Encryption</Text>
        <TouchableOpacity style={styles.button} onPress={testEncryption}>
          <Text style={styles.buttonText}>Test Encryption/Decryption</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Status</Text>
        <Text style={styles.text}>
          {JSON.stringify(securityState.getSecurityStatus(), null, 2)}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: COLORS.card,
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 5,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
