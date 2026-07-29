import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, EmptyState, Screen } from '../../../components';
import { useAuth } from '../../auth/AuthContext';
import { AppStackParamList, AppTabsParamList } from '../../../navigation/types';
import { HabitDto } from '../../../types/api';
import { useTheme } from '../../../theme';
import { CheckInHabitCard } from '../components/CheckInHabitCard';
import { useHabits } from '../hooks';

type TodayNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabsParamList, 'Today'>,
  NativeStackNavigationProp<AppStackParamList>
>;

function compareHabits(a: HabitDto, b: HabitDto): number {
  const timeA = a.reminderTime ?? '99:99';
  const timeB = b.reminderTime ?? '99:99';
  if (timeA !== timeB) {
    return timeA.localeCompare(timeB);
  }
  return a.name.localeCompare(b.name, 'es');
}

function formatTodayHeading(date: Date): string {
  const formatted = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function HabitSkeleton() {
  const { colors, spacing } = useTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      {[0, 1, 2].map((key) => (
        <View
          key={key}
          style={{
            height: 72,
            borderRadius: spacing.md,
            backgroundColor: colors.border,
            opacity: 0.45,
          }}
        />
      ))}
    </View>
  );
}

export function TodayScreen() {
  const { colors, spacing, typography } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<TodayNavigation>();
  const { data, isLoading, isError, error, refetch, isRefetching } = useHabits();
  const [othersExpanded, setOthersExpanded] = useState(false);

  const { scheduledToday, others } = useMemo(() => {
    const habits = data ?? [];
    const today = habits.filter((h) => h.isScheduledToday).sort(compareHabits);
    const rest = habits.filter((h) => !h.isScheduledToday).sort(compareHabits);
    return { scheduledToday: today, others: rest };
  }, [data]);

  const allScheduledComplete = useMemo(
    () => scheduledToday.length > 0 && scheduledToday.every((habit) => habit.completedToday),
    [scheduledToday],
  );

  const displayName = user?.displayName?.trim() || 'ahí';
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

  function openCreate() {
    navigation.navigate('HabitForm', {});
  }

  function openDetail(habitId: string) {
    navigation.navigate('HabitDetail', { habitId });
  }

  return (
    <Screen style={styles.flex}>
      <View style={[styles.header, { marginBottom: spacing.lg }]}>
        <View style={styles.headerText}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {formatTodayHeading(new Date())}
          </Text>
          <Text style={[typography.title, { color: colors.text, marginTop: spacing.xs }]}>
            Hola, {displayName}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Crear hábito"
          onPress={openCreate}
          style={({ pressed }) => [
            styles.addButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {isLoading ? <HabitSkeleton /> : null}

      {isError ? (
        <View style={[styles.centered, { paddingVertical: spacing.xl }]}>
          <Text
            style={[
              typography.body,
              { color: colors.danger, textAlign: 'center', marginBottom: spacing.md },
            ]}
          >
            {error?.message ?? 'No se pudieron cargar los hábitos'}
          </Text>
          <Button title="Reintentar" onPress={() => void refetch()} />
        </View>
      ) : null}

      {isEmpty ? (
        <EmptyState
          title="Sin hábitos todavía"
          description="Crea tu primer hábito y empieza a construir rachas."
          icon={<Text style={{ fontSize: 40 }}>📋</Text>}
          action={<Button title="Crear mi primer hábito" onPress={openCreate} />}
        />
      ) : null}

      {!isLoading && !isError && !isEmpty ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: spacing.xxl, gap: spacing.sm }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {allScheduledComplete ? (
            <View
              style={[
                styles.celebration,
                {
                  backgroundColor: `${colors.success}22`,
                  borderColor: colors.success,
                  padding: spacing.md,
                  borderRadius: spacing.md,
                  marginBottom: spacing.sm,
                },
              ]}
            >
              <Text style={[typography.subtitle, { color: colors.success }]}>
                ¡Día completo! 🎉
              </Text>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
                Completaste todos tus hábitos programados para hoy.
              </Text>
            </View>
          ) : null}

          {scheduledToday.length === 0 ? (
            <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing.md }]}>
              No tienes hábitos programados para hoy.
            </Text>
          ) : (
            scheduledToday.map((habit) => (
              <CheckInHabitCard
                key={habit.id}
                habit={habit}
                onPress={() => openDetail(habit.id)}
              />
            ))
          )}

          {others.length > 0 ? (
            <View style={{ marginTop: spacing.lg }}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setOthersExpanded((value) => !value)}
                style={styles.sectionHeader}
              >
                <Text style={[typography.subtitle, { color: colors.text }]}>Otros hábitos</Text>
                <Ionicons
                  name={othersExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
              {othersExpanded
                ? others.map((habit) => (
                    <View key={habit.id} style={{ marginTop: spacing.sm }}>
                      <CheckInHabitCard
                        habit={habit}
                        onPress={() => openDetail(habit.id)}
                      />
                    </View>
                  ))
                : null}
            </View>
          ) : null}
        </ScrollView>
      ) : null}

    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  celebration: {
    borderWidth: 1,
  },
});
