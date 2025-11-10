import React from "react";
import { Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import FdodoDashboard from "../screens/fdodo/FdodoDashboard";
import FDODORequest from "../screens/fdodo/FDODORequest";
import CurrentStocks from "../screens/customer/CurrentStocks";
import TransportTracking from "../screens/customer/TransportTracking";
import StockTransfers from "../screens/customer/StockTransfers";
import SettingsScreen from "../screens/Settings";
import AppIcon from "../components/AppIcon";

const Tab = createBottomTabNavigator();
const isAndroid = Platform.OS === "android";

export default function FdodoNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
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
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e2e8f0",
          paddingBottom: isAndroid ? 10 : 20,
          paddingTop: isAndroid ? 4 : 8,
          height: isAndroid ? 64 : 70,
        },
        tabBarItemStyle: {
          marginHorizontal: 4,
          paddingVertical: isAndroid ? 0 : 4,
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#64748b",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginBottom: isAndroid ? 2 : 4,
        },
        tabBarIconStyle: {
          marginTop: isAndroid ? 2 : 0,
        },
      }}
    >
      <Tab.Screen
        name="FdodoDashboard"
        component={FdodoDashboard}
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <AppIcon icon="fdodoDashboard" size={18} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="FdodoRequests"
        component={FDODORequest}
        options={{
          title: "Requests",
          tabBarIcon: ({ color }) => (
            <AppIcon icon="fdodoRequest" size={18} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="FdodoStocks"
        component={CurrentStocks}
        options={{
          title: "Stocks",
          tabBarIcon: ({ color }) => (
            <AppIcon icon="stocks" size={18} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="FdodoTransport"
        component={TransportTracking}
        options={{
          title: "Transport",
          tabBarIcon: ({ color }) => (
            <AppIcon icon="transport" size={18} color={color} />
          ),
        }}
      />
      {/* <Tab.Screen
        name="FdodoTransfers"
        component={StockTransfers}
        options={{
          title: "Transfers",
          tabBarIcon: ({ color }) => (
            <AppIcon icon="transfers" size={18} color={color} />
          ),
        }}
      /> */}
      <Tab.Screen
        name="FdodoSettings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <AppIcon icon="settings" size={18} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
