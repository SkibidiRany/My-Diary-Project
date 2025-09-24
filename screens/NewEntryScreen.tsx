// screens/NewEntryScreen.tsx
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, ActivityIndicator, Image, Keyboard, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View, Platform } from 'react-native';
import StyledButton from '../components/StyledButton';
import StyledTextInput from '../components/StyledTextInput';
import { COLORS } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { uploadImageAndGetURL } from '../services/firestoreService';
import { useDiaryStore } from '../store/diaryStore';

const EMOJIS = ['😊', '😄', '😢', '😠', '🎉', '💡', '🤔', '😴'];

type NewEntryScreenProps = NativeStackScreenProps<RootStackParamList, 'NewEntry'>;

export default function NewEntryScreen({ route, navigation }: NewEntryScreenProps) {
  const existingEntry = route.params?.entry;

  const [title, setTitle] = useState(existingEntry?.title || '');
  const [content, setContent] = useState(existingEntry?.content || '');
  const [imageUri, setImageUri] = useState<string | null>(existingEntry?.imageUri || null);
  const [emoji, setEmoji] = useState<string | null>(existingEntry?.emoji || null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { addEntry, updateEntry } = useDiaryStore();

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: existingEntry ? 'Edit Entry' : 'New Entry' });
  }, [navigation, existingEntry]);

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      // THE FIX: Reverted to the older name that works with your library version
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };
  
  const handleSelectEmoji = (selectedEmoji: string) => {
    setEmoji(selectedEmoji);
    setModalVisible(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Missing Information', 'Please fill out both the title and content.');
      return;
    }
    setIsLoading(true);
    let finalImageUri = imageUri;

    if (imageUri && (imageUri.startsWith('file://') || imageUri.startsWith('data:') || imageUri.startsWith('blob:'))) {
      try {
        finalImageUri = await uploadImageAndGetURL(imageUri);
      } catch (error) {
        Alert.alert('Upload Failed', 'Could not upload your image. Please try again.');
        setIsLoading(false);
        return;
      }
    }
    const entryData = {
      title: title.trim(), content: content.trim(), emoji,
      imageUri: finalImageUri, isPrivate: false,
    };
    if (existingEntry) {
      await updateEntry(existingEntry.id!, { ...existingEntry, ...entryData });
    } else {
      await addEntry(entryData);
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Saving...</Text>
            </View>
          ) : (
            <>
              {imageUri && <Image source={{ uri: imageUri }} style={styles.imagePreview} />}
              <View style={styles.buttonRow}>
                <StyledButton title={imageUri ? "Change Photo" : "Add Photo"} onPress={pickImage} variant="secondary" style={styles.flexButton} />
                <StyledButton title={emoji ? `Mood: ${emoji}` : "Select Mood"} onPress={() => setModalVisible(true)} variant="secondary" style={styles.flexButton} />
              </View>
              <StyledTextInput placeholder="Entry Title" value={title} onChangeText={setTitle} />
              <StyledTextInput placeholder="Tell me about your day..." value={content} onChangeText={setContent} multiline={true} style={styles.contentInput} />
              <StyledButton title={existingEntry ? "Update Entry" : "Save Entry"} onPress={handleSave} disabled={isLoading} />
            </>
          )}
        </View>
      </TouchableWithoutFeedback>
      
      <Modal animationType="slide" transparent={true} visible={isModalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>How are you feeling?</Text>
              <View style={styles.emojiContainer}>
                {EMOJIS.map((item) => (
                  <TouchableOpacity key={item} onPress={() => handleSelectEmoji(item)}>
                    <Text style={styles.emoji}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <StyledButton title="Close" onPress={() => setModalVisible(false)} />
            </View>
          </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    innerContainer: { flex: 1, padding: 16 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: COLORS.textSecondary },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 10 },
    flexButton: { flex: 1 },
    imagePreview: { width: '100%', height: 200, borderRadius: 8, marginBottom: 16, backgroundColor: '#eee' },
    contentInput: { minHeight: 150, textAlignVertical: 'top' },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%', alignItems: 'center' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    emojiContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 },
    emoji: { fontSize: 40, margin: 10 },
});