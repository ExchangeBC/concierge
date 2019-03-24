import { get, isArray, isBoolean } from 'lodash';
import moment from 'moment-timezone';
import { invalid, valid, ValidOrInvalid } from 'shared/lib/validators';

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

export function formatTermsAndConditionsAgreementDate(date?: Date): string {
  if (date) {
    return `You agreed to the Terms & Conditions on ${formatDate(date)} at ${formatTime(date, true)}.`
  } else {
    return 'You have not agreed to the Terms & Conditions.';
  }
}

/**
 * This function tries to parse JSON safely without throwing
 * a run-time exception if the input is invalid.
 */

export function parseJsonSafely(raw: string): ValidOrInvalid<any, undefined> {
  try {
    return valid(JSON.parse(raw));
  } catch (error) {
    return invalid(undefined);
  }
}

export function bytesToMegabytes(bytes: number): number {
  return bytes / 1024 / 1024;
}

export function megabytesToBytes(megabytes: number): number {
  return megabytes * 1024 * 1024;
}
