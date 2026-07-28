export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return formatDate(new Date());
}
