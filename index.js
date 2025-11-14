import 'react-native-gesture-handler'; // Must be imported before other imports
import { AppRegistry } from 'react-native';

// Suppress React Native Firebase deprecation warnings
// The namespaced API (auth(), firestore()) is still the correct pattern for React Native Firebase
// This warning is from internal Firebase Web SDK usage
if (typeof globalThis !== 'undefined') {
  globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
} else if (typeof global !== 'undefined') {
  global.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
}

import App from './App';

// Register the app component
AppRegistry.registerComponent('TimelineApp', () => App);

