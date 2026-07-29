import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { isApiError } from '../../../api/errors';
import { Button, Input, Screen, SkeletonList } from '../../../components';
import {
  openNotificationSettings,
  requestPermissions,
} from '../../notifications/scheduler';
import { AppStackParamList } from '../../../navigation/types';
import { ScheduleType } from '../../../types/api';
import { useTheme } from '../../../theme';
import { toggleDayInMask, WEEKDAY_OPTIONS } from '../../../utils/weekdays';
import {
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_ICON,
  HABIT_COLORS,
  HABIT_ICONS,
} from '../constants';
import { useArchiveHabit, useCreateHabit, useHabit, useUpdateHabit } from '../hooks';
import {
  HabitFieldErrors,
  HabitFormValues,
  isHabitFormValid,
  toHabitRequest,
  validateHabitForm,
} from '../validation';

type FormNav = NativeStackNavigationProp<AppStackParamList, 'HabitForm'>;
type FormRoute = RouteProp<AppStackParamList, 'HabitForm'>;

function defaultValues(): HabitFormValues {
  return {
    name: '',
    description: '',
    icon: DEFAULT_HABIT_ICON,
    color: DEFAULT_HABIT_COLOR,
    scheduleType: ScheduleType.Daily,
    scheduleDays: 0,
    reminderEnabled: false,
    reminderTime: '08:00',
  };
}

function valuesFromHabit(habit: {
  name: string;
  description: string | null;
  icon: string;
  color: string;
  scheduleType: ScheduleType;
  scheduleDays: number | null;
  reminderTime: string | null;
}): HabitFormValues {
  return {
    name: habit.name,
    description: habit.description ?? '',
    icon: habit.icon,
    color: habit.color,
    scheduleType: habit.scheduleType,
    scheduleDays: habit.scheduleDays ?? 0,
    reminderEnabled: habit.reminderTime != null,
    reminderTime: habit.reminderTime ?? '08:00',
  };
}

