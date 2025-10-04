import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useRef, useEffect } from 'react';
import { ActivityIndicator, Image, Keyboard, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View, Platform, KeyboardAvoidingView, ScrollView, TextInput } from 'react-native';
import StyledButton from '../components/StyledButton';
import StyledTextInput from '../components/StyledTextInput';
import { COLORS } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { uploadImageAndGetURL } from '../services/firestoreService';
import { useDiaryStore } from '../store/diaryStore';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '../utils/alerts';

type NewEntryScreenProps = NativeStackScreenProps<RootStackParamList, 'NewEntry'>;

export default function NewEntryScreen({ route, navigation }: NewEntryScreenProps) {
  const existingEntry = route.params?.entry;
  const { entries } = useDiaryStore();
  
  // Get the latest entry data from the store if editing
  const currentEntry = existingEntry?.id ? entries.find(e => e.id === existingEntry.id) || existingEntry : existingEntry;

  const [title, setTitle] = useState(currentEntry?.title || '');
  const [content, setContent] = useState(currentEntry?.content || '');
  const [imageUri, setImageUri] = useState<string | null>(currentEntry?.imageUri || null);
  const [emoji, setEmoji] = useState<string | null>(currentEntry?.emoji || null);
  const [tempEmoji, setTempEmoji] = useState(currentEntry?.emoji || '');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [createdFor, setCreatedFor] = useState<Date>(currentEntry?.createdFor ? new Date(currentEntry.createdFor) : new Date());
  const [dateError, setDateError] = useState<string>('');
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Helper function to get initial date values
  const getInitialDateValues = (entry?: any) => {
    if (entry?.createdFor) {
      const date = new Date(entry.createdFor);
      return {
        day: date.getDate().toString().padStart(2, '0'),
        month: (date.getMonth() + 1).toString().padStart(2, '0'),
        year: (date.getFullYear() - 2000).toString().padStart(2, '0')
      };
    }
    const now = new Date();
    return {
      day: now.getDate().toString().padStart(2, '0'),
      month: (now.getMonth() + 1).toString().padStart(2, '0'),
      year: (now.getFullYear() - 2000).toString().padStart(2, '0')
    };
  };

  const initialDate = getInitialDateValues(existingEntry);
  const [day, setDay] = useState(initialDate.day);
  const [month, setMonth] = useState(initialDate.month);
  const [year, setYear] = useState(initialDate.year);

  // Refs for auto-focus
  const dayRef = useRef<TextInput>(null);
  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);
  const contentRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const { addEntry, updateEntry } = useDiaryStore();

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: currentEntry ? 'Edit Entry' : 'New Entry' });
  }, [navigation, currentEntry]);

  // Update all form fields when editing an existing entry
  useEffect(() => {
    if (currentEntry) {
      
      // Update all form fields
      setTitle(currentEntry.title || '');
      setContent(currentEntry.content || '');
      setImageUri(currentEntry.imageUri || null);
      setEmoji(currentEntry.emoji || null);
      setTempEmoji(currentEntry.emoji || '');
      
      // Update date fields
      if (currentEntry.createdFor) {
        const date = new Date(currentEntry.createdFor);
        // Create a new date at noon to avoid timezone issues
        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
        setDay(localDate.getDate().toString().padStart(2, '0'));
        setMonth((localDate.getMonth() + 1).toString().padStart(2, '0'));
        setYear((localDate.getFullYear() - 2000).toString().padStart(2, '0'));
        setCreatedFor(localDate);
        setDateError(''); // Clear any existing errors
      }
    }
  }, [currentEntry?.id, currentEntry?.createdFor, currentEntry?.title, currentEntry?.content, currentEntry?.imageUri, currentEntry?.emoji, forceUpdate]);

  // Update createdFor when date fields change
  useEffect(() => {
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10) + 2000; // Convert YY to 20YY
    
    // Clear previous error
    setDateError('');
    
    if (!isNaN(dayNum) && !isNaN(monthNum) && !isNaN(yearNum)) {
      const validationResult = validateDateWithMessage(dayNum, monthNum, yearNum);
      if (validationResult.isValid) {
        // Create date at noon to avoid timezone issues
        const newDate = new Date(yearNum, monthNum - 1, dayNum, 12, 0, 0, 0);
        setCreatedFor(newDate);
      } else {
        setDateError(validationResult.message);
      }
    }
  }, [day, month, year]);

  function validateDateWithMessage(day: number, month: number, year: number): { isValid: boolean; message: string } {
    // Check if year is reasonable (2000-2099)
    if (year < 2000 || year > 2099) {
      return { isValid: false, message: 'Year must be between 2000 and 2099' };
    }
    
    // Check if month is valid (1-12)
    if (month < 1 || month > 12) {
      return { isValid: false, message: 'Month must be between 01 and 12' };
    }
    
    // Check if day is valid for the given month and year
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      return { 
        isValid: false, 
        message: `${monthNames[month - 1]} ${year} only has ${daysInMonth} days` 
      };
    }
    
    // Check if date is not in the future
    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (selectedDate > today) {
      return { isValid: false, message: 'Cannot create an entry for a future date' };
    }
    
    return { isValid: true, message: '' };
  }

  function isValidDate(day: number, month: number, year: number): boolean {
    return validateDateWithMessage(day, month, year).isValid;
  }

  const handleDayChange = (text: string) => {
    // Only allow numbers and limit to 2 digits
    const cleanText = text.replace(/[^0-9]/g, '').slice(0, 2);
    setDay(cleanText);
    setDateError(''); // Clear error when user starts typing
    
    // Auto-advance to month if 2 digits entered
    if (cleanText.length === 2) {
      monthRef.current?.focus();
    }
  };

  const handleMonthChange = (text: string) => {
    // Only allow numbers and limit to 2 digits
    const cleanText = text.replace(/[^0-9]/g, '').slice(0, 2);
    setMonth(cleanText);
    setDateError(''); // Clear error when user starts typing
    
    // Auto-advance to year if 2 digits entered
    if (cleanText.length === 2) {
      yearRef.current?.focus();
    }
  };

  const handleYearChange = (text: string) => {
    // Only allow numbers and limit to 2 digits
    const cleanText = text.replace(/[^0-9]/g, '').slice(0, 2);
    setYear(cleanText);
    setDateError(''); // Clear error when user starts typing
    
    // Auto-advance to content if 2 digits entered
    if (cleanText.length === 2) {
      contentRef.current?.focus();
    }
  };

  const handleDayFocus = () => {
    // Select all text when focused
    setTimeout(() => {
      dayRef.current?.setSelection(0, day.length);
    }, 100);
  };

  const handleMonthFocus = () => {
    setTimeout(() => {
      monthRef.current?.setSelection(0, month.length);
    }, 100);
  };

  const handleYearFocus = () => {
    setTimeout(() => {
      yearRef.current?.setSelection(0, year.length);
    }, 100);
  };

  const scrollToContent = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showErrorAlert('Sorry, we need camera roll permissions to make this work!');
            return;
        }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };
  
  const handleSelectEmoji = () => {
    setEmoji(tempEmoji);
    setModalVisible(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      showErrorAlert('Please fill out both the title and content.');
      return;
    }
    
    // Check for date errors
    if (dateError) {
      showErrorAlert(dateError);
      return;
    }
    
    // Final validation before saving
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10) + 2000;
    
    if (!isValidDate(dayNum, monthNum, yearNum)) {
      showErrorAlert('Please enter a valid date before saving.');
      return;
    }
    
    setIsLoading(true);
    let finalImageUri = imageUri;
    if (imageUri && (imageUri.startsWith('file://') || imageUri.startsWith('data:') || imageUri.startsWith('blob:'))) {
      try {
        finalImageUri = await uploadImageAndGetURL(imageUri);
      } catch (error) {
        showErrorAlert('Could not upload your image. Please try again.');
        setIsLoading(false);
        return;
      }
    }
    
    // Ensure we save the date in a consistent format
    const finalDate = new Date(yearNum, monthNum - 1, dayNum, 12, 0, 0, 0);
    
    const entryData = {
      title: title.trim(), 
      content: content.trim(), 
      emoji,
      imageUri: finalImageUri, 
      isPrivate: false,
      createdFor: finalDate.toISOString(),
    };
    try {
      if (currentEntry) {
        await updateEntry(currentEntry.id!, { ...currentEntry, ...entryData });
        
        // Force a re-render to update the form fields
        setForceUpdate(prev => prev + 1);
        
        // Show a brief success message and then navigate back
        showSuccessAlert('Entry updated successfully!', () => navigation.goBack());
      } else {
        await addEntry(entryData);
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      showErrorAlert('Failed to save entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Saving...</Text>
          </View>
        ) : (
          <>
            {/* Compact Action Buttons */}
            <View style={styles.actionBar}>
              <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
                <Text style={styles.actionIcon}>📷</Text>
                <Text style={styles.actionText}>{imageUri ? "Change" : "Photo"}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.actionIcon}>{emoji || "😊"}</Text>
                <Text style={styles.actionText}>Mood</Text>
              </TouchableOpacity>
              
              <View style={styles.dateContainer}>
                <Text style={styles.dateLabel}>Written for:</Text>
                <View style={styles.dateFields}>
                  <TextInput
                    ref={dayRef}
                    style={[styles.dateField, dateError && styles.dateFieldError]}
                    value={day}
                    onChangeText={handleDayChange}
                    onFocus={handleDayFocus}
                    placeholder="DD"
                    keyboardType="numeric"
                    maxLength={2}
                    textAlign="center"
                  />
                  <Text style={styles.dateSeparator}>/</Text>
                  <TextInput
                    ref={monthRef}
                    style={[styles.dateField, dateError && styles.dateFieldError]}
                    value={month}
                    onChangeText={handleMonthChange}
                    onFocus={handleMonthFocus}
                    placeholder="MM"
                    keyboardType="numeric"
                    maxLength={2}
                    textAlign="center"
                  />
                  <Text style={styles.dateSeparator}>/</Text>
                  <TextInput
                    ref={yearRef}
                    style={[styles.dateField, dateError && styles.dateFieldError]}
                    value={year}
                    onChangeText={handleYearChange}
                    onFocus={handleYearFocus}
                    placeholder="YY"
                    keyboardType="numeric"
                    maxLength={2}
                    textAlign="center"
                  />
                </View>
                {dateError ? (
                  <Text style={styles.dateErrorText}>{dateError}</Text>
                ) : (
                  <Text style={styles.dateDisplayText}>
                    {createdFor.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                )}
              </View>
            </View>

            {/* Image Preview */}
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            )}

            {/* Samsung Notes Style Content Area */}
            <View style={styles.contentArea}>
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Title"
                placeholderTextColor={COLORS.textSecondary}
                multiline={false}
                onFocus={scrollToContent}
              />
              <TextInput
                ref={contentRef}
                style={styles.contentInput}
                value={content}
                onChangeText={setContent}
                placeholder="Start writing..."
                placeholderTextColor={COLORS.textSecondary}
                multiline={true}
                textAlignVertical="top"
                onFocus={scrollToContent}
              />
            </View>

            {/* Save Button */}
            <View style={styles.saveContainer}>
              <StyledButton 
                title={currentEntry ? "Update Entry" : "Save Entry"} 
                onPress={handleSave} 
                disabled={isLoading}
                style={styles.saveButton}
              />
            </View>
          </>
        )}
      </ScrollView>
      
      {/* Emoji Modal */}
      <Modal animationType="slide" transparent={true} visible={isModalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>What's your mood?</Text>
            <StyledTextInput 
              style={styles.emojiInput}
              placeholder="Type emojis here..."
              value={tempEmoji}
              onChangeText={setTempEmoji}
              maxLength={30}
            />
            <StyledButton title="Set Mood" onPress={handleSelectEmoji} />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Extra space for keyboard
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    minHeight: 200,
  },
  loadingText: { 
    marginTop: 10, 
    color: COLORS.textSecondary 
  },
  
  // Action Bar Styles
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 60,
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  actionText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  
  // Date Container Styles
  dateContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  dateFields: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateField: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '600',
    width: 32,
    height: 36,
    textAlign: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 4,
  },
  dateFieldError: {
    borderColor: '#ff4444',
    backgroundColor: '#ff444410',
  },
  dateSeparator: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  dateErrorText: {
    fontSize: 12,
    color: '#ff4444',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  dateDisplayText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Image Preview
  imagePreview: { 
    width: '100%', 
    height: 200, 
    backgroundColor: '#eee',
    marginBottom: 8,
  },
  
  // Samsung Notes Style Content Area
  contentArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
    minHeight: 40,
  },
  contentInput: { 
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  
  // Save Button
  saveContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 14,
  },
  
  // Modal Styles
  modalContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  modalContent: { 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 10, 
    width: '80%', 
    alignItems: 'stretch' 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  emojiInput: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
});