// store/categoryStore.ts
import { create } from 'zustand';
import * as db from '../services/database';
import { Category } from '../types';

interface CategoryState {
  categories: Category[];
  isInitialized: boolean;
  selectedCategoryId: number | null;
  initialize: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'modifiedAt'>) => Promise<void>;
  updateCategory: (id: number, category: Omit<Category, 'id' | 'createdAt'>) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  setSelectedCategory: (categoryId: number | null) => void;
  getCategoryById: (id: number) => Category | undefined;
  getCategoryEntries: (categoryId: number) => Promise<any[]>;
  addEntryToCategory: (entryId: number, categoryId: number) => Promise<void>;
  removeEntryFromCategory: (entryId: number, categoryId: number) => Promise<void>;
  setEntryCategories: (entryId: number, categoryIds: number[]) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isInitialized: false,
  selectedCategoryId: null,

  initialize: async () => {
    try {
      if (!get().isInitialized) {
        await get().fetchCategories();
        set({ isInitialized: true });
      }
    } catch (error) {
      console.error("Failed to initialize category store:", error);
    }
  },

  fetchCategories: async () => {
    try {
      const categories = await db.fetchCategories();
      set({ categories });
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  },

  addCategory: async (newCategory) => {
    try {
      const categoryToSave: Omit<Category, 'id'> = {
        ...newCategory,
        createdAt: new Date().toISOString(),
        modifiedAt: null,
      };
      
      const newId = await db.addCategory(categoryToSave);
      const finalCategory = { ...categoryToSave, id: newId };
      
      set((state) => ({
        categories: [...state.categories, finalCategory].sort((a, b) => a.name.localeCompare(b.name))
      }));
    } catch (error) {
      console.error("Failed to add category:", error);
      throw error;
    }
  },

  updateCategory: async (id, category) => {
    try {
      const categoryToUpdate: Category = {
        ...category,
        id,
        createdAt: get().categories.find(c => c.id === id)?.createdAt || new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      };
      
      await db.updateCategory(id, categoryToUpdate);
      
      set((state) => ({
        categories: state.categories
          .map(cat => cat.id === id ? categoryToUpdate : cat)
          .sort((a, b) => a.name.localeCompare(b.name))
      }));
    } catch (error) {
      console.error("Failed to update category:", error);
      throw error;
    }
  },

  deleteCategory: async (id) => {
    try {
      await db.deleteCategory(id);
      
      set((state) => ({
        categories: state.categories.filter(cat => cat.id !== id),
        selectedCategoryId: state.selectedCategoryId === id ? null : state.selectedCategoryId
      }));
    } catch (error) {
      console.error("Failed to delete category:", error);
      throw error;
    }
  },

  setSelectedCategory: (categoryId) => {
    set({ selectedCategoryId: categoryId });
  },

  getCategoryById: (id) => {
    return get().categories.find(cat => cat.id === id);
  },

  getCategoryEntries: async (categoryId) => {
    try {
      return await db.getCategoryEntries(categoryId);
    } catch (error) {
      console.error("Failed to get category entries:", error);
      return [];
    }
  },

  addEntryToCategory: async (entryId, categoryId) => {
    try {
      await db.addEntryToCategory(entryId, categoryId);
    } catch (error) {
      console.error("Failed to add entry to category:", error);
      throw error;
    }
  },

  removeEntryFromCategory: async (entryId, categoryId) => {
    try {
      await db.removeEntryFromCategory(entryId, categoryId);
    } catch (error) {
      console.error("Failed to remove entry from category:", error);
      throw error;
    }
  },

  setEntryCategories: async (entryId, categoryIds) => {
    try {
      await db.setEntryCategories(entryId, categoryIds);
    } catch (error) {
      console.error("Failed to set entry categories:", error);
      throw error;
    }
  },
}));
