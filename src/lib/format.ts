export function formatMB(mb: number | null | undefined): string {
  if (mb === null || mb === undefined || Number.isNaN(mb)) return "N/A";
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${Math.round(mb)} MB`;
}
