import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import StyledButton from '../components/StyledButton';
import CategoryChip from '../components/CategoryChip';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useDiaryStore } from '../store/diaryStore';
import { useCategoryStore } from '../store/categoryStore';
import { showErrorAlert, showConfirmAlert } from '../utils/alerts';

type ViewScreenProps = NativeStackScreenProps<RootStackParamList, 'ViewEntry'>;

export default function ViewEntryScreen({ route, navigation }: ViewScreenProps) {
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const { entryId } = route.params;
  const { entries, deleteEntry } = useDiaryStore();
  const { categories, initialize: initializeCategories } = useCategoryStore();
  const entry = entries.find(e => e.id === entryId);

  React.useEffect(() => {
    initializeCategories();
  }, []);

  React.useLayoutEffect(() => {
    navigation.setOptions({ 
      title: entry ? entry.title : 'View Entry',
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={handleEdit}
          >
            <Feather name="edit-3" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.headerActionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Feather name="trash-2" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      ),
    });
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
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Image */}
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

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Categories - Above Title */}
          {entry.categoryIds && entry.categoryIds.length > 0 && (
            <View style={styles.categoriesContainer}>
              <View style={styles.categoriesList}>
                {entry.categoryIds.map((categoryId) => {
                  const category = categories.find(cat => cat.id === categoryId);
                  return category ? (
                    <CategoryChip
                      key={categoryId}
                      category={category}
                      size="medium"
                      showIcon={true}
                      style={styles.categoryChip}
                    />
                  ) : null;
                })}
              </View>
            </View>
          )}
          
          {/* Title and Emoji */}
          <View style={styles.titleSection}>
            {entry.emoji && <Text style={styles.emoji}>{entry.emoji}</Text>}
            <Text style={styles.title}>{entry.title}</Text>
          </View>

          {/* Timestamps */}
          <View style={styles.timestampContainer}>
            <View style={styles.timestampItem}>
              <Feather name="calendar" size={16} color={COLORS.textSecondary} />
              <Text style={styles.timestampLabel}>Written for:</Text>
              <Text style={styles.timestampValue}>{createdForDate}</Text>
            </View>
            <View style={styles.timestampItem}>
              <Feather name="clock" size={16} color={COLORS.textSecondary} />
              <Text style={styles.timestampLabel}>Created:</Text>
              <Text style={styles.timestampValue}>{createdDate}</Text>
            </View>
            {modifiedDate && (
              <View style={styles.timestampItem}>
                <Feather name="edit" size={16} color={COLORS.textSecondary} />
                <Text style={styles.timestampLabel}>Modified:</Text>
                <Text style={styles.timestampValue}>{modifiedDate}</Text>
              </View>
            )}
          </View>
          
          {/* Content */}
          <View style={styles.contentSection}>
            <Text style={styles.contentText}>{entry.content}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  scrollContainer: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.small,
    marginRight: SPACING.small,
  },
  headerActionButton: {
    padding: SPACING.small,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: COLORS.error + '15',
    borderColor: COLORS.error + '30',
  },
  image: { 
    width: '100%', 
    height: 250, 
    backgroundColor: '#eee' 
  },
  contentContainer: { 
    padding: SPACING.medium,
    backgroundColor: COLORS.card,
    margin: SPACING.medium,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: SPACING.medium 
  },
  emoji: { 
    fontSize: 32, 
    marginRight: SPACING.small 
  },
  title: { 
    fontSize: FONT_SIZES.title, 
    fontWeight: 'bold', 
    flex: 1, 
    color: COLORS.textPrimary,
    lineHeight: 32,
  },
  timestampContainer: {
    marginBottom: SPACING.large, 
    padding: SPACING.medium,
    backgroundColor: COLORS.background, 
    borderRadius: 12, 
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timestampItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.small,
  },
  timestampLabel: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.small,
    marginRight: SPACING.small,
    fontWeight: '500',
  },
  timestampValue: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textPrimary,
    flex: 1,
  },
  contentSection: {
    marginTop: SPACING.small,
  },
  contentText: { 
    fontSize: FONT_SIZES.body, 
    lineHeight: 24, 
    color: COLORS.textPrimary 
  },
  categoriesContainer: {
    marginBottom: SPACING.medium,
    padding: SPACING.medium,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    marginRight: SPACING.small,
    marginBottom: SPACING.small,
  },
  modalContainer: {
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center', 
    alignItems: 'center',
  },
  modalImage: {
    width: '100%', 
    height: '100%',
  },
});