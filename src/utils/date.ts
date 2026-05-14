const MONTHS_KO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const DAYS_KO   = ['일','월','화','수','목','금','토'];

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS_KO[d.getDay()]})`;
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}. ${d.getDate()}`;
}

export function formatDateRange(start: string, end: string | null): string {
  const s = new Date(start);
  if (!end) return `${formatDateShort(start)} ~`;
  const e = new Date(end);
  const nights = Math.round((e.getTime() - s.getTime()) / 86400000);
  return `${formatDateShort(start)} – ${formatDateShort(end)} (${nights}박 ${nights + 1}일)`;
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const today  = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${MONTHS_KO[d.getMonth()]}`;
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}