function snapshot(values: HabitFormValues): string {
  return JSON.stringify(values);
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function parseTime(value: string): { hours: number; minutes: number } {
  const [h, m] = value.split(':').map((part) => Number(part));
  return {
    hours: Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 8,
    minutes: Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 0,
  };
}

function formatTime(hours: number, minutes: number): string {
  return `${pad2(hours)}:${pad2(minutes)}`;
}

export function HabitFormScreen() {
  const { colors, spacing, typography } = useTheme();
  const navigation = useNavigation<FormNav>();
  const route = useRoute<FormRoute>();
  const habitId = route.params?.habitId;
  const isEdit = Boolean(habitId);

  const habitQuery = useHabit(habitId);
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const archiveHabit = useArchiveHabit();

  const [values, setValues] = useState<HabitFormValues>(defaultValues);
  const [fieldErrors, setFieldErrors] = useState<HabitFieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [reminderPermissionDenied, setReminderPermissionDenied] = useState(false);
  const [hydrated, setHydrated] = useState(!isEdit);
  const initialSnapshot = useRef(snapshot(defaultValues()));
  const allowLeaveRef = useRef(false);

  useEffect(() => {
    navigation.setOptions({
      title: isEdit ? 'Editar hábito' : 'Nuevo hábito',
    });
  }, [isEdit, navigation]);

  useEffect(() => {
    if (!isEdit || !habitQuery.data || hydrated) {
      return;
    }

    const next = valuesFromHabit(habitQuery.data);
    setValues(next);
    initialSnapshot.current = snapshot(next);
    setHydrated(true);
  }, [habitQuery.data, hydrated, isEdit]);

  const isDirty = hydrated && snapshot(values) !== initialSnapshot.current;
  const formValid = useMemo(() => isHabitFormValid(values), [values]);
  const saving = createHabit.isPending || updateHabit.isPending;

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (allowLeaveRef.current || !isDirty) {
        return;
      }

      event.preventDefault();
      Alert.alert(
        'Cambios sin guardar',
        '¿Quieres salir sin guardar los cambios?',
        [
          { text: 'Seguir editando', style: 'cancel' },
          {
            text: 'Salir',
            style: 'destructive',
            onPress: () => {
              allowLeaveRef.current = true;
              navigation.dispatch(event.data.action);
            },
          },
        ],
      );
    });

    return unsubscribe;
  }, [isDirty, navigation]);

  function patch<K extends keyof HabitFormValues>(key: K, value: HabitFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setApiError(null);
  }

  async function handleReminderToggle(enabled: boolean) {
    patch('reminderEnabled', enabled);

    if (!enabled) {
      setReminderPermissionDenied(false);
      return;
    }

    const status = await requestPermissions();
    if (status === 'granted') {
      setReminderPermissionDenied(false);
      return;
    }

    setReminderPermissionDenied(true);
    if (status === 'denied') {
      patch('reminderEnabled', false);
    }
  }

  async function handleSave() {
    const errors = validateHabitForm(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const request = toHabitRequest(values);
    setApiError(null);

    try {
      if (isEdit && habitId) {
        await updateHabit.mutateAsync({ id: habitId, request });
      } else {
        await createHabit.mutateAsync(request);
      }

      allowLeaveRef.current = true;
      navigation.goBack();
    } catch (error) {
      if (isApiError(error)) {
        if (error.errors) {
          const next: HabitFieldErrors = {};
          for (const [key, messages] of Object.entries(error.errors)) {
            const message = messages[0];
            if (!message) continue;
            const normalized = key.toLowerCase();
            if (normalized.includes('name')) next.name = message;
            else if (normalized.includes('description')) next.description = message;
            else if (normalized.includes('icon')) next.icon = message;
            else if (normalized.includes('color')) next.color = message;
            else if (normalized.includes('scheduledays')) next.scheduleDays = message;
            else if (normalized.includes('remindertime')) next.reminderTime = message;
          }
          if (Object.keys(next).length > 0) {
            setFieldErrors(next);
            return;
          }
        }
        setApiError(error.detail ?? error.title);
      } else {
        setApiError('No se pudo guardar el hábito. Intenta de nuevo.');
      }
    }
  }

  function handleArchive() {
    if (!habitId) return;

    Alert.alert(
      'Archivar hábito',
      'El hábito dejará de aparecer en tu lista, pero el historial de rachas y check-ins se conserva.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Archivar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await archiveHabit.mutateAsync(habitId);
                allowLeaveRef.current = true;
                navigation.popToTop();
              } catch (error) {
                if (isApiError(error)) {
                  setApiError(error.detail ?? error.title);
                } else {
                  setApiError('No se pudo archivar el hábito.');
                }
              }
            })();
          },
        },
      ],
    );
  }

  function adjustReminder(deltaMinutes: number) {
    const { hours, minutes } = parseTime(values.reminderTime);
    const total = (((hours * 60 + minutes + deltaMinutes) % (24 * 60)) + 24 * 60) % (24 * 60);
    const nextHours = Math.floor(total / 60);
    const nextMinutes = total % 60;
    patch('reminderTime', formatTime(nextHours, nextMinutes));
  }

  if (isEdit && habitQuery.isLoading && !hydrated) {
    return (
      <Screen>
        <SkeletonList count={4} itemHeight={48} />
      </Screen>
    );
  }

  if (isEdit && habitQuery.isError) {
    return (
      <Screen>
        <Text style={[typography.body, { color: colors.danger, marginBottom: spacing.md }]}>
          {habitQuery.error.message}
        </Text>
        <Button title="Reintentar" onPress={() => void habitQuery.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={{ gap: spacing.lg, paddingBottom: spacing.xxl }}>
        <Input
          label="Nombre"
          value={values.name}
          onChangeText={(text) => patch('name', text)}
          error={fieldErrors.name}
          maxLength={60}
          placeholder="Ej. Beber agua"
        />

        <Input
          label="Descripción (opcional)"
          value={values.description}
          onChangeText={(text) => patch('description', text)}
          error={fieldErrors.description}
          maxLength={250}
          multiline
          numberOfLines={3}
          style={{ minHeight: 88, textAlignVertical: 'top' }}
          placeholder="Notas cortas sobre el hábito"
        />

        <View>
          <Text style={[typography.caption, { color: colors.text, marginBottom: spacing.sm }]}>
            Ícono
          </Text>
          <View style={styles.iconGrid}>
            {HABIT_ICONS.map((icon) => {
              const selected = values.icon === icon;
              return (
                <Pressable
                  key={icon}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => patch('icon', icon)}
                  style={[
                    styles.iconCell,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? `${colors.primary}18` : colors.surface,
                    },
                  ]}
                >
                  <Text style={styles.iconEmoji}>{icon}</Text>
                </Pressable>
              );
            })}
          </View>
          {fieldErrors.icon ? (
            <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.xs }]}>
              {fieldErrors.icon}
            </Text>
          ) : null}
        </View>

        <View>
          <Text style={[typography.caption, { color: colors.text, marginBottom: spacing.sm }]}>
            Color
          </Text>
          <View style={styles.colorRow}>
            {HABIT_COLORS.map((color) => {
              const selected = values.color === color;
              return (
                <Pressable
                  key={color}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => patch('color', color)}
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: color,
                      borderWidth: selected ? 3 : 0,
                      borderColor: colors.text,
                    },
                  ]}
                />
              );
            })}
          </View>
          {fieldErrors.color ? (
            <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.xs }]}>
              {fieldErrors.color}
            </Text>
          ) : null}
        </View>

        <View>
          <Text style={[typography.caption, { color: colors.text, marginBottom: spacing.sm }]}>
            Frecuencia
          </Text>
          <View
            style={[
              styles.segment,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {(
              [
                { value: ScheduleType.Daily, label: 'Diario' },
                { value: ScheduleType.SpecificDays, label: 'Días específicos' },
              ] as const
            ).map((option) => {
              const selected = values.scheduleType === option.value;
              return (
                <Pressable
                  key={option.label}
                  onPress={() => {
                    setValues((current) => ({
                      ...current,
                      scheduleType: option.value,
                      scheduleDays:
                        option.value === ScheduleType.Daily ? 0 : current.scheduleDays,
                    }));
                    setFieldErrors((current) => ({ ...current, scheduleDays: undefined }));
                  }}
                  style={[
                    styles.segmentItem,
                    {
                      backgroundColor: selected ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: selected ? '#FFFFFF' : colors.text,
                        fontWeight: '600',
                        textAlign: 'center',
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {values.scheduleType === ScheduleType.SpecificDays ? (
            <View style={[styles.daysRow, { marginTop: spacing.md }]}>
              {WEEKDAY_OPTIONS.map((day) => {
                const selected = (values.scheduleDays & day.bit) !== 0;
                return (
                  <Pressable
                    key={day.label}
                    accessibilityRole="button"
                    accessibilityLabel={day.label}
                    accessibilityState={{ selected }}
                    onPress={() =>
                      patch('scheduleDays', toggleDayInMask(values.scheduleDays, day.bit))
                    }
                    style={[
                      styles.dayToggle,
                      {
                        backgroundColor: selected ? colors.primary : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: selected ? '#FFFFFF' : colors.text,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {day.shortLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          {fieldErrors.scheduleDays ? (
            <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.xs }]}>
              {fieldErrors.scheduleDays}
            </Text>
          ) : null}
        </View>

        <View>
          <View style={styles.reminderHeader}>
            <Text style={[typography.caption, { color: colors.text }]}>Recordatorio</Text>
            <Switch
              accessibilityLabel="Activar recordatorio"
              value={values.reminderEnabled}
              onValueChange={(enabled) => void handleReminderToggle(enabled)}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
          {reminderPermissionDenied ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir ajustes del sistema para notificaciones"
              onPress={() => openNotificationSettings()}
              style={{ marginTop: spacing.sm }}
            >
              <Text style={[typography.caption, { color: colors.primary }]}>
                Activa las notificaciones en Ajustes del sistema para usar recordatorios.
              </Text>
            </Pressable>
          ) : null}
          {values.reminderEnabled ? (
            <View style={[styles.timePicker, { marginTop: spacing.sm }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Restar 15 minutos"
                onPress={() => adjustReminder(-15)}
                style={[styles.timeButton, { borderColor: colors.border }]}
              >
                <Text style={[typography.body, { color: colors.text }]}>−15m</Text>
              </Pressable>
              <Text style={[typography.subtitle, { color: colors.text, minWidth: 72, textAlign: 'center' }]}>
                {values.reminderTime}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sumar 15 minutos"
                onPress={() => adjustReminder(15)}
                style={[styles.timeButton, { borderColor: colors.border }]}
              >
                <Text style={[typography.body, { color: colors.text }]}>+15m</Text>
              </Pressable>
            </View>
          ) : null}
          {fieldErrors.reminderTime ? (
            <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.xs }]}>
              {fieldErrors.reminderTime}
            </Text>
          ) : null}
        </View>

        {apiError ? (
          <Text style={[typography.body, { color: colors.danger, textAlign: 'center' }]}>
            {apiError}
          </Text>
        ) : null}

        <Button
          title={isEdit ? 'Guardar cambios' : 'Crear hábito'}
          loading={saving}
          disabled={!formValid || saving}
          onPress={() => void handleSave()}
        />

        {isEdit ? (
          <Button
            title="Archivar hábito"
            variant="ghost"
            disabled={archiveHabit.isPending || saving}
            loading={archiveHabit.isPending}
            onPress={handleArchive}
            style={{ marginTop: spacing.sm }}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconCell: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 22,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  segment: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayToggle: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  timeButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
  },
});
