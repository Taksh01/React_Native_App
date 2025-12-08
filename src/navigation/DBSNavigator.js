import React, { useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../store/auth";
import { gestureHandlerAvailable } from "../components/GestureCompatWrapper";
import AppIcon from "../components/AppIcon";

// DBS Screens
import DBSDashboard from "../screens/dbs/Dashboard";
import Decanting from "../screens/dbs/Decanting";
import ManualRequest from "../screens/dbs/ManualRequest";
import RequestStatus from "../screens/dbs/RequestStatus";
import DbsStockTransfers from "../screens/dbs/StockTransfers";
import SettingsScreen from "../screens/Settings";

let createDrawerNavigator, DrawerContentScrollView, DrawerItemList;

// Conditionally import drawer navigation
if (gestureHandlerAvailable) {
  try {
    const DrawerNav = require("@react-navigation/drawer");
    createDrawerNavigator = DrawerNav.createDrawerNavigator;
    DrawerContentScrollView = DrawerNav.DrawerContentScrollView;
    DrawerItemList = DrawerNav.DrawerItemList;
  } catch (_error) {
    console.warn("Drawer navigation not available");
  }
}

// Fallback stack navigator for Expo Go
const {
  createNativeStackNavigator,
} = require("@react-navigation/native-stack");
const Stack = createNativeStackNavigator();

// Custom Drawer Content (only used when drawer is available)
const CustomDrawerContent = memo(function CustomDrawerContent(props) {
  const { user, logout } = useAuth();

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const userInitial = useMemo(() => user?.name?.charAt(0)?.toUpperCase() || "D", [user?.name]);
  const userName = useMemo(() => user?.name || "DBS Operator", [user?.name]);

  return (
    <SafeAreaView style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.name || "DBS Operator"}</Text>
            <Text style={styles.userRole}>DBS Operator</Text>
          </View>
        </View>
      </View>

      <DrawerContentScrollView {...props} style={styles.drawerContent}>
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>OPERATIONS</Text>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      <View style={styles.drawerFooter}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <AppIcon
            icon="logout"
            size={16}
            color="#dc2626"
            style={styles.logoutIcon}
          />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
});

// Drawer Navigator (for EAS builds)
const DrawerNavigator = memo(function DrawerNavigator() {
  const Drawer = useMemo(() => createDrawerNavigator(), []);

  const drawerContent = useCallback(
    (props) => <CustomDrawerContent {...props} />,
    []
  );

  const screenOptions = useMemo(
    () => ({
      headerShown: true,
      headerStyle: {
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
      },
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1e293b",
      },
      headerTintColor: "#3b82f6",
      drawerStyle: {
        backgroundColor: "#ffffff",
        width: 280,
      },
      drawerActiveTintColor: "#3b82f6",
      drawerActiveBackgroundColor: "#eff6ff",
      drawerInactiveTintColor: "#64748b",
      drawerLabelStyle: {
        fontSize: 16,
        fontWeight: "500",
        marginLeft: 4,
      },
      drawerItemStyle: {
        borderRadius: 8,
        marginHorizontal: 8,
        marginVertical: 2,
      },
      drawerType: Platform.select({ ios: "slide", default: "front" }),
      swipeEnabled: true,
      gestureEnabled: true,
      lazy: true,
      detachInactiveScreens: true,
      unmountOnBlur: false,
      freezeOnBlur: false,
      overlayColor: "rgba(0,0,0,0.35)",
      swipeEdgeWidth: 28,
      sceneContainerStyle: { backgroundColor: "#f1f5f9" },
    }),
    []
  );

  return (
    <Drawer.Navigator
      initialRouteName="DBSDashboard"
      drawerContent={drawerContent}
      screenOptions={screenOptions}
    >
      <Drawer.Screen
        name="DBSDashboard"
        component={DBSDashboard}
        options={{
          title: "Dashboard",
          drawerIcon: ({ color }) => (
            <AppIcon icon="dashboard" size={18} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="ManualRequest"
        component={ManualRequest}
        options={{
          title: "Manual Request",
          drawerIcon: ({ color }) => (
            <AppIcon icon="requests" size={18} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="RequestStatus"
        component={RequestStatus}
        options={{
          title: "Request Status",
          drawerIcon: ({ color }) => (
            <AppIcon icon="requestPending" size={18} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="DbsStockTransfers"
        component={DbsStockTransfers}
        options={{
          title: "Stock Transfers",
          drawerIcon: ({ color }) => (
            <AppIcon icon="transfers" size={18} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Decanting"
        component={Decanting}
        options={{
          title: "Decanting",
          drawerIcon: ({ color }) => (
            <AppIcon icon="factory" size={18} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          drawerIcon: ({ color }) => (
            <AppIcon icon="settings" size={18} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
});

// Stack Navigator (fallback for Expo Go)
function StackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#ffffff",
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "600",
          color: "#1e293b",
        },
        headerTintColor: "#3b82f6",
      }}
    >
      <Stack.Screen
        name="DBSDashboard"
        component={DBSDashboard}
        options={{ title: "Dashboard" }}
      />
      <Stack.Screen
        name="ManualRequest"
        component={ManualRequest}
        options={{ title: "Manual Request" }}
      />
      <Stack.Screen
        name="RequestStatus"
        component={RequestStatus}
        options={{ title: "Request Status" }}
      />
      <Stack.Screen
        name="DbsStockTransfers"
        component={DbsStockTransfers}
        options={{ title: "Stock Transfers" }}
      />
      <Stack.Screen
        name="Decanting"
        component={Decanting}
        options={{ title: "Decanting" }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
    </Stack.Navigator>
  );
}

// Main export - chooses navigator based on availability
export default function DBSNavigator() {
  if (gestureHandlerAvailable && createDrawerNavigator) {
    return <DrawerNavigator />;
  }

  // Fallback to stack navigator for Expo Go

  return <StackNavigator />;
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  drawerHeader: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: "#64748b",
  },
  drawerContent: {
    flex: 1,
    paddingTop: 20,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    padding: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    color: "#dc2626",
    fontWeight: "600",
  },
});
