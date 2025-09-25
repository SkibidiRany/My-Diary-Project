// screens/CalendarScreen.tsx
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React, { useMemo, useState, useEffect } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import StyledButton from '../components/StyledButton';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';
import { RootTabParamList } from '../navigation/AppNavigator';
import { useDiaryStore } from '../store/diaryStore';

type CalendarNavigationProp = BottomTabNavigationProp<RootTabParamList>;

export default function CalendarScreen() {
  const navigation = useNavigation<CalendarNavigationProp>();
  const entries = useDiaryStore((state) => state.entries);
  const isFocused = useIsFocused();

  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (isFocused && selectedDate !== '') {
      const entriesOnDay = entries.filter(
        (entry) => entry.createdAt.split('T')[0] === selectedDate
      );
      if (entriesOnDay.length > 0) {
        setModalVisible(true);
      } else {
        setSelectedDate('');
      }
    }
  }, [isFocused, entries, selectedDate]);

  const markedDates = useMemo(() => {
    const marks: { [key: string]: { marked: true; dotColor: string } } = {};
    entries.forEach((entry) => {
      const dateString = entry.createdAt.split('T')[0];
      marks[dateString] = { marked: true, dotColor: COLORS.primary };
    });
    return marks;
  }, [entries]);

  const entriesForSelectedDay = useMemo(() => {
    return entries
      .filter((entry) => entry.createdAt.split('T')[0] === selectedDate)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [entries, selectedDate]);

  const onDayPress = (day: DateData) => {
    if (markedDates[day.dateString]) {
      setSelectedDate(day.dateString);
      setModalVisible(true);
    }
  };

  const handleEntryPress = (entryId: number) => {
    setModalVisible(false);
    // ✅ CORRECTED NAVIGATION CALL
    navigation.navigate('Diary', {
      screen: 'ViewEntry',
      params: { entryId },
    });
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedDate('');
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
            <StyledButton title="Close" onPress={handleCloseModal} />
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
});