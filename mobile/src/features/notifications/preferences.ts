import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDERS_ENABLED_KEY = 'remindersEnabled';

export async function getRemindersEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(REMINDERS_ENABLED_KEY);
  if (value === null) {
    return true;
  }
  return value === 'true';
}

export async function setRemindersEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(REMINDERS_ENABLED_KEY, enabled ? 'true' : 'false');
}
