// store/userStore.ts
import { create } from 'zustand';
import { getUserProfile, updateUserProfile } from '../services/firestoreService';
import { UserProfile } from '../types';

interface UserState {
  userProfile: UserProfile | null;
  isLoading: boolean;
  fetchUserProfile: (userId: string) => Promise<void>;
  updateUserProfile: (userId: string, data: Partial<UserProfile>) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  userProfile: null,
  isLoading: true,
  
  /**
   * Fetches the user's profile from Firestore and updates the state.
   * @param userId The unique ID of the user.
   */
  fetchUserProfile: async (userId: string) => {
    set({ isLoading: true });
    try {
      const profile = await getUserProfile(userId);
      set({ userProfile: profile, isLoading: false });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      set({ isLoading: false });
    }
  },

  /**
   * Updates the user's profile in Firestore and in the local state.
   * @param userId The unique ID of the user.
   * @param data An object containing the profile fields to update.
   */
  updateUserProfile: async (userId: string, data: Partial<UserProfile>) => {
    try {
      await updateUserProfile(userId, data);
      const currentProfile = get().userProfile;
      if (currentProfile) {
        set({ userProfile: { ...currentProfile, ...data } });
      }
    } catch (error) {
      console.error("Error updating user profile:", error);
    }
  },
}));