/** 常用格式化工具 */
export function formatCount(value: number | undefined | null): string {
  const num = Number(value || 0);
  if (num >= 100000000) return `${(num / 100000000).toFixed(2)}亿`;
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  return String(num);
}

export function formatSalary(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "—";
  return `${Math.round(Number(value) / 100) / 10}K`;
}

export function formatTrendPp(value: number | undefined | null): string {
  const num = Number(value || 0);
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(1)}pp`;
}
