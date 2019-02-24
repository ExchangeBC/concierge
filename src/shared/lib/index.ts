import { get, isArray } from 'lodash';

export function getString(obj: any, keyPath: string | string[]): string {
  return String(get(obj, keyPath, ''));
}

export function getStringArray(obj: any, keyPath: string | string[]): string[] {
  const value: any[] = get(obj, keyPath, []);
  if (!isArray(value)) { return []; }
  return value.map(v => String(v));
}

export async function identityAsync<T>(a: T): Promise<T> {
  return a;
}
