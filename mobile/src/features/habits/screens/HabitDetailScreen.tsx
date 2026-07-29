import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';

import { Button, Screen } from '../../../components';
import { AppStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme';
import { useHabit } from '../hooks';

type DetailNav = NativeStackNavigationProp<AppStackParamList, 'HabitDetail'>;
type DetailRoute = RouteProp<AppStackParamList, 'HabitDetail'>;

export function HabitDetailScreen() {
  const { colors, spacing, typography } = useTheme();
  const navigation = useNavigation<DetailNav>();
  const route = useRoute<DetailRoute>();
  const { habitId } = route.params;
  const { data: habit, isLoading, isError, error, refetch } = useHabit(habitId);

  return (
    <Screen scroll>
      {isLoading ? (
        <Text style={[typography.body, { color: colors.textMuted }]}>Cargando…</Text>
      ) : null}

      {isError ? (
        <View>
          <Text style={[typography.body, { color: colors.danger, marginBottom: spacing.md }]}>
            {error.message}
          </Text>
          <Button title="Reintentar" onPress={() => void refetch()} />
        </View>
      ) : null}

      {habit ? (
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Text style={{ fontSize: 40 }}>{habit.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[typography.title, { color: colors.text }]}>{habit.name}</Text>
              {habit.description ? (
                <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.xs }]}>
                  {habit.description}
                </Text>
              ) : null}
            </View>
          </View>

          <Text style={[typography.caption, { color: colors.textMuted }]}>
            Detalle completo llega en PLAN-09. Por ahora puedes editar o archivar el hábito.
          </Text>

          <Button
            title="Editar hábito"
            onPress={() => navigation.navigate('HabitForm', { habitId: habit.id })}
          />
        </View>
      ) : null}
    </Screen>
  );
}
