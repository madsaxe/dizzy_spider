import { AppRegistry } from 'react-native';
import 'react-native-gesture-handler'; // Must be imported before other imports

// Initialize Reanimated before any other imports that use it
// This ensures the native module is loaded
if (!global._REANIMATED_VERSION_CPP) {
  // Reanimated native module check - if not initialized, we'll handle gracefully
  console.warn('Reanimated may not be fully initialized');
}

import App from './App';

// Register the app component
AppRegistry.registerComponent('TimelineApp', () => App);

