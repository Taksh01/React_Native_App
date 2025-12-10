import React, { useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../store/auth";
import NotificationService from "../services/NotificationService";
import AppIcon from "../components/AppIcon";

// Import Compatible Navigators (Drawer in EAS, Stack/Tabs in Expo Go)
import EICNavigator from "./EICNavigator";
import DBSNavigator from "./DBSNavigator";
import CustomerNavigator from "./CustomerNavigator";

// Screens (make sure these paths exist in your project)
import MSOperations from "../screens/ms/MSOperations";
import MSDashboard from "../screens/ms/Dashboard";
import MsStockTransfers from "../screens/ms/StockTransfers";
import TripHistory from "../screens/driver/TripHistory";
import DriverDashboard from "../screens/driver/DriverDashboard";
import EmergencyAlert from "../screens/driver/EmergencyAlert";
import SettingsScreen from "../screens/Settings";
import FdodoNavigator from "./FdodoNavigator";

const Tab = createBottomTabNavigator();

export default function RoleTabs({ navigation, route }) {
  const { user } = useAuth();
  const role = user?.role;

  // Switch to appropriate tab when a notification arrives
  useEffect(() => {
    console.log("[RoleTabs] Mounting with role:", role);
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
    } else if (role === "DRIVER") {
      off = NotificationService.addListener("trip_assignment", (data) => {
        try {
          navigation?.navigate("DriverDashboard", {
            fromNotification: true,
            tripId: data?.tripId,
            msId: data?.msId,
            dbsId: data?.dbsId,
            vehicleId: data?.vehicleId,
          });
        } catch (_error) {
          // no-op
        }
      });
      const last = NotificationService.getLastEvent("trip_assignment");
      if (last?.tripId) {
        navigation?.navigate("DriverDashboard", {
          fromNotification: true,
          tripId: last.tripId,
          msId: last.msId,
          dbsId: last.dbsId,
          vehicleId: last.vehicleId,
        });
      }
    } else if (role === "EIC") {
      console.log("[RoleTabs] Setting up EIC listeners");
      // Handle STOCK_REQUEST / driver_response for EIC
      const handleEicNav = (data) => {
        console.log("[RoleTabs] handleEicNav received:", JSON.stringify(data));
        try {
          // If it's a stock request, go to StockRequests tab
          if (data?.type === "STOCK_REQUEST" || data?.notification_type === "stock_request" || data?.dbsName) {
             console.log("[RoleTabs] Navigating to StockRequests (STOCK_REQUEST)");
             // ensure correct route name: StockRequests
             navigation?.navigate("StockRequests", {
                fromNotification: true,
                ...data
             });
          }
          // If it's a driver response, go to StockRequests tab
          else if (data?.type === "driver_response" || data?.action === "ACCEPTED" || data?.action === "REJECTED") {
             console.log("[RoleTabs] Navigating to StockRequests (driver_response)");
             navigation?.navigate("StockRequests", {
                fromNotification: true,
                ...data
             });
          }
        } catch (e) {
          console.warn("[RoleTabs] EIC Nav Error", e);
        }
      };

      const offStock = NotificationService.addListener("stock_request", (d) => {
         console.log("[RoleTabs] Listener received stock_request");
         handleEicNav(d);
      });
      const offDriver = NotificationService.addListener("driver_response", (d) => {
         console.log("[RoleTabs] Listener received driver_response");
         handleEicNav(d);
      });
      
      off = () => {
        offStock();
        offDriver();
      };

      // Check last events
      const lastStock = NotificationService.getLastEvent("stock_request");
      if (lastStock) {
        console.log("[RoleTabs] Found last event stock_request");
        handleEicNav(lastStock);
      }
      const lastDriver = NotificationService.getLastEvent("driver_response");
      if (lastDriver) {
        console.log("[RoleTabs] Found last event driver_response");
        handleEicNav(lastDriver);
      }
    }
    return () => off && off();
  }, [role, navigation]);

  if (!role) {
    return null;
  }

  // DBS Operator: Use DBS Navigator with drawer navigation
  if (role === "DBS_OPERATOR") {
    return <DBSNavigator />;
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
  // Tab Navigator - DriverDashboard is first (main screen for trip assignments)
  if (role === "DRIVER") {
    // Get the screen params passed from notification navigation
    const screenParams = route?.params || {};
    const targetScreen = screenParams?.screen;
    const screenSpecificParams = screenParams?.params || screenParams;
    

    
    return (
      <Tab.Navigator
        initialRouteName="DriverDashboard"
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
          name="DriverDashboard"
          component={DriverDashboard}
          initialParams={screenSpecificParams?.tripId ? screenSpecificParams : undefined}
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color }) => (
              <AppIcon icon="vehicle" size={20} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Trips"
          component={TripHistory}
          options={{
            title: "Trips",
            tabBarIcon: ({ color }) => (
              <AppIcon icon="trips" size={20} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="EmergencyAlert"
          component={EmergencyAlert}
          options={{
            tabBarButton: () => null,
            tabBarItemStyle: {
              display: "none",
            },
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
