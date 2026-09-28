export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function monthDays(year: number, month: number) {
  const first = new Date(year, month, 1, 12)
  const offset = (first.getDay() + 6) % 7
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(year, month, 1 - offset + i, 12)
    return { date, key: dateKey(date), day: date.getDate(), current: date.getMonth() === month }
  })
}
export function remainingSeconds(end: number, now: number) { return Math.max(0, Math.ceil((end - now) / 1000)) }
