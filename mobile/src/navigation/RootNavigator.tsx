import { NavigationContainer, Theme as NavTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { useAuth } from '../features/auth/AuthContext';
import { SplashScreen } from '../features/auth/screens/SplashScreen';
import { useTheme } from '../theme';
import { AppStack } from './AppStack';
import { AuthStack } from './AuthStack';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, colorScheme } = useTheme();

  const navTheme: NavTheme = {
    dark: colorScheme === 'dark',
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '700' },
      heavy: { fontFamily: 'System', fontWeight: '800' },
    },
  };

  if (isLoading) {
    return (
      <>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <SplashScreen />
      </>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="App" component={AppStack} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
