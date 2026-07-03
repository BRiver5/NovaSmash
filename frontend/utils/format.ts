/** Format survival seconds as M:SS (e.g. 83.4 -> "1:23"). */
export function formatSurvival(seconds: number): string {
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Short date label for chart axes, e.g. "3/7". */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}
