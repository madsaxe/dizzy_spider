import { AppRegistry } from 'react-native';
import { Text, View } from 'react-native';

const TestApp = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Test App Works!</Text>
  </View>
);

AppRegistry.registerComponent('TimelineApp', () => TestApp);
