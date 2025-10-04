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
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useCategoryStore } from '../store/categoryStore';
import { Category } from '../types';
import CategoryChip from '../components/CategoryChip';
import StyledButton from '../components/StyledButton';
import StyledTextInput from '../components/StyledTextInput';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '../utils/alerts';

const PREDEFINED_COLORS = [
  '#006d77', '#83c5be', '#ffddd2', '#e29578', '#28a745',
  '#dc3545', '#ffc107', '#17a2b8', '#6f42c1', '#fd7e14',
  '#20c997', '#e83e8c', '#6c757d', '#343a40', '#007bff'
];

const PREDEFINED_ICONS = [
  '👤', '💼', '✈️', '🏥', '💡', '❤️', '🎯', '📚', '🎨', '🏠',
  '🍕', '🎵', '🏃', '📱', '💰', '🌱', '🎉', '🔒', '⭐', '🎭'
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

  const handleDeleteCategory = async (category: Category) => {
    if (category.isDefault) {
      showErrorAlert('Cannot delete default categories');
      return;
    }

    const confirmed = await showConfirmAlert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This will remove it from all entries but won't delete the entries themselves.`
    );

    if (confirmed) {
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
        (editingCategory ? newCategoryIcon : newCategoryIcon) === icon && styles.selectedIconOption
      ]}
      onPress={() => setNewCategoryIcon(icon)}
    >
      <Text style={styles.iconText}>{icon}</Text>
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

          <ScrollView style={styles.modalContent}>
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
            <Text style={styles.inputLabel}>Icon (Optional)</Text>
            <View style={styles.iconGrid}>
              {PREDEFINED_ICONS.map(renderIconOption)}
            </View>

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
          </ScrollView>

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
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setViewingCategory(null)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
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
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.small,
    marginBottom: SPACING.medium,
  },
  iconOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIconOption: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
  },
  iconText: {
    fontSize: 18,
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
});
