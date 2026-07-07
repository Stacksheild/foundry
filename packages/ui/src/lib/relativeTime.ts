/**
 * apps/api's registry stores SQLite `datetime('now')` timestamps: UTC,
 * space-separated ("2026-07-06 06:44:04"), no timezone suffix — append "Z"
 * after swapping the space for "T" so `Date` parses it as UTC instead of
 * local time.
 */
export function formatRelativeTime(sqliteTimestamp: string): string {
  const then = new Date(`${sqliteTimestamp.replace(" ", "T")}Z`).getTime();
  const minutes = Math.floor((Date.now() - then) / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
