import type { ISODate } from '@/types/common';

export function nowIso(): ISODate {
  return new Date().toISOString();
}

export function toIso(date: Date): ISODate {
  return date.toISOString();
}

export function parseIso(iso: ISODate | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isValidIso(iso: unknown): iso is ISODate {
  if (typeof iso !== 'string') return false;
  const d = new Date(iso);
  return !Number.isNaN(d.getTime());
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function formatDateTime(iso: ISODate | undefined): string {
  const d = parseIso(iso);
  if (!d) return '—';
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export function formatDate(iso: ISODate | undefined): string {
  const d = parseIso(iso);
  if (!d) return '—';
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

export function formatRelative(iso: ISODate | undefined): string {
  const d = parseIso(iso);
  if (!d) return '—';
  const diffMs = Date.now() - d.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 45) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day} day${day === 1 ? '' : 's'} ago`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo} mo ago`;
  const yr = Math.round(mo / 12);
  return `${yr} yr ago`;
}

export function isOlderThan(iso: ISODate | undefined, ms: number): boolean {
  const d = parseIso(iso);
  if (!d) return true;
  return Date.now() - d.getTime() > ms;
}

export function addSeconds(iso: ISODate, seconds: number): ISODate {
  const d = parseIso(iso) ?? new Date();
  d.setSeconds(d.getSeconds() + seconds);
  return d.toISOString();
}

export function addMinutes(iso: ISODate, minutes: number): ISODate {
  return addSeconds(iso, minutes * 60);
}