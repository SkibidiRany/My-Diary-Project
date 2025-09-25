// screens/HomeScreen.tsx
import { Feather } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { MotiView } from 'moti';
import React, { useEffect } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DiaryCard from '../components/DiaryCard';
import { COLORS } from '../constants/theme';
import { HomeScreenProps } from '../navigation/AppNavigator';
import { useDiaryStore } from '../store/diaryStore';


export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { entries, fetchEntries } = useDiaryStore();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fetchEntries();
    }
  }, [isFocused]);

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id!.toString()}
        renderItem={({ item, index }) => (
          <MotiView
            from={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300, delay: index * 100 }}
          >
            <TouchableOpacity onPress={() => navigation.navigate('ViewEntry', { entryId: item.id! })}>
              <DiaryCard entry={item} />
            </TouchableOpacity>
          </MotiView>
        )}
        ListHeaderComponent={<Text style={styles.listHeader}>Recent Entries</Text>}
        ListEmptyComponent={<Text style={styles.emptyText}>No entries yet. Write your first one!</Text>}
        contentContainerStyle={styles.listContent}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewEntry', {})}
      >
        <Feather name="plus" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    color: COLORS.textPrimary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});