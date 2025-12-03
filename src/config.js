import Constants from "expo-constants";
import { Platform } from "react-native";

const explicitBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  Constants.expoConfig?.extra?.apiBaseUrl ??
  Constants.manifestExtra?.apiBaseUrl;

const emulatorBaseUrl = Platform.select({
  ios: "http:// 192.168.1.167:8000",
  android: "http:// 192.168.1.167:8000",
  default: undefined,
});

const defaultLocalNetworkBaseUrl = "http://192.168.1.167:8000";

const resolvedBaseUrl =
  explicitBaseUrl || emulatorBaseUrl || defaultLocalNetworkBaseUrl;

// This setting controls whether the app uses mock data or real API calls to the backend.
// By default, it is set to true (mock mode enabled) unless explicitly set to false.
// Turn true to false in order to test real backend integration.
const explicitMockMode =
  process.env.EXPO_PUBLIC_MOCK_MODE ??
  Constants.expoConfig?.extra?.mockMode ??
  Constants.manifestExtra?.mockMode ??
  true;

const normalizedMockMode =
  typeof explicitMockMode === "string"
    ? explicitMockMode.toLowerCase() === "true"
    : Boolean(explicitMockMode);

export const CONFIG = {
  MOCK_MODE: normalizedMockMode,
  API_BASE_URL: resolvedBaseUrl,
  WS_URL: `${resolvedBaseUrl.replace(/^http/i, "ws")}/ws`,
};
