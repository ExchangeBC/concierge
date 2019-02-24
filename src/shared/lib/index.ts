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

export type CurriedFunction<A, B, C> = (a: A) => (b: B) => C;

export function flipCurried<A, B, C>(fn: CurriedFunction<A, B, C>): CurriedFunction<B, A, C> {
  return (b: B) => (a: A) => fn(a)(b);
}
