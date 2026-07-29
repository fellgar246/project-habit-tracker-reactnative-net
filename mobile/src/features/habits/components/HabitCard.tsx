import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { HabitDto } from '../../../types/api';
import { useTheme } from '../../../theme';

type HabitCardProps = {
  habit: HabitDto;
  onPress: () => void;
  onToggleComplete?: () => void;
  disabled?: boolean;
};

export function HabitCard({ habit, onPress, onToggleComplete, disabled = false }: HabitCardProps) {
  const { colors, spacing, typography } = useTheme();
  const completed = habit.completedToday;
  const checkScale = useRef(new Animated.Value(1)).current;
  const streakScale = useRef(new Animated.Value(1)).current;
  const prevStreak = useRef(habit.currentStreak);

  useEffect(() => {
    if (completed) {
      Animated.sequence([
        Animated.spring(checkScale, {
          toValue: 1.25,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(checkScale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [checkScale, completed]);

  useEffect(() => {
    if (habit.currentStreak !== prevStreak.current) {
      Animated.sequence([
        Animated.timing(streakScale, {
          toValue: 1.3,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(streakScale, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
      prevStreak.current = habit.currentStreak;
    }
  }, [habit.currentStreak, streakScale]);

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
        <Animated.Text
          style={[
            typography.caption,
            {
              color: colors.textMuted,
              marginTop: 2,
              transform: [{ scale: streakScale }],
            },
          ]}
        >
          🔥 {habit.currentStreak}
        </Animated.Text>
      </View>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed, disabled }}
        accessibilityLabel={completed ? 'Completado hoy' : 'Marcar como completado'}
        disabled={disabled}
        hitSlop={8}
        onPress={() => {
          onToggleComplete?.();
        }}
        style={[
          styles.check,
          {
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.checkInner,
            {
              borderColor: completed ? colors.success : colors.border,
              backgroundColor: completed ? colors.success : 'transparent',
              borderWidth: 2,
            },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            {completed ? <Text style={styles.checkMark}>✓</Text> : null}
          </Animated.View>
        </View>
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
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
