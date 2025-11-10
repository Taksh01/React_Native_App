import React from 'react';
import { View } from 'react-native';

let GestureHandlerRootView;
let gestureHandlerAvailable = false;

try {
  const GestureHandler = require('react-native-gesture-handler');
  GestureHandlerRootView = GestureHandler.GestureHandlerRootView;
  gestureHandlerAvailable = true;
} catch (_error) {
  // Gesture handler not available (Expo Go)
  gestureHandlerAvailable = false;
}

export default function GestureCompatWrapper({ children, style }) {
  if (gestureHandlerAvailable && GestureHandlerRootView) {
    return (
      <GestureHandlerRootView style={style}>
        {children}
      </GestureHandlerRootView>
    );
  }
  
  // Fallback for Expo Go
  return <View style={style}>{children}</View>;
}

export { gestureHandlerAvailable };
