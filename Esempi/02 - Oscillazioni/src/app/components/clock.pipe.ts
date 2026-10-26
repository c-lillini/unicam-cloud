import { Pipe, PipeTransform } from '@angular/core';

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Formatta un tempo in secondi come m:ss. */
@Pipe({ name: 'clock' })
export class ClockPipe implements PipeTransform {
  transform(seconds: number): string {
    return formatClock(seconds);
  }
}
