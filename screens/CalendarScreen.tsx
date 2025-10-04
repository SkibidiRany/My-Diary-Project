// screens/CalendarScreen.tsx
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState, useEffect } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View, ScrollView, Dimensions, TextInput } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Feather } from '@expo/vector-icons';
import StyledButton from '../components/StyledButton';
import CategoryChip from '../components/CategoryChip';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useDiaryStore } from '../store/diaryStore';
import { useCategoryStore } from '../store/categoryStore';
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from '../utils/alerts';

type CalendarNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CalendarScreen() {
  const navigation = useNavigation<CalendarNavigationProp>();
  const entries = useDiaryStore((state) => state.entries);
  const { categories, selectedCategoryId, setSelectedCategory: setCategoryFilter, initialize: initializeCategories, addCategory, deleteCategory } = useCategoryStore();
  const isFocused = useIsFocused();

  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [categoryEntries, setCategoryEntries] = useState<any[]>([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#006d77');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📁');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCategoriesForDeletion, setSelectedCategoriesForDeletion] = useState<number[]>([]);

  useEffect(() => {
    if (isFocused && selectedDate !== '') {
      setModalVisible(true);
    }
  }, [isFocused, selectedDate]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log('🔄 Initializing categories...');
        await initializeCategories();
        console.log('✅ Categories loaded:', categories.length);
        console.log('📋 Categories data:', categories);
      } catch (error) {
        console.error('❌ Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Refresh categories when screen is focused
  useEffect(() => {
    if (isFocused) {
      const refreshCategories = async () => {
        try {
          await initializeCategories();
        } catch (error) {
          console.error('Failed to refresh categories:', error);
        }
      };
      refreshCategories();
    }
  }, [isFocused]);

  const markedDates = useMemo(() => {
    const marks: { [key: string]: { marked: true; dotColor: string; dots?: Array<{ key: string; color: string }> } } = {};
    
    entries.forEach((entry) => {
      const dateString = entry.createdFor.split('T')[0];
      
      if (!marks[dateString]) {
        marks[dateString] = { marked: true, dotColor: COLORS.primary, dots: [] };
      }
      
      // If entry has categories, use the first category's color
      if (entry.categoryIds && entry.categoryIds.length > 0) {
        const firstCategory = categories.find(cat => cat.id === entry.categoryIds![0]);
        if (firstCategory) {
          marks[dateString].dotColor = firstCategory.color;
        }
      }
    });
    
    return marks;
  }, [entries, categories]);

  const entriesForSelectedDay = useMemo(() => {
    let filteredEntries = entries.filter((entry) => entry.createdFor.split('T')[0] === selectedDate);
    
    // Filter by selected category if one is selected
    if (selectedCategoryId !== null) {
      filteredEntries = filteredEntries.filter((entry) => 
        entry.categoryIds && entry.categoryIds.includes(selectedCategoryId)
      );
    }
    
    return filteredEntries.sort((a, b) => new Date(a.createdFor).getTime() - new Date(b.createdFor).getTime());
  }, [entries, selectedDate, selectedCategoryId]);

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

  const handleOpenCategory = async (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    // Get entries for this category
    const categoryEntries = entries.filter(entry => 
      entry.categoryIds && entry.categoryIds.includes(categoryId)
    ).sort((a, b) => new Date(b.createdFor).getTime() - new Date(a.createdFor).getTime());

    setSelectedCategory(categoryId);
    setCategoryEntries(categoryEntries);
    setCategoryModalVisible(true);
  };

  const handleCloseCategoryModal = () => {
    setCategoryModalVisible(false);
    setSelectedCategory(null);
    setCategoryEntries([]);
  };

  const getCategoryEntryCount = (categoryId: number) => {
    return entries.filter(entry => 
      entry.categoryIds && entry.categoryIds.includes(categoryId)
    ).length;
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      showErrorAlert('Please enter a category name');
      return;
    }

    try {
      await addCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor,
        icon: newCategoryIcon,
        isDefault: false,
      });
      
      setNewCategoryName('');
      setNewCategoryColor('#006d77');
      setNewCategoryIcon('📁');
      setIsCreatingCategory(false);
      showSuccessAlert('Category created successfully!');
    } catch (error) {
      console.error('Failed to create category:', error);
      showErrorAlert('Failed to create category. Please try again.');
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    if (category.isDefault) {
      showErrorAlert('Cannot delete default categories');
      return;
    }

    showConfirmAlert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This will remove it from all entries but won't delete the entries themselves.`,
      async () => {
        try {
          await deleteCategory(categoryId);
          showSuccessAlert('Category deleted successfully!');
        } catch (error) {
          console.error('Failed to delete category:', error);
          showErrorAlert('Failed to delete category. Please try again.');
        }
      }
    );
  };

  const PREDEFINED_COLORS = [
    '#006d77', '#83c5be', '#ffddd2', '#e29578', '#28a745',
    '#dc3545', '#ffc107', '#17a2b8', '#6f42c1', '#fd7e14',
    '#20c997', '#e83e8c', '#6c757d', '#343a40', '#007bff'
  ];

  const PREDEFINED_ICONS = [
    '📁', '👤', '💼', '✈️', '🏥', '💡', '❤️', '🎯', '📚', '🎨', '🏠',
    '🍕', '🎵', '🏃', '📱', '💰', '🌱', '🎉', '🔒', '⭐', '🎭'
  ];

  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
    setSelectedCategoriesForDeletion([]);
  };

  const handleToggleCategorySelection = (categoryId: number) => {
    if (selectedCategoriesForDeletion.includes(categoryId)) {
      setSelectedCategoriesForDeletion(prev => prev.filter(id => id !== categoryId));
    } else {
      setSelectedCategoriesForDeletion(prev => [...prev, categoryId]);
    }
  };

  const handleBulkDeleteCategories = () => {
    if (selectedCategoriesForDeletion.length === 0) {
      showErrorAlert('Please select categories to delete');
      return;
    }

    const categoriesToDelete = categories.filter(cat => 
      selectedCategoriesForDeletion.includes(cat.id!) && !cat.isDefault
    );

    if (categoriesToDelete.length === 0) {
      showErrorAlert('Cannot delete default categories');
      return;
    }

    // Check if any categories have entries
    const categoriesWithEntries = categoriesToDelete.filter(cat => 
      getCategoryEntryCount(cat.id!) > 0
    );

    const categoryNames = categoriesToDelete.map(cat => cat.name).join(', ');
    let message = `Are you sure you want to delete these categories: ${categoryNames}?`;
    
    if (categoriesWithEntries.length > 0) {
      const totalEntries = categoriesWithEntries.reduce((sum, cat) => sum + getCategoryEntryCount(cat.id!), 0);
      message += ` This will remove the categories from ${totalEntries} ${totalEntries === 1 ? 'entry' : 'entries'} but won't delete the entries themselves.`;
    }
    
    showConfirmAlert(
      'Delete Categories',
      message,
      async () => {
        try {
          for (const categoryId of selectedCategoriesForDeletion) {
            if (!categories.find(cat => cat.id === categoryId)?.isDefault) {
              await deleteCategory(categoryId);
            }
          }
          setSelectedCategoriesForDeletion([]);
          setIsEditMode(false);
          showSuccessAlert(`${categoriesToDelete.length} categories deleted successfully!`);
        } catch (error) {
          console.error('Failed to delete categories:', error);
          showErrorAlert('Failed to delete some categories. Please try again.');
        }
      }
    );
  };

  const handleCancelEditMode = () => {
    setIsEditMode(false);
    setSelectedCategoriesForDeletion([]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
      
      {/* Enhanced Samsung Notes Style Category Folders */}
      <View style={styles.foldersContainer}>
        <View style={styles.foldersHeader}>
          <View style={styles.foldersTitleContainer}>
            <Text style={styles.foldersTitle}>Categories</Text>
            <Text style={styles.foldersSubtitle}>({categories.length} total)</Text>
          </View>
          <View style={styles.foldersActions}>
            {isEditMode ? (
              <>
                <TouchableOpacity
                  style={[styles.folderActionButton, selectedCategoriesForDeletion.length > 0 && styles.folderActionButtonActive]}
                  onPress={handleBulkDeleteCategories}
                  disabled={selectedCategoriesForDeletion.length === 0}
                >
                  <Feather name="trash-2" size={18} color={selectedCategoriesForDeletion.length > 0 ? COLORS.error : COLORS.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.folderActionButton}
                  onPress={handleCancelEditMode}
                >
                  <Feather name="x" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.folderActionButton}
                  onPress={async () => {
                    try {
                      await initializeCategories();
                      showSuccessAlert('Categories refreshed!');
                    } catch (error) {
                      showErrorAlert('Failed to refresh categories');
                    }
                  }}
                >
                  <Feather name="refresh-cw" size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.folderActionButton}
                  onPress={handleToggleEditMode}
                >
                  <Feather name="edit-3" size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.folderActionButton}
                  onPress={() => setIsCreatingCategory(true)}
                >
                  <Feather name="plus" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        
        <View style={styles.foldersGrid}>
          {categories.length === 0 ? (
            <View style={styles.emptyCategoriesContainer}>
              <Text style={styles.emptyCategoriesText}>No categories yet</Text>
              <Text style={styles.emptyCategoriesSubtext}>Tap the + button to create your first category</Text>
            </View>
          ) : (
            categories.map((category) => {
            const entryCount = getCategoryEntryCount(category.id!);
            const isSelected = selectedCategoriesForDeletion.includes(category.id!);
            const canDelete = !category.isDefault;
            
            return (
              <View key={category.id} style={styles.folderCardContainer}>
                <TouchableOpacity
                  style={[
                    styles.folderCard,
                    isEditMode && styles.folderCardEditMode,
                    isSelected && styles.folderCardSelected
                  ]}
                  onPress={() => {
                    if (isEditMode && canDelete) {
                      handleToggleCategorySelection(category.id!);
                    } else if (!isEditMode) {
                      handleOpenCategory(category.id!);
                    }
                  }}
                  activeOpacity={0.8}
                  disabled={isEditMode && !canDelete}
                >
                  {/* Selection indicator */}
                  {isEditMode && canDelete && (
                    <View style={styles.folderSelectionIndicator}>
                      <View style={[
                        styles.folderCheckbox,
                        isSelected && styles.folderCheckboxSelected
                      ]}>
                        {isSelected && (
                          <Feather name="check" size={12} color={COLORS.card} />
                        )}
                      </View>
                    </View>
                  )}
                  
                  <View style={[styles.folderIcon, { backgroundColor: category.color + '20' }]}>
                    <Text style={styles.folderEmoji}>{category.icon}</Text>
                  </View>
                  <Text style={[
                    styles.folderName,
                    isEditMode && !canDelete && styles.folderNameDisabled
                  ]} numberOfLines={2}>
                    {category.name}
                  </Text>
                  <Text style={[
                    styles.folderCount,
                    isEditMode && !canDelete && styles.folderCountDisabled
                  ]}>
                    {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
                  </Text>
                  
                  {!isEditMode && (
                    <View style={styles.folderArrow}>
                      <Feather name="chevron-right" size={16} color={COLORS.textSecondary} />
                    </View>
                  )}
                </TouchableOpacity>
                
              </View>
            );
          })
          )}
        </View>
      </View>

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
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryEmoji}>{item.emoji}</Text>
                    <Text style={styles.entryTitle} numberOfLines={1}>{item.title}</Text>
                  </View>
                  {item.categoryIds && item.categoryIds.length > 0 && (
                    <View style={styles.entryCategories}>
                      {item.categoryIds.map((categoryId) => {
                        const category = categories.find(cat => cat.id === categoryId);
                        return category ? (
                          <CategoryChip
                            key={categoryId}
                            category={category}
                            size="small"
                            showIcon={true}
                            style={styles.entryCategoryChip}
                          />
                        ) : null;
                      })}
                    </View>
                  )}
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

      {/* Category Folder Modal */}
      <Modal
        animationType="slide"
        presentationStyle="pageSheet"
        visible={categoryModalVisible}
        onRequestClose={handleCloseCategoryModal}
      >
        <View style={styles.categoryModalContainer}>
          <View style={styles.categoryModalHeader}>
            <TouchableOpacity
              style={styles.categoryModalBackButton}
              onPress={handleCloseCategoryModal}
            >
              <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={styles.categoryModalTitleContainer}>
              <Text style={styles.categoryModalTitle}>
                {categories.find(cat => cat.id === selectedCategory)?.name || 'Category'}
              </Text>
              <Text style={styles.categoryModalSubtitle}>
                {categoryEntries.length} {categoryEntries.length === 1 ? 'entry' : 'entries'}
              </Text>
            </View>
            <View style={styles.categoryModalActions}>
              {selectedCategory && !categories.find(cat => cat.id === selectedCategory)?.isDefault && (
                <TouchableOpacity
                  style={[styles.categoryModalActionButton, styles.categoryModalDeleteButton]}
                  onPress={() => {
                    handleCloseCategoryModal();
                    handleDeleteCategory(selectedCategory);
                  }}
                >
                  <Feather name="trash-2" size={20} color={COLORS.error} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.categoryModalActionButton}
                onPress={() => {
                  handleCloseCategoryModal();
                  navigation.navigate('NewEntry', {});
                }}
              >
                <Feather name="plus" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={categoryEntries}
            keyExtractor={(item) => item.id!.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.categoryEntryItem} 
                onPress={() => {
                  handleCloseCategoryModal();
                  navigation.navigate('ViewEntry', { entryId: item.id! });
                }}
              >
                <View style={styles.categoryEntryHeader}>
                  <Text style={styles.categoryEntryEmoji}>{item.emoji}</Text>
                  <View style={styles.categoryEntryInfo}>
                    <Text style={styles.categoryEntryTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.categoryEntryDate}>
                      {new Date(item.createdFor).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>
                <Text style={styles.categoryEntryContent} numberOfLines={2}>
                  {item.content}
                </Text>
                {item.imageUri && (
                  <View style={styles.categoryEntryImageContainer}>
                    <Text style={styles.categoryEntryImageText}>📷 Image attached</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            style={styles.categoryEntriesList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.categoryEmptyContainer}>
                <Text style={styles.categoryEmptyIcon}>📁</Text>
                <Text style={styles.categoryEmptyTitle}>No entries yet</Text>
                <Text style={styles.categoryEmptySubtitle}>
                  Start writing to add entries to this category
                </Text>
                <StyledButton
                  title="Create Entry"
                  onPress={() => {
                    handleCloseCategoryModal();
                    navigation.navigate('NewEntry', {});
                  }}
                  style={styles.categoryEmptyButton}
                />
              </View>
            }
          />
        </View>
      </Modal>

      {/* Create Category Modal */}
      <Modal
        animationType="slide"
        presentationStyle="pageSheet"
        visible={isCreatingCategory}
        onRequestClose={() => setIsCreatingCategory(false)}
      >
        <View style={styles.createCategoryModalContainer}>
          <View style={styles.createCategoryModalHeader}>
            <Text style={styles.createCategoryModalTitle}>Create New Category</Text>
            <TouchableOpacity
              style={styles.createCategoryCloseButton}
              onPress={() => setIsCreatingCategory(false)}
            >
              <Feather name="x" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.createCategoryModalContent}>
            {/* Category Name Input */}
            <Text style={styles.createCategoryInputLabel}>Category Name</Text>
            <TextInput
              style={styles.createCategoryTextInput}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Enter category name"
              placeholderTextColor={COLORS.textSecondary}
            />

            {/* Color Selection */}
            <Text style={styles.createCategoryInputLabel}>Color</Text>
            <View style={styles.createCategoryColorGrid}>
              {PREDEFINED_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.createCategoryColorOption,
                    { backgroundColor: color },
                    newCategoryColor === color && styles.createCategorySelectedColorOption
                  ]}
                  onPress={() => setNewCategoryColor(color)}
                />
              ))}
            </View>

            {/* Icon Selection */}
            <Text style={styles.createCategoryInputLabel}>Icon (Optional)</Text>
            <View style={styles.createCategoryIconGrid}>
              {PREDEFINED_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.createCategoryIconOption,
                    newCategoryIcon === icon && styles.createCategorySelectedIconOption
                  ]}
                  onPress={() => setNewCategoryIcon(icon)}
                >
                  <Text style={styles.createCategoryIconText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Preview */}
            <Text style={styles.createCategoryInputLabel}>Preview</Text>
            <View style={styles.createCategoryPreviewContainer}>
              <View style={[styles.createCategoryPreviewIcon, { backgroundColor: newCategoryColor + '20' }]}>
                <Text style={styles.createCategoryPreviewEmoji}>{newCategoryIcon}</Text>
              </View>
              <Text style={styles.createCategoryPreviewName}>
                {newCategoryName || 'Category Name'}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.createCategoryModalActions}>
            <StyledButton
              title="Cancel"
              onPress={() => setIsCreatingCategory(false)}
              variant="secondary"
              style={styles.createCategoryCancelButton}
            />
            <StyledButton
              title="Create Category"
              onPress={handleCreateCategory}
              disabled={!newCategoryName.trim()}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const { width: screenWidth } = Dimensions.get('window');
