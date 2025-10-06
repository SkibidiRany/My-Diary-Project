// screens/CategoryManagementScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useCategoryStore } from '../store/categoryStore';
import { Category } from '../types';
import CategoryChip from '../components/CategoryChip';
import StyledButton from '../components/StyledButton';
import StyledTextInput from '../components/StyledTextInput';
import EmojiPicker from '../components/EmojiPicker';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '../utils/alerts';

const PREDEFINED_COLORS = [
  '#006d77', '#83c5be', '#ffddd2', '#e29578', '#28a745',
  '#dc3545', '#ffc107', '#17a2b8', '#6f42c1', '#fd7e14',
  '#20c997', '#e83e8c', '#6c757d', '#343a40', '#007bff'
];

const PREDEFINED_ICONS = [
  '👤', '💼', '✈️', '🏥', '💡', '❤️', '🎯', '📚', 
  '🎨', '🏠', '🍕', '🎵', '🏃', '📱', '💰', '🌱'
];

export default function CategoryManagementScreen() {
  const {
    categories,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryEntries,
  } = useCategoryStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(PREDEFINED_COLORS[0]);
  const [newCategoryIcon, setNewCategoryIcon] = useState(PREDEFINED_ICONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryEntries, setCategoryEntries] = useState<any[]>([]);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      showErrorAlert('Please enter a category name');
      return;
    }

    // Check for duplicate names
    const existingCategory = categories.find(
      cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    );
    if (existingCategory) {
      showErrorAlert('A category with this name already exists');
      return;
    }

    setIsLoading(true);
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
      setIsCreating(false);
      showSuccessAlert('Category created successfully!');
    } catch (error) {
      console.error('Failed to create category:', error);
      showErrorAlert('Failed to create category. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) {
      showErrorAlert('Please enter a category name');
      return;
    }

    // Check for duplicate names (excluding current category)
    const existingCategory = categories.find(
      cat => cat.id !== editingCategory.id && 
      cat.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    );
    if (existingCategory) {
      showErrorAlert('A category with this name already exists');
      return;
    }

    setIsLoading(true);
    try {
      await updateCategory(editingCategory.id!, {
        name: newCategoryName.trim(),
        color: newCategoryColor,
        icon: newCategoryIcon,
        isDefault: editingCategory.isDefault,
      });
      
      setEditingCategory(null);
      setNewCategoryName('');
      setNewCategoryColor(PREDEFINED_COLORS[0]);
      setNewCategoryIcon(PREDEFINED_ICONS[0]);
      showSuccessAlert('Category updated successfully!');
    } catch (error) {
      console.error('Failed to update category:', error);
      showErrorAlert('Failed to update category. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = (category: Category) => {
    if (category.isDefault) {
      showErrorAlert('Cannot delete default categories');
      return;
    }

    showConfirmAlert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This will remove it from all entries but won't delete the entries themselves.`,
      async () => {
        setIsLoading(true);
        try {
          await deleteCategory(category.id!);
          showSuccessAlert('Category deleted successfully!');
        } catch (error) {
          console.error('Failed to delete category:', error);
          showErrorAlert('Failed to delete category. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    );
  };

  const handleViewCategoryEntries = async (category: Category) => {
    setIsLoading(true);
    try {
      const entries = await getCategoryEntries(category.id!);
      setCategoryEntries(entries);
      setViewingCategory(category);
    } catch (error) {
      console.error('Failed to fetch category entries:', error);
      showErrorAlert('Failed to load category entries');
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryColor(category.color);
    setNewCategoryIcon(category.icon || PREDEFINED_ICONS[0]);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryColor(PREDEFINED_COLORS[0]);
    setNewCategoryIcon(PREDEFINED_ICONS[0]);
  };

  const handleEditFromViewing = () => {
    if (viewingCategory) {
      startEdit(viewingCategory);
      setViewingCategory(null);
    }
  };

  const renderColorOption = (color: string) => (
    <TouchableOpacity
      key={color}
      style={[
        styles.colorOption,
        { backgroundColor: color },
        (editingCategory ? newCategoryColor : newCategoryColor) === color && styles.selectedColorOption
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

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <View style={styles.categoryItem}>
      <View style={styles.categoryInfo}>
        <CategoryChip
          category={item}
          size="medium"
          showIcon={true}
        />
        {item.isDefault && (
          <Text style={styles.defaultLabel}>Default</Text>
        )}
      </View>
      
      <View style={styles.categoryActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleViewCategoryEntries(item)}
        >
          <Text style={styles.actionButtonText}>View Entries</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => startEdit(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        {!item.isDefault && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteCategory(item)}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEntryItem = ({ item }: { item: any }) => (
    <View style={styles.entryItem}>
      <Text style={styles.entryTitle}>{item.title}</Text>
      <Text style={styles.entryDate}>
        {new Date(item.createdFor).toLocaleDateString()}
      </Text>
    </View>
  );

  if (isLoading && !editingCategory && !viewingCategory) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Categories</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsCreating(true)}
        >
          <Feather name="plus" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id!.toString()}
        renderItem={renderCategoryItem}
        style={styles.categoriesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No categories found</Text>
            <Text style={styles.emptySubtext}>Create your first category to get started</Text>
          </View>
        }
      />

      {/* Create/Edit Category Modal */}
      <Modal
        visible={isCreating || !!editingCategory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setIsCreating(false);
          cancelEdit();
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0} // Modal has no header
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {editingCategory ? 'Edit Category' : 'Create New Category'}
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      setIsCreating(false);
                      cancelEdit();
                    }}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                {/* Category Name Input */}
                <Text style={styles.inputLabel}>Category Name</Text>
                <StyledTextInput
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="Enter category name"
                  style={styles.textInput}
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

                {/* Preview */}
                <Text style={styles.inputLabel}>Preview</Text>
                <View style={styles.previewContainer}>
                  <CategoryChip
                    category={{
                      id: 0,
                      name: newCategoryName || 'Category Name',
                      color: newCategoryColor,
                      icon: newCategoryIcon,
                      createdAt: '',
                      isDefault: false,
                    }}
                    size="medium"
                    showIcon={true}
                  />
                </View>
                </View>

                <View style={styles.modalActions}>
                  <StyledButton
                    title="Cancel"
                    onPress={() => {
                      setIsCreating(false);
                      cancelEdit();
                    }}
                    variant="secondary"
                    style={styles.cancelButton}
                  />
                  <StyledButton
                    title={editingCategory ? 'Update Category' : 'Create Category'}
                    onPress={editingCategory ? handleEditCategory : handleCreateCategory}
                    disabled={!newCategoryName.trim() || isLoading}
                  />
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Category Entries Modal */}
      <Modal
        visible={!!viewingCategory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setViewingCategory(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Entries in "{viewingCategory?.name}"
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditFromViewing}
              >
                <Feather name="edit-3" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setViewingCategory(null)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={categoryEntries}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderEntryItem}
            style={styles.entriesList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No entries in this category</Text>
              </View>
            }
          />
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.medium,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  categoriesList: {
    flex: 1,
    paddingHorizontal: SPACING.medium,
  },
  categoryItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.medium,
    marginVertical: SPACING.small,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.small,
  },
  defaultLabel: {
    backgroundColor: COLORS.primary,
    color: COLORS.card,
    fontSize: FONT_SIZES.caption,
    fontWeight: '600',
    paddingHorizontal: SPACING.small,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: SPACING.small,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: SPACING.small,
  },
  actionButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: SPACING.small,
    paddingVertical: 6,
  },
  actionButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.caption,
    fontWeight: '600',
  },
  deleteButton: {
    borderColor: COLORS.error,
  },
  deleteButtonText: {
    color: COLORS.error,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.large * 2,
  },
  emptyText: {
    fontSize: FONT_SIZES.subtitle,
    color: COLORS.textSecondary,
    marginBottom: SPACING.small,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20, // Adjusted padding
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
    paddingVertical: SPACING.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.small,
  },
  editButton: {
    padding: SPACING.small,
    borderRadius: 6,
    backgroundColor: COLORS.primary + '10',
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  closeButton: {
    padding: SPACING.small,
  },
  closeButtonText: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  modalContent: {
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
    marginBottom: SPACING.small,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.small,
    marginBottom: SPACING.medium,
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
  previewContainer: {
    alignItems: 'flex-start',
    marginBottom: SPACING.medium,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.medium,
    gap: SPACING.small,
  },
  cancelButton: {
    flex: 1,
  },
  entriesList: {
    flex: 1,
    paddingHorizontal: SPACING.medium,
  },
  entryItem: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: SPACING.medium,
    marginVertical: SPACING.small,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  entryTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  entryDate: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
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

