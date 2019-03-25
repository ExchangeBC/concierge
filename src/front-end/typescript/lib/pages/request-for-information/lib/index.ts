import { formatDateAndTime } from 'shared/lib';

export function publishedDateToString(date: Date): string {
  return `Published: ${formatDateAndTime(date, true)}`;
}

export function updatedDateToString(date: Date): string {
  return `Last Updated: ${formatDateAndTime(date, true)}`;
}
