import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommonActions, NavigationProp, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';

import { TodayScreen } from '../features/habits/screens/TodayScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { StatsScreen } from '../features/stats/screens/StatsScreen';
import {
  useNotificationNavigation,
  useNotificationSync,
} from '../features/notifications/useNotificationSync';
import { useTheme } from '../theme';
import { AppStackParamList, AppTabsParamList } from './types';

const Tab = createBottomTabNavigator<AppTabsParamList>();

export function AppTabs() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  const navigateToToday = useCallback(() => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Tabs',
        params: { screen: 'Today' },
      }),
    );
  }, [navigation]);

  useNotificationSync();
  useNotificationNavigation(navigateToToday);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size }) => {
          const iconName = getTabIcon(route.name);
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} options={{ title: 'Hoy' }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ title: 'Estadísticas' }} />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Ajustes' }}
      />
    </Tab.Navigator>
  );
}

function getTabIcon(routeName: keyof AppTabsParamList): keyof typeof Ionicons.glyphMap {
  switch (routeName) {
    case 'Today':
      return 'today-outline';
    case 'Stats':
      return 'bar-chart-outline';
    case 'Settings':
      return 'settings-outline';
    default:
      return 'ellipse-outline';
  }
}
