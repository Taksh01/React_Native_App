import React from "react";
import { Feather, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";

const ICON_MAP = {
  // Navigation / common UI
  dashboard: { lib: Feather, name: "grid" },
  stocks: { lib: Feather, name: "archive" },
  transport: { lib: Feather, name: "truck" },
  transfers: { lib: Feather, name: "repeat" },
  trips: { lib: Feather, name: "list" },
  settings: { lib: Feather, name: "settings" },
  requests: { lib: Feather, name: "file-text" },
  logout: { lib: Feather, name: "log-out" },
  profile: { lib: Feather, name: "user" },
  stockRequests: { lib: Feather, name: "clipboard" },
  vehicleTracking: { lib: Feather, name: "activity" },
  vehicleQueue: { lib: Feather, name: "list" },
  driverApprovals: { lib: Feather, name: "user-check" },
  clusterManagement: { lib: Feather, name: "grid" },
  reconciliation: { lib: Feather, name: "refresh-ccw" },
  manualTokens: { lib: Feather, name: "key" },
  typeFdodo: { lib: Feather, name: "truck" },
  typeSgl: { lib: Feather, name: "users" },
  typeAi: { lib: Feather, name: "cpu" },
  alertRoute: { lib: Feather, name: "alert-triangle" },
  alertGas: { lib: MaterialCommunityIcons, name: "gas-station" },
  close: { lib: Feather, name: "x" },

  // Dashboard stats
  statTotalTrips: { lib: Feather, name: "truck" },
  statPending: { lib: Feather, name: "clock" },
  statCompleted: { lib: Feather, name: "check-circle" },
  statDelayed: { lib: Feather, name: "alert-triangle" },

  // Stocks summaries
  summaryProducts: { lib: Feather, name: "package" },
  summaryCapacity: { lib: Feather, name: "bar-chart-2" },
  summaryStock: { lib: Feather, name: "database" },

  // Transport summaries / statuses
  summaryTransportActive: { lib: Feather, name: "truck" },
  summaryTransportRoute: { lib: Feather, name: "navigation" },
  summaryTransportDelayed: { lib: Feather, name: "alert-octagon" },
  statusEnRoute: { lib: Feather, name: "truck" },
  statusLoading: { lib: Feather, name: "loader" },
  statusDelivered: { lib: Feather, name: "check-circle" },
  statusDelayed: { lib: Feather, name: "alert-triangle" },

  // Stock transfers
  transferIncoming: { lib: Feather, name: "arrow-down-circle" },
  transferOutgoing: { lib: Feather, name: "arrow-up-circle" },
  transferInternal: { lib: Feather, name: "shuffle" },
  summaryTotal: { lib: Feather, name: "layers" },
  summaryPending: { lib: Feather, name: "clock" },
  summaryProgress: { lib: Feather, name: "activity" },
  summaryCompleted: { lib: Feather, name: "check-circle" },

  // FDODO / requests
  fdodoDashboard: { lib: Feather, name: "layout" },
  fdodoRequest: { lib: Feather, name: "clipboard" },

  // Driver / map
  map: { lib: Feather, name: "map" },
  destination: { lib: Feather, name: "map-pin" },
  location: { lib: Feather, name: "crosshair" },

  // Emergency alerts
  emergencyTyre: { lib: Feather, name: "slash" },
  emergencyEngine: { lib: Feather, name: "tool" },
  emergencyAccident: { lib: Feather, name: "alert-triangle" },
  emergencyBreakdown: { lib: Feather, name: "truck" },
  emergencyMedical: { lib: MaterialCommunityIcons, name: "medical-bag" },
  emergencySecurity: { lib: Feather, name: "shield" },
  emergencyHeader: { lib: Feather, name: "alert-octagon" },
  emergencyGas: { lib: MaterialCommunityIcons, name: "gas-cylinder" },

  // Misc
  vehicle: { lib: Feather, name: "truck" },
  station: { lib: Feather, name: "layers" },
  check: { lib: Feather, name: "check" },
  info: { lib: Feather, name: "info" },
  statusFree: { lib: Feather, name: "check-circle" },
  statusOccupied: { lib: Feather, name: "x-circle" },
  statusMaintenance: { lib: Feather, name: "tool" },
  stationPin: { lib: Feather, name: "map-pin" },
  mapTruck: { lib: Feather, name: "truck" },
  notification: { lib: Feather, name: "bell" },
  celebration: { lib: Feather, name: "award" },
  analytics: { lib: Feather, name: "bar-chart-2" },
  factory: { lib: FontAwesome5, name: "industry" },
  robot: { lib: MaterialCommunityIcons, name: "robot-outline" },
  box: { lib: Feather, name: "box" },
  credit: { lib: Feather, name: "credit-card" },
  locationPin: { lib: Feather, name: "map-pin" },
  requestPending: { lib: Feather, name: "clock" },
  chevronRight: { lib: Feather, name: "chevron-right" },
};

const DEFAULT_ICON = { lib: Feather, name: "circle" };

export default function AppIcon({ icon, size = 18, color = "#1e293b", style }) {
  const entry = ICON_MAP[icon] || DEFAULT_ICON;
  const IconComponent = entry.lib;
  return <IconComponent name={entry.name} size={size} color={color} style={style} />;
}

export function registerIcon(name, config) {
  ICON_MAP[name] = config;
}
