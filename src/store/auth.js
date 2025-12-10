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

      syncPermissions: async () => {
        try {
          const { token, user } = get();
          if (!token) return;

          // Inline require to avoid circular dependency
          const { apiGetPermissions } = require("../lib/api");
          
          const newPermissions = await apiGetPermissions();
          
          set((state) => ({
            permissions: newPermissions,
            // Also update the user object's copy if it exists, to keep them in sync
            user: state.user 
              ? { ...state.user, permissions: newPermissions }
              : state.user
          }));
          
          console.log("[AUTH_STORE] Permissions synced:", Object.keys(newPermissions));
        } catch (error) {
          console.error("[AUTH_STORE] Failed to sync permissions:", error);
          // We intentionally don't throw here to avoid breaking the UI flow 
          // if a background sync fails.
        }
      },

      logout: async () => {
        console.log("[AUTH_STORE] Logout started");
        
        // 1. Clear Zustand state first
        set({
          user: null,
          token: null,
          permissions: {},
        });
        console.log("[AUTH_STORE] Zustand state cleared");

        // 2. Clear persisted storage
        try {
          console.log("[AUTH_STORE] removing auth-storage...");
          await AsyncStorage.removeItem("auth-storage");
          
          console.log("[AUTH_STORE] removing current_trip_token...");
          await AsyncStorage.removeItem("current_trip_token");
          
          console.log("[AUTH_STORE] removing current_trip_data...");
          await AsyncStorage.removeItem("current_trip_data");

          console.log("[AUTH_STORE] removing MS operations state...");
          await AsyncStorage.removeItem("@ms_operations_state");

          console.log("[AUTH_STORE] removing DBS decanting state...");
          await AsyncStorage.removeItem("@dbs_decanting_state");
          
          console.log("[AUTH_STORE] ALL STORAGE CLEARED SUCCESSFULLY");
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
