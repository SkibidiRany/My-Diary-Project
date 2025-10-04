// screens/CalendarScreen.tsx
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState, useEffect } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import StyledButton from '../components/StyledButton';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useDiaryStore } from '../store/diaryStore';

type CalendarNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CalendarScreen() {
  const navigation = useNavigation<CalendarNavigationProp>();
  const entries = useDiaryStore((state) => state.entries);
  const isFocused = useIsFocused();

  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (isFocused && selectedDate !== '') {
      setModalVisible(true);
    }
  }, [isFocused, selectedDate]);

  const markedDates = useMemo(() => {
    const marks: { [key: string]: { marked: true; dotColor: string } } = {};
    entries.forEach((entry) => {
      const dateString = entry.createdFor.split('T')[0];
      marks[dateString] = { marked: true, dotColor: COLORS.primary };
    });
    return marks;
  }, [entries]);

  const entriesForSelectedDay = useMemo(() => {
    return entries
      .filter((entry) => entry.createdFor.split('T')[0] === selectedDate)
      .sort((a, b) => new Date(a.createdFor).getTime() - new Date(b.createdFor).getTime());
  }, [entries, selectedDate]);

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    setModalVisible(true);
  };

  /**
   * Navigates to the ViewEntry modal screen for the selected entry.
   * @param entryId The ID of the diary entry to view.
   */
  const handleEntryPress = (entryId: number) => {
    setModalVisible(false);
    navigation.navigate('ViewEntry', { entryId });
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedDate('');
  };

  const handleCreateEntry = () => {
    setModalVisible(false);
    // Create a date at noon to avoid timezone issues
    const selectedDateObj = new Date(selectedDate + 'T12:00:00.000Z');
    navigation.navigate('NewEntry', { createdForDate: selectedDateObj.toISOString() });
  };

  return (
    <View style={styles.container}>
      <Calendar
        markedDates={markedDates}
        onDayPress={onDayPress}
        theme={{
          backgroundColor: COLORS.background,
          calendarBackground: COLORS.card,
          textSectionTitleColor: COLORS.textSecondary,
          selectedDayBackgroundColor: COLORS.primary,
          selectedDayTextColor: '#ffffff',
          todayTextColor: COLORS.primary,
          dayTextColor: COLORS.textPrimary,
          textDisabledColor: '#d9e1e8',
          dotColor: COLORS.primary,
          selectedDotColor: '#ffffff',
          arrowColor: COLORS.primary,
          monthTextColor: COLORS.primary,
          indicatorColor: COLORS.primary,
          textDayFontWeight: '300', textMonthFontWeight: 'bold', textDayHeaderFontWeight: '300',
          textDayFontSize: 16, textMonthFontSize: 16, textDayHeaderFontSize: 16,
        }}
      />
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <Pressable
          style={styles.modalContainer}
          onPress={handleCloseModal}
        >
          <Pressable style={styles.modalContent}>
            <Text style={styles.modalTitle}>Entries for {new Date(selectedDate + 'T00:00:00').toLocaleDateString()}</Text>
            <FlatList
              data={entriesForSelectedDay}
              keyExtractor={(item) => item.id!.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.entryItem} onPress={() => handleEntryPress(item.id!)}>
                  <Text style={styles.entryEmoji}>{item.emoji}</Text>
                  <Text style={styles.entryTitle} numberOfLines={1}>{item.title}</Text>
                </TouchableOpacity>
              )}
            />
            <StyledButton 
              title={`Add Entry for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString()}`} 
              onPress={handleCreateEntry} 
              style={styles.createEntryButton}
            />
            <StyledButton title="Close" onPress={handleCloseModal} variant="secondary" />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: SPACING.medium,
    width: '90%', maxHeight: '70%', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25,
    shadowRadius: 4, elevation: 5,
  },
  modalTitle: {
    fontSize: FONT_SIZES.subtitle, fontWeight: 'bold', color: COLORS.textPrimary,
    marginBottom: SPACING.medium, textAlign: 'center',
  },
  entryItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background,
    padding: SPACING.medium, borderRadius: 8, marginBottom: SPACING.small,
  },
  entryEmoji: { fontSize: 20, marginRight: SPACING.small },
  entryTitle: { fontSize: FONT_SIZES.body, color: COLORS.textPrimary, flex: 1 },
  createEntryButton: {
    marginBottom: SPACING.small,
  },
});