import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AppProvider } from './src/context/AppContext';
import { TimelineThemeProvider } from './src/context/TimelineThemeContext';
import TimelineListScreen from './src/screens/TimelineListScreen';
import CreateTimelineScreen from './src/screens/CreateTimelineScreen';
import TimelineDetailScreen from './src/screens/TimelineDetailScreen';
import CreateEraScreen from './src/screens/CreateEraScreen';
import CreateEventScreen from './src/screens/CreateEventScreen';
import CreateSceneScreen from './src/screens/CreateSceneScreen';
import EditEraScreen from './src/screens/EditEraScreen';
import EditEventScreen from './src/screens/EditEventScreen';
import EditSceneScreen from './src/screens/EditSceneScreen';
import TimelineSettingsScreen from './src/screens/TimelineSettingsScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <AppProvider>
      <TimelineThemeProvider>
        <NavigationContainer>
        <Stack.Navigator
          initialRouteName="TimelineList"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#007AFF',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="TimelineList"
            component={TimelineListScreen}
            options={{ title: 'Timeline App' }}
          />
          <Stack.Screen
            name="CreateTimeline"
            component={CreateTimelineScreen}
            options={{ title: 'Create Timeline' }}
          />
          <Stack.Screen
            name="TimelineDetail"
            component={TimelineDetailScreen}
            options={{ title: 'Timeline' }}
          />
          <Stack.Screen
            name="CreateEra"
            component={CreateEraScreen}
            options={{ title: 'Create Era' }}
          />
          <Stack.Screen
            name="CreateEvent"
            component={CreateEventScreen}
            options={{ title: 'Create Event' }}
          />
          <Stack.Screen
            name="CreateScene"
            component={CreateSceneScreen}
            options={{ title: 'Create Scene' }}
          />
          <Stack.Screen
            name="EditEra"
            component={EditEraScreen}
            options={{ title: 'Edit Era' }}
          />
          <Stack.Screen
            name="EditEvent"
            component={EditEventScreen}
            options={{ title: 'Edit Event' }}
          />
          <Stack.Screen
            name="EditScene"
            component={EditSceneScreen}
            options={{ title: 'Edit Scene' }}
          />
          <Stack.Screen
            name="TimelineSettings"
            component={TimelineSettingsScreen}
            options={{ title: 'Timeline Settings' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      </TimelineThemeProvider>
    </AppProvider>
  );
};

export default App;

