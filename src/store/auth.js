import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Auth store
 * - Holds {user, token}
 * - Persists to AsyncStorage so relaunch keeps you logged in
 * - In future, rotate token via refresh, store in SecureStore for extra security if needed.
 */
export const useAuth = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setUser: (u, t) => set({ user: u, token: t }),
      updateUserPermissions: (permissions) =>
        set((state) => {
          if (!state.user || !permissions) {
            return {};
          }
          return {
            user: {
              ...state.user,
              permissions: {
                ...state.user.permissions,
                ...permissions,
              },
            },
          };
        }),
      logout: async () => {
        // Attempt to unregister device token from backend before clearing auth
        try {
          const ns = require("../services/NotificationService");
          const NotificationService = ns?.default || ns;
          const state = get();
          const user = state?.user;
          if (
            NotificationService &&
            NotificationService.deviceToken &&
            user?.id
          ) {
            try {
              if (user.role === "DBS_OPERATOR") {
                await NotificationService.unregisterDBSDeviceToken(user.id);
              } else if (user.role === "MS_OPERATOR") {
                await NotificationService.unregisterMSDeviceToken(user.id);
              } else if (user.role === "EIC") {
                await NotificationService.unregisterEICDeviceToken(user.id);
              } else if (user.role === "DRIVER" || user.role === "SGL_DRIVER") {
                await NotificationService.unregisterDriverDeviceToken(user.id);
              }
            } catch (e) {
              console.warn(
                "Failed to unregister device token during logout:",
                e
              );
              // proceed to clear local state even if unregister fails
            }
          }
        } catch (error) {
          console.error("Error during logout cleanup:", error);
        } finally {
          // Clear auth state
          set({ user: null, token: null });
        }
      },
    }),
    {
      name: "gts-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
