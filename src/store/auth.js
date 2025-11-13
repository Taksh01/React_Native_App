import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CONFIG } from "../config";

let markHydratedRef;

/**
 * Auth store
 * - Holds {user, token}
 * - Persists to AsyncStorage so relaunch keeps you logged in
 * - In future, rotate token via refresh, store in SecureStore for extra security if needed.
 */
export const useAuth = create(
  persist(
    (set, get) => {
      const markHydrated = () => {
        set({ hydrated: true });
      };
      markHydratedRef = markHydrated;

      return {
        user: null,
        token: null,
        hydrated: false,
        markHydrated,
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
          const startedAt = Date.now();
          console.log(
            "[Auth] Logout triggered",
            new Date(startedAt).toISOString()
          );

          const state = get();
          const user = state?.user;
          const tokenBeforeClear = state?.token;

          // Clear auth synchronously so navigation snaps back instantly.
          set({ user: null, token: null });
          console.log("[Auth] Auth state cleared", {
            hadUser: Boolean(user),
            hadToken: Boolean(tokenBeforeClear),
          });

          let NotificationService;
          try {
            const ns = require("../services/NotificationService");
            NotificationService = ns?.default || ns;
          } catch (error) {
            console.warn("[Auth] NotificationService import failed", error);
          }

          const hasService = Boolean(NotificationService);
          const hasDeviceToken = Boolean(NotificationService?.deviceToken);
          const shouldSkipNetwork =
            !user?.id ||
            !hasService ||
            !hasDeviceToken ||
            CONFIG.MOCK_MODE ||
            NotificationService?.areNotificationsLimited?.();

          if (shouldSkipNetwork) {
            console.log("[Auth] Skipping token unregister", {
              hasService,
              hasDeviceToken,
              hasUser: Boolean(user?.id),
              mockMode: CONFIG.MOCK_MODE,
              limitedNotifications:
                NotificationService?.areNotificationsLimited?.() ?? null,
            });
            return;
          }

          const unregisterTask = (async () => {
            try {
              if (user.role === "DBS_OPERATOR") {
                console.log("[Auth] Unregister DBS token");
                await NotificationService.unregisterDBSDeviceToken(user.id);
              } else if (user.role === "MS_OPERATOR") {
                console.log("[Auth] Unregister MS token");
                await NotificationService.unregisterMSDeviceToken(user.id);
              } else if (user.role === "EIC") {
                console.log("[Auth] Unregister EIC token");
                await NotificationService.unregisterEICDeviceToken(user.id);
              } else if (user.role === "DRIVER" || user.role === "SGL_DRIVER") {
                console.log("[Auth] Unregister Driver token");
                await NotificationService.unregisterDriverDeviceToken(user.id);
              }
              console.log("[Auth] Device token unregister finished");
            } catch (error) {
              console.warn("[Auth] Device token unregister failed", error);
            }
          })();

          const timeoutMs = 5000;
          const timeoutPromise = new Promise((resolve) =>
            setTimeout(() => {
              console.warn("[Auth] Device token unregister timed out", {
                timeoutMs,
              });
              resolve("timeout");
            }, timeoutMs)
          );

          try {
            await Promise.race([unregisterTask, timeoutPromise]);
          } finally {
            unregisterTask
              .catch(() => {
                // Already logged above; swallow to avoid unhandled rejection.
              })
              .finally(() => {
                console.log("[Auth] Logout cleanup background task complete", {
                  durationMs: Date.now() - startedAt,
                });
              });
          }
        },
      };
    },
    {
      name: "gts-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("[Auth] Rehydrate error", error);
        }
        if (!markHydratedRef && state?.markHydrated) {
          markHydratedRef = state.markHydrated;
        }
        markHydratedRef?.();
      },
    }
  )
);
