import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import StyledButton from '../components/StyledButton';
import { COLORS } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useDiaryStore } from '../store/diaryStore';
import { showErrorAlert, showConfirmAlert } from '../utils/alerts';

type ViewScreenProps = NativeStackScreenProps<RootStackParamList, 'ViewEntry'>;

export default function ViewEntryScreen({ route, navigation }: ViewScreenProps) {
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const { entryId } = route.params;
  const { entries, deleteEntry } = useDiaryStore();
  const entry = entries.find(e => e.id === entryId);

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: entry ? entry.title : 'View Entry' });
  }, [navigation, entry]);

  if (!entry) {
    return (
      <View style={styles.container}>
        <Text>Entry not found. It may have been deleted.</Text>
      </View>
    );
  }

  const handleDelete = () => {
    const deleteAction = async () => {
      try {
        await deleteEntry(entryId);
        navigation.goBack();
      } catch (error) {
        showErrorAlert("Could not delete the entry.");
      }
    };
    
    showConfirmAlert(
      "Delete Entry", 
      "Are you sure you want to permanently delete this diary entry?", 
      deleteAction
    );
  };

  const handleEdit = () => {
    navigation.navigate('NewEntry', { entry });
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  };

  const createdDate = new Date(entry.createdAt).toLocaleString([], dateOptions);
  const createdForDate = new Date(entry.createdFor).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const modifiedDate = entry.modifiedAt ? new Date(entry.modifiedAt).toLocaleString([], dateOptions) : null;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {entry.imageUri && (
        <>
          <TouchableOpacity onPress={() => setImageModalVisible(true)}>
            <Image 
              source={{ uri: entry.imageUri }} 
              style={styles.image} 
              resizeMode="cover"
            />
          </TouchableOpacity>
          <Modal
            animationType="fade"
            transparent={true}
            visible={imageModalVisible}
            onRequestClose={() => setImageModalVisible(false)}
          >
            <TouchableOpacity 
              style={styles.modalContainer} 
              activeOpacity={1} 
              onPressOut={() => setImageModalVisible(false)}
            >
              <Image 
                source={{ uri: entry.imageUri }} 
                style={styles.modalImage} 
                resizeMode="contain" 
              />
            </TouchableOpacity>
          </Modal>
        </>
      )}
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          {entry.emoji && <Text style={styles.emoji}>{entry.emoji}</Text>}
          <Text style={styles.title}>{entry.title}</Text>
        </View>
        <View style={styles.timestampContainer}>
          <Text style={styles.date}>Written for: {createdForDate}</Text>
          <Text style={styles.date}>Created: {createdDate}</Text>
          {modifiedDate && <Text style={styles.date}>Last Modified: {modifiedDate}</Text>}
        </View>
        <Text style={styles.contentText}>{entry.content}</Text>
      </View>
      <View style={styles.buttonRow}>
        <StyledButton title="Edit" onPress={handleEdit} variant="secondary" style={styles.flexButton} />
        <StyledButton title="Delete" onPress={handleDelete} variant="destructive" style={styles.flexButton} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.card },
    image: { width: '100%', height: 250, backgroundColor: '#eee' },
    contentContainer: { padding: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    emoji: { fontSize: 30, marginRight: 10 },
    title: { fontSize: 24, fontWeight: 'bold', flex: 1, color: COLORS.textPrimary },
    date: { fontSize: 13, color: COLORS.textSecondary },
    timestampContainer: {
        marginBottom: 20, paddingVertical: 8, paddingHorizontal: 12,
        backgroundColor: COLORS.background, borderRadius: 8, borderWidth: 1,
        borderColor: COLORS.border,
    },
    contentText: { fontSize: 16, lineHeight: 24, color: COLORS.textPrimary },
    buttonRow: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10, gap: 10 },
    flexButton: { flex: 1 },
    modalContainer: {
        flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center', alignItems: 'center',
    },
    modalImage: {
        width: '100%', height: '100%',
    },
});