// store/userStore.ts
import { create } from 'zustand';
import { getUserProfile, updateUserProfile } from '../services/firestoreService';
import { UserProfile } from '../types';
import { auth } from '../services/firebase';

interface UserState {
  userProfile: UserProfile | null;
  isLoading: boolean;
  fetchUserProfile: (userId: string) => Promise<void>;
  updateUserProfile: (userId: string, data: Partial<UserProfile>) => Promise<void>;
  createInitialProfile: (userId: string, additionalData: { username: string; birthdate?: string; pronouns?: string; bio?: string }) => Promise<void>;
  clearProfile: () => void;
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

  /**
   * Creates an initial profile for a first-time user with data from Firebase Auth
   * plus user-entered information from the profile setup screen.
   * @param userId The unique ID of the user.
   * @param additionalData Additional profile data entered by the user.
   */
  createInitialProfile: async (userId: string, additionalData: { username: string; birthdate?: string; pronouns?: string; bio?: string }) => {
    set({ isLoading: true });
    
    try {
      const authUser = auth.currentUser;
      if (!authUser) {
        throw new Error('User not authenticated');
      }

      // Create the initial profile with Firebase Auth data + user input
      const initialProfile: Partial<UserProfile> = {
        uid: userId,
        email: authUser.email,
        displayName: authUser.displayName,
        photoURL: authUser.photoURL,
        username: additionalData.username,
      };

      // Only add optional fields if they have actual values (not empty strings)
      if (additionalData.birthdate && additionalData.birthdate.trim()) {
        initialProfile.birthdate = additionalData.birthdate.trim();
      }
      if (additionalData.pronouns && additionalData.pronouns.trim()) {
        initialProfile.pronouns = additionalData.pronouns.trim();
      }
      if (additionalData.bio && additionalData.bio.trim()) {
        initialProfile.bio = additionalData.bio.trim();
      }

      console.log('📝 Creating initial profile in Firestore...', initialProfile);
      await updateUserProfile(userId, initialProfile);
      
      // Update local state with the new profile
      const fullProfile = await getUserProfile(userId);
      set({ userProfile: fullProfile, isLoading: false });
      
      console.log('✅ Initial profile created successfully');
    } catch (error) {
      console.error('❌ Error creating initial profile:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Clears the user profile from the state.
   */
  clearProfile: () => {
    set({ userProfile: null, isLoading: false });
  },
}));