const folderWidth = (screenWidth - SPACING.medium * 3) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  // Enhanced Samsung Notes Style Folders
  foldersContainer: {
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.large,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  foldersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: SPACING.medium,
    marginBottom: SPACING.medium,
  },
  foldersTitleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  foldersTitle: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  foldersSubtitle: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.small,
  },
  foldersActions: {
    flexDirection: 'row',
  },
  folderActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    marginLeft: SPACING.small,
  },
  folderActionButtonActive: {
    backgroundColor: COLORS.error + '15',
    borderColor: COLORS.error + '30',
  },
  foldersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.medium,
    justifyContent: 'flex-start',
  },
  folderCardContainer: {
    position: 'relative',
    width: '48%',
    marginRight: '2%',
    marginBottom: SPACING.medium,
  },
  folderCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 140,
  },
  folderCardEditMode: {
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  folderCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  folderSelectionIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
  },
  folderCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderCheckboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  folderNameDisabled: {
    color: COLORS.textSecondary,
    opacity: 0.6,
  },
  folderCountDisabled: {
    color: COLORS.textSecondary,
    opacity: 0.6,
  },
  emptyCategoriesContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.large,
    paddingHorizontal: SPACING.medium,
    marginBottom: SPACING.medium,
  },
  emptyCategoriesText: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.small,
    textAlign: 'center',
  },
  emptyCategoriesSubtext: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  folderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.small,
  },
  folderEmoji: {
    fontSize: 24,
  },
  folderName: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
    minHeight: 40,
  },
  folderCount: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.small,
  },
  folderArrow: {
    alignItems: 'flex-end',
  },

  // Category Modal Styles
  categoryModalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  categoryModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  categoryModalBackButton: {
    padding: SPACING.small,
    marginRight: SPACING.small,
  },
  categoryModalTitleContainer: {
    flex: 1,
  },
  categoryModalTitle: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  categoryModalSubtitle: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  categoryModalActions: {
    flexDirection: 'row',
  },
  categoryModalActionButton: {
    padding: SPACING.small,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginLeft: SPACING.small,
  },
  categoryModalDeleteButton: {
    backgroundColor: COLORS.error + '15',
    borderColor: COLORS.error + '30',
  },
  categoryEntriesList: {
    flex: 1,
    paddingHorizontal: SPACING.medium,
  },
  categoryEntryItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.medium,
    marginVertical: SPACING.small,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryEntryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.small,
  },
  categoryEntryEmoji: {
    fontSize: 20,
    marginRight: SPACING.small,
  },
  categoryEntryInfo: {
    flex: 1,
  },
  categoryEntryTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  categoryEntryDate: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
  },
  categoryEntryContent: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: SPACING.small,
  },
  categoryEntryImageContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 6,
    paddingHorizontal: SPACING.small,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  categoryEntryImageText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
  },
  categoryEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.large * 2,
  },
  categoryEmptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.medium,
  },
  categoryEmptyTitle: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.small,
  },
  categoryEmptySubtitle: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.large,
  },
  categoryEmptyButton: {
    paddingHorizontal: SPACING.large,
  },

  // Create Category Modal Styles
  createCategoryModalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  createCategoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  createCategoryModalTitle: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  createCategoryCloseButton: {
    padding: SPACING.small,
  },
  createCategoryModalContent: {
    flex: 1,
    paddingHorizontal: SPACING.medium,
  },
  createCategoryInputLabel: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.medium,
    marginBottom: SPACING.small,
  },
  createCategoryTextInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.medium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginBottom: SPACING.medium,
  },
  createCategoryColorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.small,
    marginBottom: SPACING.medium,
  },
  createCategoryColorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  createCategorySelectedColorOption: {
    borderColor: COLORS.textPrimary,
  },
  createCategoryIconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.small,
    marginBottom: SPACING.medium,
  },
  createCategoryIconOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createCategorySelectedIconOption: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
  },
  createCategoryIconText: {
    fontSize: 18,
  },
  createCategoryPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.medium,
  },
  createCategoryPreviewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.medium,
  },
  createCategoryPreviewEmoji: {
    fontSize: 20,
  },
  createCategoryPreviewName: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  createCategoryModalActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.medium,
    gap: SPACING.small,
  },
  createCategoryCancelButton: {
    flex: 1,
  },

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
    backgroundColor: COLORS.background,
    padding: SPACING.medium, borderRadius: 8, marginBottom: SPACING.small,
  },
  entryHeader: {
    flexDirection: 'row', alignItems: 'center',
  },
  entryEmoji: { fontSize: 20, marginRight: SPACING.small },
  entryTitle: { fontSize: FONT_SIZES.body, color: COLORS.textPrimary, flex: 1 },
  entryCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.small,
  },
  entryCategoryChip: {
    marginRight: SPACING.small,
    marginBottom: SPACING.small,
  },
  createEntryButton: {
    marginBottom: SPACING.small,
  },
});