/** Bit flags aligned with backend `HabitTracker.Domain.WeekDays`. */
export const WeekDayBit = {
  Sunday: 1,
  Monday: 2,
  Tuesday: 4,
  Wednesday: 8,
  Thursday: 16,
  Friday: 32,
  Saturday: 64,
} as const;

export type WeekDayBit = (typeof WeekDayBit)[keyof typeof WeekDayBit];

/** Monday → Sunday order for Spanish UI labels (L M M J V S D). */
export const WEEKDAY_OPTIONS: ReadonlyArray<{
  bit: WeekDayBit;
  shortLabel: string;
  label: string;
}> = [
  { bit: WeekDayBit.Monday, shortLabel: 'L', label: 'Lunes' },
  { bit: WeekDayBit.Tuesday, shortLabel: 'M', label: 'Martes' },
  { bit: WeekDayBit.Wednesday, shortLabel: 'M', label: 'Miércoles' },
  { bit: WeekDayBit.Thursday, shortLabel: 'J', label: 'Jueves' },
  { bit: WeekDayBit.Friday, shortLabel: 'V', label: 'Viernes' },
  { bit: WeekDayBit.Saturday, shortLabel: 'S', label: 'Sábado' },
  { bit: WeekDayBit.Sunday, shortLabel: 'D', label: 'Domingo' },
];

export function daysFromMask(mask: number): WeekDayBit[] {
  return WEEKDAY_OPTIONS.map((d) => d.bit).filter((bit) => (mask & bit) !== 0);
}

export function maskFromDays(days: readonly number[]): number {
  return days.reduce((mask, bit) => mask | bit, 0);
}

export function toggleDayInMask(mask: number, bit: WeekDayBit): number {
  return mask ^ bit;
}

export function isDayInMask(mask: number, bit: WeekDayBit): boolean {
  return (mask & bit) !== 0;
}

export function labelsFromMask(mask: number): string[] {
  return WEEKDAY_OPTIONS.filter((d) => isDayInMask(mask, d.bit)).map((d) => d.label);
}
