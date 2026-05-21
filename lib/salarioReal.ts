/**
 * Compute real salary index, deflated by IPC.
 *
 * Inputs:
 *  - ripteNivel: nominal salary index series (e.g. RIPTE base 2008 or similar).
 *  - ipcMensual: monthly inflation as decimal ratio (0.026 = 2.6% MoM).
 *
 * Both series are aligned by date (YYYY-MM-DD with day=01 representing a month).
 * Output: real salary series in base 100 at the first overlapping date.
 *
 * Returns [] if the series don't overlap meaningfully.
 */
export function computeSalarioReal(
  ripteNivel: [string, number][],
  ipcMensual: [string, number][],
): [string, number][] {
  if (!ripteNivel.length || !ipcMensual.length) return [];

  // Normalize dates to YYYY-MM key for matching
  const monthKey = (iso: string): string => iso.slice(0, 7);
  const ipcMap = new Map(ipcMensual.map(([d, v]) => [monthKey(d), v]));

  // Build IPC index from earliest available IPC month forward
  const ipcSorted = [...ipcMensual].sort((a, b) => a[0].localeCompare(b[0]));
  const ipcIndex = new Map<string, number>();
  let currentIndex = 100;
  ipcIndex.set(monthKey(ipcSorted[0][0]), currentIndex);
  for (let i = 1; i < ipcSorted.length; i++) {
    const monthlyRate = ipcSorted[i - 1][1];
    currentIndex = currentIndex * (1 + monthlyRate);
    ipcIndex.set(monthKey(ipcSorted[i][0]), currentIndex);
  }
  void ipcMap;

  // For each RIPTE point that has IPC coverage, compute real = ripte / ipcIndex
  const overlap: { date: string; ripteVal: number; ipcVal: number }[] = [];
  for (const [date, ripteVal] of ripteNivel) {
    const key = monthKey(date);
    const ipcVal = ipcIndex.get(key);
    if (ipcVal !== undefined) {
      overlap.push({ date, ripteVal, ipcVal });
    }
  }

  if (overlap.length < 2) return [];

  // Base = first overlapping month → 100
  const base = overlap[0];
  const baseFactor = (base.ipcVal / base.ripteVal) * 100;

  return overlap.map(({ date, ripteVal, ipcVal }) => [
    date,
    (ripteVal / ipcVal) * baseFactor,
  ]);
}
