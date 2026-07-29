import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';

import { CreateHabitRequest, HabitDto, HabitLogsResponse, HabitStatsResponse, UpdateHabitRequest } from '../../types/api';
import { useToast } from '../../components/Toast';
import * as habitsApi from './api';

export const habitsQueryKey = ['habits'] as const;
export const statsQueryKey = ['stats'] as const;

export function habitQueryKey(id: string) {
  return ['habits', id] as const;
}

export function habitLogsQueryKey(habitId: string, month: string) {
  return ['habits', habitId, 'logs', month] as const;
}

export function habitStatsQueryKey(habitId: string) {
  return ['habits', habitId, 'stats'] as const;
}

export function statsSummaryQueryKey() {
  return [...statsQueryKey, 'summary'] as const;
}

function updateHabitInListCache(
  queryClient: ReturnType<typeof useQueryClient>,
  habitId: string,
  updater: (habit: HabitDto) => HabitDto,
) {
  queryClient.setQueryData<HabitDto[]>(habitsQueryKey, (old) =>
    old?.map((habit) => (habit.id === habitId ? updater(habit) : habit)),
  );
}

function optimisticCheckIn(habit: HabitDto): HabitDto {
  const nextStreak = habit.isScheduledToday ? habit.currentStreak + 1 : habit.currentStreak;
  return {
    ...habit,
    completedToday: true,
    currentStreak: nextStreak,
    bestStreak: Math.max(habit.bestStreak, nextStreak),
  };
}

function optimisticUndo(habit: HabitDto): HabitDto {
  const nextStreak =
    habit.isScheduledToday && habit.currentStreak > 0
      ? habit.currentStreak - 1
      : habit.currentStreak;
  return {
    ...habit,
    completedToday: false,
    currentStreak: nextStreak,
  };
}

export function useHabits(): UseQueryResult<HabitDto[], Error> {
  return useQuery({
    queryKey: habitsQueryKey,
    queryFn: () => habitsApi.getHabits(),
  });
}

export function useHabit(id: string | undefined): UseQueryResult<HabitDto, Error> {
  return useQuery({
    queryKey: habitQueryKey(id ?? ''),
    queryFn: () => habitsApi.getHabit(id!),
    enabled: Boolean(id),
  });
}

export function useHabitLogs(
  habitId: string | undefined,
  month: string,
): UseQueryResult<HabitLogsResponse, Error> {
  return useQuery({
    queryKey: habitLogsQueryKey(habitId ?? '', month),
    queryFn: () => habitsApi.getHabitLogs(habitId!, month),
    enabled: Boolean(habitId),
  });
}

export function useHabitStats(
  habitId: string | undefined,
): UseQueryResult<HabitStatsResponse, Error> {
  return useQuery({
    queryKey: habitStatsQueryKey(habitId ?? ''),
    queryFn: () => habitsApi.getHabitStats(habitId!),
    enabled: Boolean(habitId),
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateHabitRequest) => habitsApi.createHabit(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: habitsQueryKey });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateHabitRequest }) =>
      habitsApi.updateHabit(id, request),
    onSuccess: (habit) => {
      void queryClient.invalidateQueries({ queryKey: habitsQueryKey });
      queryClient.setQueryData(habitQueryKey(habit.id), habit);
    },
  });
}

export function useArchiveHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => habitsApi.archiveHabit(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: habitsQueryKey });
      queryClient.removeQueries({ queryKey: habitQueryKey(id) });
    },
  });
}

export function useCheckIn(habitId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (date: string) => habitsApi.checkIn(habitId, date),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: habitsQueryKey });
      const previous = queryClient.getQueryData<HabitDto[]>(habitsQueryKey);

      updateHabitInListCache(queryClient, habitId, optimisticCheckIn);

      return { previous };
    },
    onError: (_error, _date, context) => {
      if (context?.previous) {
        queryClient.setQueryData(habitsQueryKey, context.previous);
      }
      toast.show('No se pudo completar el hábito');
    },
    onSuccess: (data) => {
      updateHabitInListCache(queryClient, habitId, (habit) => ({
        ...habit,
        completedToday: true,
        currentStreak: data.currentStreak,
        bestStreak: data.bestStreak,
      }));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: habitsQueryKey });
      void queryClient.invalidateQueries({ queryKey: habitQueryKey(habitId) });
      void queryClient.invalidateQueries({ queryKey: statsQueryKey });
      void queryClient.invalidateQueries({ queryKey: habitStatsQueryKey(habitId) });
      void queryClient.invalidateQueries({ queryKey: ['habits', habitId, 'logs'] });
    },
  });
}

export function useUndoCheckIn(habitId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (date: string) => habitsApi.undoCheckIn(habitId, date),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: habitsQueryKey });
      const previous = queryClient.getQueryData<HabitDto[]>(habitsQueryKey);

      updateHabitInListCache(queryClient, habitId, optimisticUndo);

      return { previous };
    },
    onError: (_error, _date, context) => {
      if (context?.previous) {
        queryClient.setQueryData(habitsQueryKey, context.previous);
      }
      toast.show('No se pudo deshacer el check-in');
    },
    onSuccess: (data) => {
      updateHabitInListCache(queryClient, habitId, (habit) => ({
        ...habit,
        completedToday: false,
        currentStreak: data.currentStreak,
        bestStreak: data.bestStreak,
      }));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: habitsQueryKey });
      void queryClient.invalidateQueries({ queryKey: habitQueryKey(habitId) });
      void queryClient.invalidateQueries({ queryKey: statsQueryKey });
      void queryClient.invalidateQueries({ queryKey: habitStatsQueryKey(habitId) });
      void queryClient.invalidateQueries({ queryKey: ['habits', habitId, 'logs'] });
    },
  });
}
