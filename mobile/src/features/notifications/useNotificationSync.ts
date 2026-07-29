import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import { useHabits } from '../habits/hooks';
import { rescheduleAll } from './scheduler';

export function useNotificationSync(): void {
  const { data: habits } = useHabits();

  useEffect(() => {
    if (!habits) {
      return;
    }

    void rescheduleAll(habits);
  }, [habits]);
}

export function useNotificationNavigation(
  navigateToToday: () => void,
): void {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const screen = response.notification.request.content.data?.screen;
      if (screen === 'Today') {
        navigateToToday();
      }
    });

    return () => subscription.remove();
  }, [navigateToToday]);
}
