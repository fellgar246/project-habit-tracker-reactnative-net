import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { TodayScreen } from '../features/habits/screens/TodayScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { StatsScreen } from '../features/stats/screens/StatsScreen';
import { useTheme } from '../theme';
import { AppTabsParamList } from './types';

const Tab = createBottomTabNavigator<AppTabsParamList>();

export function AppTabs() {
  const { colors } = useTheme();

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
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

function getTabIcon(routeName: keyof AppTabsParamList): keyof typeof Ionicons.glyphMap {
  switch (routeName) {
    case 'Today':
      return 'today-outline';
    case 'Stats':
      return 'bar-chart-outline';
    case 'Profile':
      return 'person-outline';
    default:
      return 'ellipse-outline';
  }
}
