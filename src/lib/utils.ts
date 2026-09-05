// ============================================
// UI & DATA UTILITIES
// Reference: docs/trackguard_dhr_complete_blueprint.md
// ============================================

export function cn(
  ...inputs: (
    | string
    | undefined
    | null
    | false
    | Record<string, boolean | undefined | null>
    | (string | undefined | null | false)[]
  )[]
): string {
  const classes: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === 'string') {
      classes.push(input);
    } else if (Array.isArray(input)) {
      classes.push(cn(...input));
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }
  return classes.join(' ').trim();
}

export function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return `Today, ${timeStr}`;
    }
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
  } catch {
    return isoString;
  }
}

export function formatKmMarker(km: string | number): string {
  const num = typeof km === 'number' ? km : parseFloat(String(km));
  if (isNaN(num)) return String(km);
  return `KM ${num.toFixed(1)}`;
}
