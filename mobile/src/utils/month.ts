/** Month helpers for calendar and stats queries (YYYY-MM). */

export function formatMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function getCurrentMonth(): string {
  const now = new Date();
  return formatMonth(now.getFullYear(), now.getMonth() + 1);
}

export function shiftMonth(month: string, delta: number): string {
  const [yearPart, monthPart] = month.split('-');
  const date = new Date(Number(yearPart), Number(monthPart) - 1 + delta, 1);
  return formatMonth(date.getFullYear(), date.getMonth() + 1);
}

export function compareMonths(a: string, b: string): number {
  return a.localeCompare(b);
}

export function formatMonthLabel(month: string): string {
  const [yearPart, monthPart] = month.split('-');
  const date = new Date(Number(yearPart), Number(monthPart) - 1, 1);
  const formatted = new Intl.DateTimeFormat('es-MX', {
    month: 'long',
    year: 'numeric',
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function getDaysInMonthGrid(month: string): Array<{ date: string; inMonth: boolean }> {
  const [yearPart, monthPart] = month.split('-');
  const year = Number(yearPart);
  const monthIndex = Number(monthPart) - 1;
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const startOffset = firstDay.getDay();
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  const cells: Array<{ date: string; inMonth: boolean }> = [];

  for (let i = 0; i < totalCells; i++) {
    const dayNumber = i - startOffset + 1;
    const date = new Date(year, monthIndex, dayNumber);
    cells.push({
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      inMonth: date.getMonth() === monthIndex,
    });
  }

  return cells;
}

export const WEEKDAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'] as const;

export const WEEKDAY_FULL_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;
