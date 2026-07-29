import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { HabitDto } from '../../../types/api';
import { getLocalDateString } from '../../../utils/date';
import { useCheckIn, useUndoCheckIn } from '../hooks';
import { HabitCard } from './HabitCard';

type CheckInHabitCardProps = {
  habit: HabitDto;
  onPress: () => void;
};

export function CheckInHabitCard({ habit, onPress }: CheckInHabitCardProps) {
  const checkIn = useCheckIn(habit.id);
  const undoCheckIn = useUndoCheckIn(habit.id);
  const isPending = checkIn.isPending || undoCheckIn.isPending;

  function handleToggle() {
    if (isPending) {
      return;
    }

    const date = getLocalDateString();

    if (habit.completedToday) {
      Alert.alert(
        'Deshacer check-in',
        `¿Quitar la completación de "${habit.name}" hoy?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Deshacer',
            style: 'destructive',
            onPress: () => undoCheckIn.mutate(date),
          },
        ],
      );
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    checkIn.mutate(date);
  }

  return (
    <HabitCard
      habit={habit}
      onPress={onPress}
      onToggleComplete={handleToggle}
      disabled={isPending}
    />
  );
}
