import "react-native-gesture-handler";
import "react-native-reanimated";
import React, { useEffect, useRef } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { InteractionManager } from "react-native";
import GestureCompatWrapper from "./src/components/GestureCompatWrapper";
import RootNavigator from "./src/navigation/RootNavigator";
import { StatusBar } from "expo-status-bar";
import NotificationService from "./src/services/NotificationService";
import { ThemeProvider, useTheme } from "./src/theme";
import ErrorBoundary from "./src/components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { theme } = useTheme();

  const navigationTheme = React.useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surfaceElevated,
        text: theme.colors.textPrimary,
        border: theme.colors.borderSubtle,
        notification: theme.colors.danger,
      },
    }),
    [theme]
  );

  const navigationRef = useRef();

  useEffect(() => {
    // Initialize notification service when app starts
    const initializeNotifications = async () => {
      try {
        // Initialize notification service without registering token
        // Token will be registered after user login with real user ID
        await NotificationService.initialize();
      } catch (error) {
        console.error("Failed to initialize notifications:", error);
      }
    };

    initializeNotifications();
  }, []);

  return (
    <GestureCompatWrapper style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer
            ref={navigationRef}
            theme={navigationTheme}
            onReady={() => {
              InteractionManager.runAfterInteractions(() => {
                // Set navigationRef when nav is ready to ensure we can navigate to tabs
                NotificationService.setNavigationRef(navigationRef.current);
                // Flush any pending intents (e.g., notification tapped on cold start)
                NotificationService.flushPendingIntents?.();
              });
            }}
          >
            <RootNavigator />
            <StatusBar
              style={theme.statusBarStyle}
              backgroundColor={theme.colors.background}
            />
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureCompatWrapper>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
