import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import { HabitDto, ScheduleType } from '../../types/api';
import { WeekDayBit, daysFromMask } from '../../utils/weekdays';
import { getRemindersEnabled } from './preferences';

const HABIT_NOTIFICATION_PREFIX = 'habit-';

/** Expo weekly trigger uses 1 = Sunday … 7 = Saturday. */
const BIT_TO_EXPO_WEEKDAY: Record<WeekDayBit, number> = {
  [WeekDayBit.Sunday]: 1,
  [WeekDayBit.Monday]: 2,
  [WeekDayBit.Tuesday]: 3,
  [WeekDayBit.Wednesday]: 4,
  [WeekDayBit.Thursday]: 5,
  [WeekDayBit.Friday]: 6,
  [WeekDayBit.Saturday]: 7,
};

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export function notificationId(habitId: string, weekday: number): string {
  return `${HABIT_NOTIFICATION_PREFIX}${habitId}-day-${weekday}`;
}

function parseReminderTime(reminderTime: string): { hour: number; minute: number } {
  const [h, m] = reminderTime.split(':').map((part) => Number(part));
  return {
    hour: Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 8,
    minute: Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 0,
  };
}

function buildBody(habit: HabitDto): string {
  if (habit.currentStreak > 0) {
    return `Llevas ${habit.currentStreak} días seguidos. ¡No rompas la racha!`;
  }
  return 'Es un buen momento para completar tu hábito.';
}

function scheduledWeekdays(habit: HabitDto): number[] {
  if (habit.scheduleType === ScheduleType.Daily) {
    return [1, 2, 3, 4, 5, 6, 7];
  }

  const mask = habit.scheduleDays ?? 0;
  return daysFromMask(mask).map((bit) => BIT_TO_EXPO_WEEKDAY[bit]);
}

export async function requestPermissions(): Promise<PermissionStatus> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('habit-reminders', {
      name: 'Recordatorios de hábitos',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return 'granted';
  }

  const requested = await Notifications.requestPermissionsAsync();
  if (requested.granted) {
    return 'granted';
  }

  return requested.canAskAgain === false ? 'denied' : 'undetermined';
}

export async function getPermissionStatus(): Promise<PermissionStatus> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return 'granted';
  }
  return current.canAskAgain === false ? 'denied' : 'undetermined';
}

export function openNotificationSettings(): void {
  void Linking.openSettings();
}

export async function cancelForHabit(habitId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ids = scheduled
    .map((item) => item.identifier)
    .filter((id): id is string => Boolean(id) && id.startsWith(`${HABIT_NOTIFICATION_PREFIX}${habitId}-`));

  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

export async function scheduleForHabit(habit: HabitDto): Promise<void> {
  if (habit.isArchived || !habit.reminderTime) {
    await cancelForHabit(habit.id);
    return;
  }

  const enabled = await getRemindersEnabled();
  if (!enabled) {
    return;
  }

  const permission = await getPermissionStatus();
  if (permission !== 'granted') {
    return;
  }

  await cancelForHabit(habit.id);

  const { hour, minute } = parseReminderTime(habit.reminderTime);
  const weekdays = scheduledWeekdays(habit);
  const title = `${habit.icon} ${habit.name}`;
  const body = buildBody(habit);

  await Promise.all(
    weekdays.map((weekday) =>
      Notifications.scheduleNotificationAsync({
        identifier: notificationId(habit.id, weekday),
        content: {
          title,
          body,
          data: { screen: 'Today' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour,
          minute,
        },
      }),
    ),
  );
}

export async function rescheduleAll(habits: HabitDto[]): Promise<void> {
  const enabled = await getRemindersEnabled();
  if (!enabled) {
    await cancelAllHabitNotifications();
    return;
  }

  const active = habits.filter((habit) => !habit.isArchived && habit.reminderTime);
  const activeIds = new Set(active.map((habit) => habit.id));

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const staleIds = scheduled
    .map((item) => item.identifier)
    .filter((id): id is string => Boolean(id) && id.startsWith(HABIT_NOTIFICATION_PREFIX))
    .filter((id) => {
      const habitId = id.slice(HABIT_NOTIFICATION_PREFIX.length).split('-day-')[0];
      return !activeIds.has(habitId);
    });

  await Promise.all(staleIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
  await Promise.all(active.map((habit) => scheduleForHabit(habit)));
}

async function cancelAllHabitNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ids = scheduled
    .map((item) => item.identifier)
    .filter((id): id is string => Boolean(id) && id.startsWith(HABIT_NOTIFICATION_PREFIX));

  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

export async function setRemindersGloballyEnabled(enabled: boolean, habits: HabitDto[]): Promise<void> {
  const { setRemindersEnabled } = await import('./preferences');
  await setRemindersEnabled(enabled);

  if (enabled) {
    await rescheduleAll(habits);
  } else {
    await cancelAllHabitNotifications();
  }
}
