import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HabitLogsResponse } from '../../../types/api';
import { getLocalDateString } from '../../../utils/date';
import {
  compareMonths,
  formatMonthLabel,
  getCurrentMonth,
  getDaysInMonthGrid,
  shiftMonth,
  WEEKDAY_LABELS,
} from '../../../utils/month';
import { useTheme } from '../../../theme';

type HabitCalendarProps = {
  month: string;
  onMonthChange: (month: string) => void;
  logs: HabitLogsResponse | undefined;
  habitColor: string;
  isLoading?: boolean;
};

type DayState = 'completed' | 'missed' | 'scheduled' | 'unscheduled';

function getDayState(
  date: string,
  inMonth: boolean,
  scheduledSet: Set<string>,
  completedSet: Set<string>,
  today: string,
): DayState {
  if (!inMonth || !scheduledSet.has(date)) {
    return 'unscheduled';
  }

  if (completedSet.has(date)) {
    return 'completed';
  }

  if (date < today) {
    return 'missed';
  }

  return 'scheduled';
}

function CalendarSkeleton() {
  const { colors, spacing } = useTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={[styles.skeletonRow, { backgroundColor: colors.border, height: 24 }]} />
      <View style={styles.grid}>
        {Array.from({ length: 35 }).map((_, index) => (
          <View
            key={index}
            style={[styles.dayCell, { backgroundColor: colors.border, opacity: 0.35, borderRadius: 18 }]}
          />
        ))}
      </View>
    </View>
  );
}

export function HabitCalendar({
  month,
  onMonthChange,
  logs,
  habitColor,
  isLoading = false,
}: HabitCalendarProps) {
  const { colors, spacing, typography } = useTheme();
  const today = getLocalDateString();
  const currentMonth = getCurrentMonth();
  const canGoForward = compareMonths(month, currentMonth) < 0;

  const scheduledSet = new Set(logs?.scheduledDates ?? []);
  const completedSet = new Set(logs?.completedDates ?? []);
  const grid = getDaysInMonthGrid(month);

  return (
    <View>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes anterior"
          onPress={() => onMonthChange(shiftMonth(month, -1))}
          style={({ pressed }) => [styles.navButton, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>

        <Text style={[typography.subtitle, { color: colors.text }]}>{formatMonthLabel(month)}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
          disabled={!canGoForward}
          onPress={() => canGoForward && onMonthChange(shiftMonth(month, 1))}
          style={({ pressed }) => [
            styles.navButton,
            { opacity: !canGoForward ? 0.25 : pressed ? 0.6 : 1 },
          ]}
        >
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, index) => (
          <Text
            key={`${label}-${index}`}
            style={[typography.caption, styles.weekdayLabel, { color: colors.textMuted }]}
          >
            {label}
          </Text>
        ))}
      </View>

      {isLoading ? (
        <CalendarSkeleton />
      ) : (
        <View style={styles.grid}>
          {grid.map((cell) => {
            const state = getDayState(cell.date, cell.inMonth, scheduledSet, completedSet, today);
            const dayNumber = Number(cell.date.slice(-2));
            const isToday = cell.date === today;

            return (
              <View key={cell.date} style={styles.dayCell}>
                <View
                  style={[
                    styles.dayInner,
                    state === 'completed' && { backgroundColor: habitColor },
                    state === 'missed' && {
                      borderWidth: 1.5,
                      borderColor: colors.danger,
                      borderStyle: 'dashed',
                    },
                    state === 'scheduled' && {
                      borderWidth: 1,
                      borderColor: `${habitColor}88`,
                    },
                    state === 'unscheduled' && { opacity: cell.inMonth ? 0.35 : 0.2 },
                    isToday && {
                      borderWidth: 2,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color:
                          state === 'completed'
                            ? '#FFFFFF'
                            : state === 'unscheduled'
                              ? colors.textMuted
                              : colors.text,
                        fontWeight: isToday ? '700' : '400',
                      },
                    ]}
                  >
                    {dayNumber}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={[styles.legend, { marginTop: spacing.md, gap: spacing.sm }]}>
        <LegendItem color={habitColor} label="Completado" filled />
        <LegendItem color={colors.danger} label="No completado" dashed />
        <LegendItem color={colors.primary} label="Hoy" ring />
        <LegendItem color={colors.textMuted} label="No programado" muted />
      </View>
    </View>
  );
}

function LegendItem({
  color,
  label,
  filled,
  dashed,
  ring,
  muted,
}: {
  color: string;
  label: string;
  filled?: boolean;
  dashed?: boolean;
  ring?: boolean;
  muted?: boolean;
}) {
  const { typography, colors } = useTheme();

  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendSwatch,
          filled && { backgroundColor: color },
          dashed && { borderWidth: 1.5, borderColor: color, borderStyle: 'dashed' },
          ring && { borderWidth: 2, borderColor: color },
          muted && { backgroundColor: colors.border, opacity: 0.6 },
        ]}
      />
      <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayInner: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 12,
    marginBottom: 4,
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  skeletonRow: {
    borderRadius: 8,
    marginBottom: 8,
  },
});
