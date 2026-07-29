import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HabitDetailScreen } from '../features/habits/screens/HabitDetailScreen';
import { HabitFormScreen } from '../features/habits/screens/HabitFormScreen';
import { useTheme } from '../theme';
import { AppTabs } from './AppTabs';
import { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Tabs" component={AppTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="HabitForm"
        component={HabitFormScreen}
        options={{
          presentation: 'modal',
          title: 'Hábito',
        }}
      />
      <Stack.Screen
        name="HabitDetail"
        component={HabitDetailScreen}
        options={{ title: 'Detalle' }}
      />
    </Stack.Navigator>
  );
}
