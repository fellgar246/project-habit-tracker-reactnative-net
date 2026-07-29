import { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button, Card, EmptyState, Screen, SkeletonList } from '../../../components';
import { getUserFriendlyError } from '../../../utils/errors';
import { HabitDto } from '../../../types/api';
import { useTheme } from '../../../theme';
import { WEEKDAY_FULL_LABELS } from '../../../utils/month';
import { useHabitStats, useHabits } from '../../habits/hooks';
import { DailyBarChart } from '../components/DailyBarChart';
import { WeekdayBarChart } from '../components/WeekdayBarChart';
import { useStatsSummary } from '../hooks';

const ALL_HABITS = 'all';

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  const { colors, spacing } = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View
      style={{
        height: 10,
        borderRadius: spacing.sm,
        backgroundColor: colors.border,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: spacing.sm,
        }}
      />
    </View>
  );
}

function HabitSelector({
  habits,
  selectedId,
  onSelect,
}: {
  habits: HabitDto[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const { colors, spacing, typography } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}
    >
      <Pressable
        onPress={() => onSelect(ALL_HABITS)}
        style={[
          styles.chip,
          {
            backgroundColor: selectedId === ALL_HABITS ? colors.primary : colors.surface,
            borderColor: selectedId === ALL_HABITS ? colors.primary : colors.border,
          },
        ]}
      >
        <Text
          style={[
            typography.caption,
            { color: selectedId === ALL_HABITS ? '#FFFFFF' : colors.text, fontWeight: '600' },
          ]}
        >
          Todos
        </Text>
      </Pressable>
      {habits.map((habit) => (
        <Pressable
          key={habit.id}
          onPress={() => onSelect(habit.id)}
          style={[
            styles.chip,
            {
              backgroundColor: selectedId === habit.id ? habit.color : colors.surface,
              borderColor: selectedId === habit.id ? habit.color : colors.border,
            },
          ]}
        >
          <Text
            style={[
              typography.caption,
              { color: selectedId === habit.id ? '#FFFFFF' : colors.text, fontWeight: '600' },
            ]}
          >
            {habit.icon} {habit.name}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function StatsScreen() {
  const { colors, spacing, typography } = useTheme();
  const [selectedHabitId, setSelectedHabitId] = useState(ALL_HABITS);

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    error: summaryErr,
    refetch: refetchSummary,
    isRefetching,
  } = useStatsSummary();
  const { data: habits } = useHabits();
  const activeHabits = habits ?? [];

  const selectedHabit = activeHabits.find((habit) => habit.id === selectedHabitId);
  const { data: habitStats, isLoading: habitStatsLoading } = useHabitStats(
    selectedHabitId === ALL_HABITS ? undefined : selectedHabitId,
  );

  const dailyChartData = useMemo(() => {
    if (selectedHabitId === ALL_HABITS) {
      return (summary?.last30Days ?? []).map((day, index) => ({
        label: index % 5 === 0 ? day.date.slice(8) : '',
        value: day.completed,
      }));
    }

    return (habitStats?.last30Days ?? []).map((day, index) => ({
      label: index % 5 === 0 ? day.date.slice(8) : '',
      value: day.completed ? 1 : 0,
    }));
  }, [selectedHabitId, summary?.last30Days, habitStats?.last30Days]);

  const weekdayChartData = useMemo(() => {
    const source =
      selectedHabitId === ALL_HABITS ? summary?.byWeekday : habitStats?.byWeekday;

    return (source ?? []).map((item) => ({
      label: WEEKDAY_FULL_LABELS[item.weekday] ?? '?',
      value: item.completed,
    }));
  }, [selectedHabitId, summary?.byWeekday, habitStats?.byWeekday]);

  const hasEnoughData = useMemo(() => {
    if (selectedHabitId === ALL_HABITS) {
      return (summary?.last30Days ?? []).some((day) => day.completed > 0);
    }

    return (habitStats?.totalCompletions ?? 0) > 0;
  }, [selectedHabitId, summary?.last30Days, habitStats?.totalCompletions]);

  const isLoading = summaryLoading || (selectedHabitId !== ALL_HABITS && habitStatsLoading);
  const todayProgress =
    summary && summary.scheduledToday > 0
      ? summary.completedToday / summary.scheduledToday
      : 0;

  return (
    <Screen style={styles.flex}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl, gap: spacing.lg }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetchSummary()}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.title, { color: colors.text }]}>Estadísticas</Text>

        {summaryError ? (
          <View>
            <Text style={[typography.body, { color: colors.danger, marginBottom: spacing.md }]}>
              {getUserFriendlyError(summaryErr, 'No se pudieron cargar las estadísticas')}
            </Text>
            <Button title="Reintentar" onPress={() => void refetchSummary()} />
          </View>
        ) : null}

        {!isLoading && summary ? (
          <Card>
            <Text style={[typography.subtitle, { color: colors.text }]}>Resumen de hoy</Text>
            <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.xs }]}>
              {summary.completedToday} de {summary.scheduledToday} completados
            </Text>
            <View style={{ marginTop: spacing.md }}>
              <ProgressBar progress={todayProgress} color={colors.primary} />
            </View>
          </Card>
        ) : null}

        {summary?.longestCurrentStreak ? (
          <Card>
            <Text style={[typography.caption, { color: colors.textMuted }]}>Racha más larga</Text>
            <Text style={[typography.subtitle, { color: colors.text, marginTop: spacing.xs }]}>
              🔥 {summary.longestCurrentStreak.habitName}
            </Text>
            <Text style={[typography.title, { color: colors.primary, marginTop: spacing.xs }]}>
              {summary.longestCurrentStreak.streak} días
            </Text>
          </Card>
        ) : null}

        {activeHabits.length > 0 ? (
          <HabitSelector
            habits={activeHabits}
            selectedId={selectedHabitId}
            onSelect={setSelectedHabitId}
          />
        ) : null}

        {isLoading ? <SkeletonList count={2} itemHeight={120} /> : null}

        {!isLoading && !hasEnoughData ? (
          <EmptyState
            title="Aún no hay datos"
            description="Completa hábitos durante unos días para ver tus estadísticas."
            icon={<Text style={{ fontSize: 40 }}>📊</Text>}
          />
        ) : null}

        {!isLoading && hasEnoughData ? (
          <>
            <Card>
              <Text style={[typography.subtitle, { color: colors.text, marginBottom: spacing.md }]}>
                Últimos 30 días
              </Text>
              <DailyBarChart
                data={dailyChartData}
                color={selectedHabit?.color ?? colors.primary}
              />
            </Card>

            <Card>
              <Text
                style={[typography.subtitle, { color: colors.text, marginBottom: spacing.md }]}
              >
                Por día de la semana
              </Text>
              <WeekdayBarChart
                data={weekdayChartData}
                color={selectedHabit?.color ?? colors.success}
              />
            </Card>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
