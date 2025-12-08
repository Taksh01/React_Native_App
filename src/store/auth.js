/**
 * Auth Store - Zustand-based authentication state management
 * Handles user session, token storage, and permissions
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useAuth = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      permissions: {},
      hydrated: false,

      // Actions
      setUser: (user, token) => {

        set({
          user,
          token,
          permissions: user?.permissions || {},
        });
      },

      updateUserPermissions: (permissions) => {

        set((state) => ({
          permissions: { ...state.permissions, ...permissions },
          user: state.user
            ? { ...state.user, permissions: { ...state.user.permissions, ...permissions } }
            : null,
        }));
      },

      logout: async () => {

        set({
          user: null,
          token: null,
          permissions: {},
        });
        // Clear persisted storage
        try {
          await AsyncStorage.removeItem("auth-storage");

        } catch (error) {
          console.error("[AUTH_STORE] Failed to clear storage:", error);
        }
      },

      // Hydration marker
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {

        // Mark as hydrated after rehydration completes
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        permissions: state.permissions,
      }),
    }
  )
);
