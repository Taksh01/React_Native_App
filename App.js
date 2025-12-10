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
import PermissionRequiredScreen from "./src/screens/PermissionRequiredScreen";
import { AppState, Linking } from "react-native";

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
  const [hasPermission, setHasPermission] = React.useState(null); // null = checking, true/false

  const checkPermissions = async () => {
    // Check if we have permission
    const granted = await NotificationService.checkPermission();
    setHasPermission(granted);
    return granted;
  };

  useEffect(() => {
    // 1. Initial check on mount
    const init = async () => {
      // First check existing status
      let granted = await checkPermissions();
      
      // If not granted, try to request ONCE on startup
      if (!granted) {
        granted = await NotificationService.requestPermission();
        setHasPermission(granted);
      }
      
      // Initialize service logic regardless (it handles its own permission check internally too, but we need state here)
      try {
         await NotificationService.initialize();
      } catch (e) {
         console.error(e);
      }
    };
    
    init();

    // 2. Add AppState listener to re-check when app comes to foreground
    // This covers the case where user goes to settings, enables/disables, and comes back
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkPermissions();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (hasPermission === false) {
    return (
      <PermissionRequiredScreen 
        onPermissionGranted={() => setHasPermission(true)} 
      />
    );
  }

  // Optional: Show nothing or splash while checking (hasPermission === null)
  // But usually typically we can just render the app and let it switch if needed, 
  // or return null to avoid flicker. 
  // If we return null, the splash screen stays until we are done (if expo).
  // Let's render null for a split second to ensure we don't show app then hide it.
  if (hasPermission === null) {
      return null; 
  }

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
