import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HabitDto } from '../../../types/api';
import { useTheme } from '../../../theme';

type HabitCardProps = {
  habit: HabitDto;
  onPress: () => void;
  /** Extension point for PLAN-08 check-ins. */
  onToggleComplete?: () => void;
};

export function HabitCard({ habit, onPress, onToggleComplete }: HabitCardProps) {
  const { colors, spacing, typography } = useTheme();
  const completed = habit.completedToday;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          padding: spacing.md,
          borderRadius: spacing.md,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.iconBadge,
          {
            backgroundColor: `${habit.color}22`,
            marginRight: spacing.md,
          },
        ]}
      >
        <Text style={styles.icon}>{habit.icon}</Text>
      </View>

      <View style={styles.body}>
        <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>
          {habit.name}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
          🔥 {habit.currentStreak}
        </Text>
      </View>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        accessibilityLabel={completed ? 'Completado hoy' : 'Marcar como completado'}
        hitSlop={8}
        onPress={() => {
          onToggleComplete?.();
        }}
        style={[
          styles.check,
          {
            borderColor: completed ? colors.success : colors.border,
            backgroundColor: completed ? colors.success : 'transparent',
          },
        ]}
      >
        {completed ? <Text style={styles.checkMark}>✓</Text> : null}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
