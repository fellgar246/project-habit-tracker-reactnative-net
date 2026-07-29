import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';

import { CreateHabitRequest, HabitDto, UpdateHabitRequest } from '../../types/api';
import * as habitsApi from './api';

export const habitsQueryKey = ['habits'] as const;

export function habitQueryKey(id: string) {
  return ['habits', id] as const;
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
