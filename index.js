import { registerRootComponent } from "expo";
import App from "./App";

// Only setup Firebase in EAS builds, not in development
if (process.env.NODE_ENV === "production" || process.env.EAS_BUILD) {
  const messaging = require("@react-native-firebase/messaging").default;

  // Background message handler - MUST be at top level for Android
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    // Handle background notification logic here
  });
}

registerRootComponent(App);
