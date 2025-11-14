import React from 'react';
import { StatusBar, View, StyleSheet, Text } from 'react-native';
import { NavigationContainer, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppProvider } from './src/context/AppContext';
import { TimelineThemeProvider } from './src/context/TimelineThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
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
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ImportTimelineScreen from './src/screens/ImportTimelineScreen';
import SharedTimelineScreen from './src/screens/SharedTimelineScreen';

const Stack = createStackNavigator();

// Custom dark theme for Paper
const paperTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#8B5CF6',
    secondary: '#06B6D4',
    tertiary: '#F59E0B',
    error: '#EC4899',
    background: '#1A1A2E',
    surface: '#16213E',
    surfaceVariant: '#2A2A3E',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#E0E0E0',
    onSurface: '#E0E0E0',
    onSurfaceVariant: '#9CA3AF',
    outline: '#2A2A3E',
  },
};

// Custom dark theme for Navigation
const navigationTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: '#8B5CF6',
    background: '#1A1A2E',
    card: '#16213E',
    text: '#E0E0E0',
    border: '#2A2A3E',
    notification: '#EC4899',
  },
};

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
              <NavigationContainer theme={navigationTheme}>
          <Stack.Navigator
        initialRouteName={user ? "TimelineList" : "Login"}
            screenOptions={{
              headerStyle: {
                backgroundColor: '#1A1A2E',
                height: 0,
                elevation: 0,
                shadowOpacity: 0,
              },
              headerShown: false,
              headerTintColor: '#E0E0E0',
              headerTitleStyle: {
                fontWeight: 'bold',
                color: '#E0E0E0',
              },
            }}
          >
        {user ? (
          <>
            <Stack.Screen
              name="TimelineList"
              component={TimelineListScreen}
              options={{ headerShown: false }}
            />
          <Stack.Screen
            name="CreateTimeline"
            component={CreateTimelineScreen}
            options={{ title: 'Create Timeline' }}
          />
          <Stack.Screen
            name="TimelineDetail"
            component={TimelineDetailScreen}
            options={{ headerShown: false }}
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
            <Stack.Screen
              name="ImportTimeline"
              component={ImportTimelineScreen}
              options={{ title: 'Import Timeline' }}
            />
            <Stack.Screen
              name="SharedTimeline"
              component={SharedTimelineScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
        </Stack.Navigator>
      </NavigationContainer>
  );
};

const App = () => {
  return (
    <SafeAreaProvider>
      <PaperProvider 
        theme={paperTheme}
        settings={{
          icon: (props) => <MaterialCommunityIcons {...props} />,
        }}
      >
        <View style={styles.rootContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" translucent={false} />
          <AuthProvider>
            <AppProvider>
              <TimelineThemeProvider>
                <AppNavigator />
      </TimelineThemeProvider>
    </AppProvider>
          </AuthProvider>
      </View>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A2E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
  },
  loadingText: {
    color: '#E0E0E0',
    fontSize: 16,
  },
});

export default App;

