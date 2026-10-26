import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Autoscaler, Environment, presetConfig } from './autoscaler';
import { LOAD_PRESETS, LoadConfig, LoadGenerator, LoadSample } from './load';

/** Fattori di velocità: secondi simulati per secondo reale. */
export const SPEEDS = [5, 10, 25, 50, 100];

export const EVAL_INTERVALS = [5, 10, 15, 30, 60];

@Injectable({ providedIn: 'root' })
export class SimulationService {
  /** Passo di simulazione in secondi. */
  readonly dt = 5;
  /** Campioni visualizzati nei grafici (180 × 5 s = 15 minuti). */
  readonly windowSize = 180;

  readonly time = signal(0);
  readonly running = signal(false);
  readonly speed = signal(10);
  readonly env = signal<Environment>({ evalInterval: 15, startupDelay: 30 });
  readonly load = signal<LoadConfig>({ ...LOAD_PRESETS[0].config });
  readonly loadHistory = signal<LoadSample[]>([]);

  /** Due autoscaler sottoposti allo stesso identico carico, per confrontarli. */
  readonly scalers = [
    new Autoscaler('A', 'Autoscaler A', presetConfig('naive')),
    new Autoscaler('B', 'Autoscaler B', presetConfig('full')),
  ];

  private readonly generator = new LoadGenerator();
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopTimer());
  }

  tick(): void {
    const t = this.time();
    const env = this.env();
    const demand = this.generator.next(t, this.load());
    const evaluate = t % env.evalInterval === 0;
    for (const scaler of this.scalers) {
      scaler.step(t, demand, this.dt, env, evaluate, this.windowSize);
    }
    this.loadHistory.update((h) => [...h.slice(-(this.windowSize - 1)), { t, demand }]);
    this.time.set(t + this.dt);
  }

  advance(seconds: number): void {
    for (let i = 0; i < seconds / this.dt; i++) this.tick();
  }

  toggle(): void {
    if (this.running()) {
      this.running.set(false);
      this.stopTimer();
    } else {
      this.running.set(true);
      this.startTimer();
    }
  }

  reset(): void {
    this.time.set(0);
    this.generator.reset();
    this.loadHistory.set([]);
    for (const scaler of this.scalers) scaler.reset();
  }

  setSpeed(speed: number): void {
    this.speed.set(speed);
    if (this.running()) this.startTimer();
  }

  patchLoad(changes: Partial<LoadConfig>): void {
    this.load.update((l) => ({ ...l, ...changes }));
  }

  patchEnv(changes: Partial<Environment>): void {
    this.env.update((e) => ({ ...e, ...changes }));
  }

  private startTimer(): void {
    this.stopTimer();
    this.timer = setInterval(() => this.tick(), (this.dt * 1000) / this.speed());
  }

  private stopTimer(): void {
    clearInterval(this.timer);
    this.timer = undefined;
  }
}
