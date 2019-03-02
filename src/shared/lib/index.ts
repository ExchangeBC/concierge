import moment from 'moment-timezone';

import { get, isArray, isBoolean } from 'lodash';

export function getString(obj: any, keyPath: string | string[]): string {
  return String(get(obj, keyPath, ''));
}

export function getStringArray(obj: any, keyPath: string | string[]): string[] {
  const value: any[] = get(obj, keyPath, []);
  if (!isArray(value)) { return []; }
  return value.map(v => String(v));
}

export function getBoolean(obj: any, keyPath: string | string[], fallback = false): boolean {
  const value = get(obj, keyPath);
  if (isBoolean(value)) {
    return value;
  } else {
    return fallback;
  }
}

export async function identityAsync<T>(a: T): Promise<T> {
  return a;
}

export type CurriedFunction<A, B, C> = (a: A) => (b: B) => C;

export function flipCurried<A, B, C>(fn: CurriedFunction<A, B, C>): CurriedFunction<B, A, C> {
  return (b: B) => (a: A) => fn(a)(b);
}

const TIMEZONE = 'America/Vancouver';

export function rawFormatDate(date: Date, formatType: string, withTimeZone: boolean): string {
  return moment(date).tz(TIMEZONE).format(`${formatType}${withTimeZone ? ' z' : ''}`);
}

export function formatDateAndTime(date: Date, withTimeZone = false): string {
  return rawFormatDate(date, 'lll', withTimeZone);
}

export function formatDate(date: Date, withTimeZone = false): string {
  return rawFormatDate(date, 'll', withTimeZone);
}

export function formatTime(date: Date, withTimeZone = false): string {
  return rawFormatDate(date, 'LT', withTimeZone);
}
