import { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { loadUser } from './src/utils/storage';
import { AppProvider, useApp } from './src/context/AppContext';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();

function AppContent() {
  const { isDark, ready } = useApp();
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    loadUser().then(user => setInitialRoute(user ? 'Home' : 'Register'));
  }, []);

  const navTheme = {
    dark: isDark,
    colors: {
      primary: '#7C3AED',
      background: isDark ? '#0F0F0F' : '#F3F4F6',
      card: isDark ? '#1C1C1E' : '#FFFFFF',
      text: isDark ? '#FFFFFF' : '#111827',
      border: isDark ? '#2C2C2E' : '#E5E7EB',
      notification: '#7C3AED',
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '700' },
      heavy: { fontFamily: 'System', fontWeight: '900' },
    },
  };

  if (!ready || !initialRoute) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? '#0F0F0F' : '#F3F4F6',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false, animation: 'fade' }}
        >
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </SafeAreaProvider>
  );
}
