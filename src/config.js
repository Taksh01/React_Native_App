import Constants from "expo-constants";
import { Platform } from "react-native";

const explicitBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  Constants.expoConfig?.extra?.apiBaseUrl ??
  Constants.manifestExtra?.apiBaseUrl;

const emulatorBaseUrl = Platform.select({
  ios: "https://pzqr25rg-8000.inc1.devtunnels.ms",
  android: "https://pzqr25rg-8000.inc1.devtunnels.ms",
  default: undefined,
});

const defaultLocalNetworkBaseUrl = "https://pzqr25rg-8000.inc1.devtunnels.ms";

const resolvedBaseUrl =
  explicitBaseUrl || emulatorBaseUrl || defaultLocalNetworkBaseUrl;

export const CONFIG = {
  API_BASE_URL: resolvedBaseUrl,
  WS_URL: `${resolvedBaseUrl.replace(/^http/i, "ws")}/ws`,
};
