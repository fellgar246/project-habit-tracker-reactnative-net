import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Screen, SkeletonList } from '../../../components';
import { getUserFriendlyError } from '../../../utils/errors';
import { AppStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme';
import { getCurrentMonth } from '../../../utils/month';
import { HabitCalendar } from '../components/HabitCalendar';
import { StatCard } from '../components/StatCard';
import { useArchiveHabit, useHabit, useHabitLogs, useHabitStats } from '../hooks';

type DetailNav = NativeStackNavigationProp<AppStackParamList, 'HabitDetail'>;
type DetailRoute = RouteProp<AppStackParamList, 'HabitDetail'>;

function formatRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) {
    return '—';
  }

  return `${Math.round(rate * 100)}%`;
}

export function HabitDetailScreen() {
  const { colors, spacing, typography } = useTheme();
  const navigation = useNavigation<DetailNav>();
  const route = useRoute<DetailRoute>();
  const { habitId } = route.params;
  const [month, setMonth] = useState(getCurrentMonth());

  const { data: habit, isLoading, isError, error, refetch } = useHabit(habitId);
  const { data: stats, isLoading: statsLoading } = useHabitStats(habitId);
  const { data: logs, isLoading: logsLoading } = useHabitLogs(habitId, month);
  const archiveHabit = useArchiveHabit();

  function handleArchive() {
    if (!habit) {
      return;
    }

    Alert.alert(
      'Archivar hábito',
      `¿Archivar "${habit.name}"? Podrás restaurarlo después.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Archivar',
          style: 'destructive',
          onPress: () => {
            archiveHabit.mutate(habit.id, {
              onSuccess: () => navigation.goBack(),
            });
          },
        },
      ],
    );
  }

  return (
    <Screen scroll>
      {isLoading ? <SkeletonList count={3} itemHeight={80} /> : null}

      {isError ? (
        <View>
          <Text style={[typography.body, { color: colors.danger, marginBottom: spacing.md }]}>
            {getUserFriendlyError(error, 'No se pudo cargar el hábito')}
          </Text>
          <Button title="Reintentar" onPress={() => void refetch()} />
        </View>
      ) : null}

      {habit ? (
        <View style={{ gap: spacing.lg }}>
          <View style={[styles.header, { gap: spacing.md }]}>
            <View style={[styles.iconBadge, { backgroundColor: `${habit.color}22` }]}>
              <Text style={{ fontSize: 36 }}>{habit.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.title, { color: colors.text }]}>{habit.name}</Text>
              {habit.description ? (
                <Text
                  style={[typography.body, { color: colors.textMuted, marginTop: spacing.xs }]}
                >
                  {habit.description}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.statsGrid}>
            <StatCard
              emoji="🔥"
              label="Racha actual"
              value={String(stats?.currentStreak ?? habit.currentStreak)}
            />
            <StatCard
              label="Racha máxima"
              value={String(stats?.bestStreak ?? habit.bestStreak)}
            />
            <StatCard
              label="Total completados"
              value={String(stats?.totalCompletions ?? 0)}
            />
            <StatCard
              label="Tasa 30 días"
              value={statsLoading ? '…' : formatRate(stats?.completionRate30d)}
            />
          </View>

          <Card>
            <Text style={[typography.subtitle, { color: colors.text, marginBottom: spacing.md }]}>
              Calendario
            </Text>
            <HabitCalendar
              month={month}
              onMonthChange={setMonth}
              logs={logs}
              habitColor={habit.color}
              isLoading={logsLoading}
            />
          </Card>

          <View style={{ gap: spacing.sm }}>
            <Button
              title="Editar hábito"
              onPress={() => navigation.navigate('HabitForm', { habitId: habit.id })}
            />
            <Button
              title="Archivar hábito"
              variant="secondary"
              loading={archiveHabit.isPending}
              onPress={handleArchive}
            />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
