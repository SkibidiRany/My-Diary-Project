// components/CategoryPicker.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  TextInput,
  ScrollView 
} from 'react-native';
import { Category } from '../types';
import { useCategoryStore } from '../store/categoryStore';
import CategoryChip from './CategoryChip';
import StyledButton from './StyledButton';
import EmojiPicker from './EmojiPicker';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';

interface CategoryPickerProps {
  selectedCategoryIds: number[];
  onSelectionChange: (categoryIds: number[]) => void;
  multiSelect?: boolean;
  placeholder?: string;
  style?: any;
}

const PREDEFINED_COLORS = [
  '#006d77', '#83c5be', '#ffddd2', '#e29578', '#28a745',
  '#dc3545', '#ffc107', '#17a2b8', '#6f42c1', '#fd7e14',
  '#20c997', '#e83e8c', '#6c757d', '#343a40', '#007bff'
];

const PREDEFINED_ICONS = [
  '👤', '💼', '✈️', '🏥', '💡', '❤️', '🎯', '📚', 
  '🎨', '🏠', '🍕', '🎵', '🏃', '📱', '💰', '🌱'
];

export default function CategoryPicker({ 
  selectedCategoryIds, 
  onSelectionChange, 
  multiSelect = true,
  placeholder = "Select categories...",
  style 
}: CategoryPickerProps) {
  const { categories, addCategory, fetchCategories } = useCategoryStore();
  const [isModalVisible, setModalVisible] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(PREDEFINED_COLORS[0]);
  const [newCategoryIcon, setNewCategoryIcon] = useState(PREDEFINED_ICONS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryToggle = (categoryId: number) => {
    if (multiSelect) {
      const isSelected = selectedCategoryIds.includes(categoryId);
      if (isSelected) {
        onSelectionChange(selectedCategoryIds.filter(id => id !== categoryId));
      } else {
        onSelectionChange([...selectedCategoryIds, categoryId]);
      }
    } else {
      onSelectionChange([categoryId]);
      setModalVisible(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      await addCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor,
        icon: newCategoryIcon,
        isDefault: false,
      });
      
      setNewCategoryName('');
      setNewCategoryColor(PREDEFINED_COLORS[0]);
      setNewCategoryIcon(PREDEFINED_ICONS[0]);
      setIsCreatingCategory(false);
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const getSelectedCategories = () => {
    return categories.filter(cat => selectedCategoryIds.includes(cat.id!));
  };

  const renderCategoryItem = ({ item }: { item: Category }) => {
    const isSelected = selectedCategoryIds.includes(item.id!);
    
    return (
      <TouchableOpacity
        style={styles.categoryItem}
        onPress={() => handleCategoryToggle(item.id!)}
      >
        <CategoryChip
          category={item}
          selected={isSelected}
          size="medium"
          showIcon={true}
        />
        {isSelected && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderColorOption = (color: string) => (
    <TouchableOpacity
      key={color}
      style={[
        styles.colorOption,
        { backgroundColor: color },
        newCategoryColor === color && styles.selectedColorOption
      ]}
      onPress={() => setNewCategoryColor(color)}
    />
  );

  const renderIconOption = (icon: string) => (
    <TouchableOpacity
      key={icon}
      style={[
        styles.iconOption,
        newCategoryIcon === icon && styles.selectedIconOption
      ]}
      onPress={() => setNewCategoryIcon(icon)}
    >
      <Text style={styles.iconText}>{icon}</Text>
      {newCategoryIcon === icon && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.checkmarkBadge}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      {/* Selected Categories Display */}
      <TouchableOpacity
        style={styles.selectedContainer}
        onPress={() => setModalVisible(true)}
      >
        {selectedCategoryIds.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {getSelectedCategories().map(category => (
              <CategoryChip
                key={category.id}
                category={category}
                size="small"
                showIcon={true}
              />
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.placeholder}>{placeholder}</Text>
        )}
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      {/* Category Selection Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {multiSelect ? 'Select Categories' : 'Select Category'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.textSecondary}
          />

          {/* Categories List */}
          <FlatList
            data={filteredCategories}
            keyExtractor={(item) => item.id!.toString()}
            renderItem={renderCategoryItem}
            style={styles.categoriesList}
            showsVerticalScrollIndicator={false}
          />

          {/* Create New Category Button */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setIsCreatingCategory(true)}
          >
            <Text style={styles.createButtonText}>+ Create New Category</Text>
          </TouchableOpacity>

          {/* Create Category Modal */}
          <Modal
            visible={isCreatingCategory}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setIsCreatingCategory(false)}
          >
            <View style={styles.createModalContainer}>
              <View style={styles.createModalHeader}>
                <Text style={styles.createModalTitle}>Create New Category</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsCreatingCategory(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.createModalContent}>
                {/* Category Name Input */}
                <Text style={styles.inputLabel}>Category Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="Enter category name"
                  placeholderTextColor={COLORS.textSecondary}
                />

                {/* Color Selection */}
                <Text style={styles.inputLabel}>Color</Text>
                <View style={styles.colorGrid}>
                  {PREDEFINED_COLORS.map(renderColorOption)}
                </View>

                {/* Icon Selection */}
                <View style={styles.iconSectionHeader}>
                  <Text style={styles.inputLabel}>Category Icon</Text>
                  <TouchableOpacity 
                    onPress={() => {
                      console.log('More button pressed - opening emoji picker');
                      setShowEmojiPicker(true);
                    }}
                    style={styles.browseAllButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.browseAllText}>More ›</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.iconScrollView}
                  contentContainerStyle={styles.iconScrollContent}
                  nestedScrollEnabled={true}
                >
                  {PREDEFINED_ICONS.map(renderIconOption)}
                </ScrollView>
              </ScrollView>

              <View style={styles.createModalActions}>
                <StyledButton
                  title="Cancel"
                  onPress={() => setIsCreatingCategory(false)}
                  variant="secondary"
                  style={styles.cancelButton}
                />
                <StyledButton
                  title="Create Category"
                  onPress={handleCreateCategory}
                  disabled={!newCategoryName.trim()}
                />
              </View>
            </View>
          </Modal>

          {/* Emoji Picker Modal */}
          <EmojiPicker
            visible={showEmojiPicker}
            onEmojiSelect={(emoji) => setNewCategoryIcon(emoji)}
            onClose={() => setShowEmojiPicker(false)}
            selectedEmoji={newCategoryIcon}
            title="Choose Category Icon"
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.small,
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    minHeight: 48,
  },
  placeholder: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
  },
  arrow: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.medium,
    paddingTop: SPACING.large,
    paddingBottom: SPACING.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: SPACING.small,
  },
  closeButtonText: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  searchInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    marginHorizontal: SPACING.medium,
    marginVertical: SPACING.small,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  categoriesList: {
    flex: 1,
    paddingHorizontal: SPACING.medium,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.small,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  checkmark: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.medium,
    marginVertical: SPACING.small,
    paddingVertical: SPACING.medium,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: COLORS.card,
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
  },
  createModalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  createModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  createModalTitle: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  createModalContent: {
    flex: 1,
    paddingHorizontal: SPACING.medium,
  },
  inputLabel: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.medium,
    marginBottom: SPACING.small,
  },
  textInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.small,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: COLORS.textPrimary,
  },
  iconScrollView: {
    marginBottom: SPACING.medium,
  },
  iconScrollContent: {
    paddingRight: SPACING.medium,
    gap: SPACING.small,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selectedIconOption: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.primary + '08',
  },
  iconText: {
    fontSize: 24,
  },
  createModalActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.medium,
    gap: SPACING.small,
  },
  cancelButton: {
    flex: 1,
  },
  iconSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.small,
  },
  browseAllButton: {
    paddingHorizontal: SPACING.small,
    paddingVertical: 4,
  },
  browseAllText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.primary,
    fontWeight: '500',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkBadge: {
    color: COLORS.card,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

