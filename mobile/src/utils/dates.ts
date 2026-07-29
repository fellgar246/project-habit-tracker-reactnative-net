import { getLocalDateString } from './date';

/** @deprecated Use getLocalDateString from ./date instead */
export function formatDate(date: Date): string {
  return getLocalDateString(date);
}

export function todayIso(): string {
  return getLocalDateString();
}

export { getLocalDateString } from './date';
