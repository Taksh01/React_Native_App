import React, { useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../store/auth";
import NotificationService from "../services/NotificationService";
import AppIcon from "../components/AppIcon";

// Import EIC Compatible Navigator
import EICNavigator from "./EICNavigator";
import CustomerNavigator from "./CustomerNavigator";

// Screens (make sure these paths exist in your project)
import MSOperations from "../screens/ms/MSOperations";
import MSDashboard from "../screens/ms/Dashboard";
import MsStockTransfers from "../screens/ms/StockTransfers";
import Decanting from "../screens/dbs/Decanting";
import ManualRequest from "../screens/dbs/ManualRequest";
import DBSDashboard from "../screens/dbs/Dashboard";
import DbsStockTransfers from "../screens/dbs/StockTransfers";
import DriverDashboard from "../screens/driver/DriverDashboard";
import EmergencyAlert from "../screens/driver/EmergencyAlert";
import SettingsScreen from "../screens/Settings";
import FdodoNavigator from "./FdodoNavigator";

const Tab = createBottomTabNavigator();

export default function RoleTabs({ navigation }) {
  const { user } = useAuth();
  const role = user?.role;

  // Switch to appropriate tab when a notification arrives
  useEffect(() => {
    if (!role) return undefined;
    let off = null;
    if (role === "DBS_OPERATOR") {
      off = NotificationService.addListener("dbs_arrival", (data) => {
        try {
          navigation?.navigate("Decanting", {
            fromNotification: true,
            type: "dbs_arrival",
            tripId: data?.tripId,
            dbsId: data?.dbsId,
          });
        } catch (_error) {
          // no-op
        }
      });
      // Also handle last event on mount (cold start where event fired before tabs ready)
      const last = NotificationService.getLastEvent("dbs_arrival");
      if (last?.tripId) {
        navigation?.navigate("Decanting", {
          fromNotification: true,
          type: "dbs_arrival",
          tripId: last.tripId,
          dbsId: last.dbsId,
        });
      }
    } else if (role === "MS_OPERATOR") {
      off = NotificationService.addListener("ms_arrival", (data) => {
        try {
          navigation?.navigate("Operations", {
            fromNotification: true,
            type: "ms_arrival",
            tripId: data?.tripId,
            driverId: data?.driverId,
            stationId: data?.stationId,
          });
        } catch (_error) {
          // no-op
        }
      });
      const last = NotificationService.getLastEvent("ms_arrival");
      if (last?.tripId) {
        navigation?.navigate("Operations", {
          fromNotification: true,
          type: "ms_arrival",
          tripId: last.tripId,
          driverId: last.driverId,
          stationId: last.stationId,
        });
      }
    }
    return () => off && off();
  }, [role, navigation]);

  if (!role) {
    return null;
  }

  // DBS Operator: Dashboard + Requests + Transfers + Decanting
  if (role === "DBS_OPERATOR") {
    return (
      <Tab.Navigator
        screenOptions={{
          headerTitleAlign: "center",
          tabBarActiveTintColor: "#3b82f6",
          tabBarInactiveTintColor: "#64748b",
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "500",
            marginTop: 4,
          },
          tabBarStyle: {
            paddingBottom: 20,
            paddingTop: 6,
            height: 70,
          },
        }}
      >
        <Tab.Screen
          name="DBS Dashboard"
          component={DBSDashboard}
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color }) => (
              <AppIcon icon="dashboard" size={20} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Manual Request"
          component={ManualRequest}
          options={{
            tabBarIcon: ({ color }) => (
              <AppIcon icon="requests" size={20} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="DbsStockTransfers"
          component={DbsStockTransfers}
          options={{
            title: "Transfers",
            tabBarIcon: ({ color }) => (
              <AppIcon icon="transfers" size={20} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Decanting"
          component={Decanting}
          options={{
            tabBarIcon: ({ color }) => (
              <AppIcon icon="factory" size={20} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <AppIcon icon="settings" size={20} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    );
  }

  // MS Operator
  if (role === "MS_OPERATOR") {
    return (
      <Tab.Navigator
        screenOptions={{
          headerTitleAlign: "center",
          tabBarActiveTintColor: "#3b82f6",
          tabBarInactiveTintColor: "#64748b",
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "500",
            marginTop: 4,
          },
          tabBarStyle: {
            paddingBottom: 20,
            paddingTop: 6,
            height: 70,
          },
        }}
      >
        <Tab.Screen
          name="MS Dashboard"
          component={MSDashboard}
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color }) => (
              <AppIcon icon="dashboard" size={20} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Operations"
          component={MSOperations}
          options={{
            tabBarIcon: ({ color }) => (
              <AppIcon icon="factory" size={20} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="MsStockTransfers"
          component={MsStockTransfers}
          options={{
            title: "Transfers",
            tabBarIcon: ({ color }) => (
              <AppIcon icon="transfers" size={20} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <AppIcon icon="settings" size={20} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    );
  }

  // EIC - Use Compatible Navigation (Drawer in EAS, Stack in Expo Go)
  // ! Drawer Navigator
  if (role === "EIC") {
    return <EICNavigator />;
  }

  // Removed SGL_DRIVER branch (legacy role no longer used)

  // Driver (New comprehensive role)
  // Tab Navigator with 3 tabs
  if (role === "DRIVER") {
    return (
      <Tab.Navigator
        screenOptions={{
          headerTitleAlign: "center",
          tabBarActiveTintColor: "#3b82f6",
          tabBarInactiveTintColor: "#64748b",
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "500",
            marginTop: 4,
          },
          tabBarStyle: {
            paddingBottom: 20,
            paddingTop: 6,
            height: 70,
          },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DriverDashboard}
          options={{
            tabBarIcon: ({ color }) => (
              <AppIcon icon="dashboard" size={20} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="EmergencyAlert"
          component={EmergencyAlert}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <AppIcon icon="settings" size={20} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    );
  }

  // FDODO Customer
  // Use FDODO Navigator with drawer navigation
  // ! Drawer Navigator
  if (role === "FDODO_CUSTOMER") {
    return <FdodoNavigator />;
  }

  // SGL Customer - Use Customer Navigator with bottom tabs
  // ! Drawer Navigator
  if (role === "SGL_CUSTOMER") {
    return <CustomerNavigator />;
  }

  // Fallback
  return (
    <Tab.Navigator
      screenOptions={{
        headerTitleAlign: "center",
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#64748b",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginTop: 4,
        },
        tabBarStyle: {
          paddingBottom: 20,
          paddingTop: 6,
          height: 70,
        },
      }}
    >
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <AppIcon icon="settings" size={20} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
