import { WritableSignal, signal } from '@angular/core';

export interface AutoscalerConfig {
  minReplicas: number;
  maxReplicas: number;
  /** Numero di repliche aggiunte/rimosse a ogni azione. */
  step: number;
  /** Se disattivata si usa una soglia unica (scaleOutThreshold) in entrambe le direzioni. */
  hysteresis: boolean;
  scaleOutThreshold: number;
  scaleInThreshold: number;
  cooldown: boolean;
  /** Dopo uno scale-out non è consentita nessuna azione per questo numero di secondi. */
  scaleOutCooldown: number;
  /** Dopo uno scale-in non è consentito un altro scale-in per questo numero di secondi. */
  scaleInCooldown: number;
}

export interface Environment {
  /** Ogni quanti secondi l'autoscaler legge la metrica e decide. */
  evalInterval: number;
  /** Secondi necessari a un nuovo pod per diventare pronto a ricevere traffico. */
  startupDelay: number;
}

export type Direction = 'out' | 'in';
export type CooldownPhase = Direction | null;

export interface Sample {
  t: number;
  demand: number;
  /** Utilizzo medio dei pod pronti (0-100). */
  utilization: number;
  ready: number;
  /** Repliche richieste (pronte + in avvio) dopo l'eventuale azione. */
  replicas: number;
  action: Direction | null;
  blocked: Direction | null;
  cooldown: CooldownPhase;
  cooldownLeft: number;
}

export interface ScaleEvent {
  id: number;
  t: number;
  kind: Direction | 'blocked' | 'limit';
  message: string;
}

export interface Stats {
  elapsed: number;
  scaleOuts: number;
  scaleIns: number;
  /** Azioni di verso opposto alla precedente: la misura del flapping. */
  reversals: number;
  blocked: number;
  podSeconds: number;
  overloadSeconds: number;
  demandTotal: number;
  unservedTotal: number;
}

export interface AutoscalerPreset {
  id: string;
  label: string;
  config: AutoscalerConfig;
}

const BASE_CONFIG: AutoscalerConfig = {
  minReplicas: 1,
  maxReplicas: 10,
  step: 1,
  hysteresis: false,
  scaleOutThreshold: 70,
  scaleInThreshold: 40,
  cooldown: false,
  scaleOutCooldown: 60,
  scaleInCooldown: 180,
};

export const AUTOSCALER_PRESETS: AutoscalerPreset[] = [
  { id: 'naive', label: 'Ingenuo', config: { ...BASE_CONFIG } },
  {
    id: 'hysteresis',
    label: 'Solo isteresi',
    config: { ...BASE_CONFIG, hysteresis: true, scaleOutThreshold: 80 },
  },
  { id: 'cooldown', label: 'Solo cool-down', config: { ...BASE_CONFIG, cooldown: true } },
  {
    id: 'full',
    label: 'Isteresi + cool-down',
    config: { ...BASE_CONFIG, hysteresis: true, scaleOutThreshold: 80, cooldown: true },
  },
];

export function presetConfig(id: string): AutoscalerConfig {
  const preset = AUTOSCALER_PRESETS.find((p) => p.id === id) ?? AUTOSCALER_PRESETS[0];
  return { ...preset.config };
}

function clamp(value: number, lo: number, hi: number): number {
  return Number.isFinite(value) ? Math.min(hi, Math.max(lo, value)) : lo;
}

export function normalizeConfig(c: AutoscalerConfig): AutoscalerConfig {
  const minReplicas = Math.round(clamp(c.minReplicas, 1, 20));
  const scaleOutThreshold = clamp(c.scaleOutThreshold, 10, 95);
  return {
    ...c,
    minReplicas,
    maxReplicas: Math.round(clamp(c.maxReplicas, minReplicas, 50)),
    step: Math.round(clamp(c.step, 1, 10)),
    scaleOutThreshold,
    scaleInThreshold: clamp(c.scaleInThreshold, 5, scaleOutThreshold - 5),
    scaleOutCooldown: clamp(c.scaleOutCooldown, 0, 3600),
    scaleInCooldown: clamp(c.scaleInCooldown, 0, 3600),
  };
}

function emptyStats(): Stats {
  return {
    elapsed: 0,
    scaleOuts: 0,
    scaleIns: 0,
    reversals: 0,
    blocked: 0,
    podSeconds: 0,
    overloadSeconds: 0,
    demandTotal: 0,
    unservedTotal: 0,
  };
}

interface Pod {
  readyAt: number;
}

const MAX_EVENTS = 200;

/**
 * Autoscaler a soglie, valutato a intervalli regolari sull'utilizzo medio dei pod pronti.
 *
 * Regole di cool-down:
 * - dopo uno scale-out, nessuna azione (né out né in) per `scaleOutCooldown` secondi;
 * - dopo uno scale-in, nessun ulteriore scale-in per `scaleInCooldown` secondi,
 *   ma uno scale-out resta possibile (un picco di carico non deve aspettare).
 */
export class Autoscaler {
  readonly config: WritableSignal<AutoscalerConfig>;
  readonly history = signal<Sample[]>([]);
  readonly events = signal<ScaleEvent[]>([]);
  readonly stats = signal<Stats>(emptyStats());

  private pods: Pod[] = [];
  private outBlockedUntil = -Infinity;
  private inBlockedUntil = -Infinity;
  private lastAction: Direction | null = null;
  private eventSeq = 0;

  constructor(
    readonly id: string,
    readonly name: string,
    config: AutoscalerConfig,
  ) {
    this.config = signal(normalizeConfig(config));
    this.reset();
  }

  patch(changes: Partial<AutoscalerConfig>): void {
    this.config.update((c) => normalizeConfig({ ...c, ...changes }));
  }

  applyPreset(config: AutoscalerConfig): void {
    this.config.set(normalizeConfig(config));
  }

  reset(): void {
    this.pods = Array.from({ length: this.config().minReplicas }, () => ({ readyAt: 0 }));
    this.outBlockedUntil = -Infinity;
    this.inBlockedUntil = -Infinity;
    this.lastAction = null;
    this.history.set([]);
    this.events.set([]);
    this.stats.set(emptyStats());
  }

  step(
    t: number,
    demand: number,
    dt: number,
    env: Environment,
    evaluate: boolean,
    windowSize: number,
  ): void {
    const cfg = this.config();
    const ready = this.pods.filter((p) => p.readyAt <= t).length;
    const utilization = ready > 0 ? Math.min(100, demand / ready) : 100;
    const unserved = Math.max(0, demand - ready * 100);

    const { action, blocked } = evaluate
      ? this.evaluate(t, utilization, ready, cfg, env)
      : { action: null, blocked: null };

    const reversal = action !== null && this.lastAction !== null && action !== this.lastAction;
    if (action) this.lastAction = action;

    const cooldown = cfg.cooldown ? this.cooldownPhase(t) : null;
    const sample: Sample = {
      t,
      demand,
      utilization,
      ready,
      replicas: this.pods.length,
      action,
      blocked,
      cooldown,
      cooldownLeft:
        cooldown === 'out' ? this.outBlockedUntil - t : cooldown === 'in' ? this.inBlockedUntil - t : 0,
    };
    this.history.update((h) => [...h.slice(-(windowSize - 1)), sample]);

    this.stats.update((s) => ({
      elapsed: s.elapsed + dt,
      scaleOuts: s.scaleOuts + (action === 'out' ? 1 : 0),
      scaleIns: s.scaleIns + (action === 'in' ? 1 : 0),
      reversals: s.reversals + (reversal ? 1 : 0),
      blocked: s.blocked + (blocked ? 1 : 0),
      podSeconds: s.podSeconds + this.pods.length * dt,
      overloadSeconds: s.overloadSeconds + (unserved > 0 ? dt : 0),
      demandTotal: s.demandTotal + demand * dt,
      unservedTotal: s.unservedTotal + unserved * dt,
    }));
  }

  private evaluate(
    t: number,
    u: number,
    ready: number,
    cfg: AutoscalerConfig,
    env: Environment,
  ): { action: Direction | null; blocked: Direction | null } {
    const n = this.pods.length;
    const upper = cfg.scaleOutThreshold;
    const lower = cfg.hysteresis ? cfg.scaleInThreshold : upper;
    const pct = Math.round(u);

    if (n < cfg.minReplicas || n > cfg.maxReplicas) {
      const target = Math.min(cfg.maxReplicas, Math.max(cfg.minReplicas, n));
      this.resize(t, target, env);
      this.log(t, 'limit', `Repliche portate da ${n} a ${target} per rispettare i limiti min/max`);
      return { action: null, blocked: null };
    }

    if (u > upper && n < cfg.maxReplicas) {
      if (cfg.cooldown && t < this.outBlockedUntil) {
        this.log(
          t,
          'blocked',
          `Scale-out richiesto (${pct}% > ${upper}%) ma bloccato dal cool-down: mancano ${this.outBlockedUntil - t} s`,
        );
        return { action: null, blocked: 'out' };
      }
      const target = Math.min(cfg.maxReplicas, n + cfg.step);
      const starting = n - ready;
      this.resize(t, target, env);
      this.outBlockedUntil = t + cfg.scaleOutCooldown;
      this.inBlockedUntil = Math.max(this.inBlockedUntil, t + cfg.scaleOutCooldown);
      this.log(
        t,
        'out',
        `Scale-out ${n} → ${target}: utilizzo ${pct}% > ${upper}%` +
          (starting > 0
            ? ` (ma ${starting} pod ${starting === 1 ? 'era' : 'erano'} ancora in avvio!)`
            : ''),
      );
      return { action: 'out', blocked: null };
    }

    if (u < lower && n > cfg.minReplicas) {
      if (cfg.cooldown && t < this.inBlockedUntil) {
        const reason = t < this.outBlockedUntil ? 'cool-down di scale-out' : 'cool-down di scale-in';
        this.log(
          t,
          'blocked',
          `Scale-in richiesto (${pct}% < ${lower}%) ma bloccato dal ${reason}: mancano ${this.inBlockedUntil - t} s`,
        );
        return { action: null, blocked: 'in' };
      }
      const target = Math.max(cfg.minReplicas, n - cfg.step);
      this.resize(t, target, env);
      this.inBlockedUntil = Math.max(this.inBlockedUntil, t + cfg.scaleInCooldown);
      this.log(t, 'in', `Scale-in ${n} → ${target}: utilizzo ${pct}% < ${lower}%`);
      return { action: 'in', blocked: null };
    }

    return { action: null, blocked: null };
  }

  private cooldownPhase(t: number): CooldownPhase {
    if (t < this.outBlockedUntil) return 'out';
    if (t < this.inBlockedUntil) return 'in';
    return null;
  }

  /** Aggiunge pod (che diventano pronti dopo lo startup) o rimuove per primi quelli più recenti. */
  private resize(t: number, target: number, env: Environment): void {
    while (this.pods.length < target) this.pods.push({ readyAt: t + env.startupDelay });
    while (this.pods.length > target) this.pods.pop();
  }

  private log(t: number, kind: ScaleEvent['kind'], message: string): void {
    const event: ScaleEvent = { id: ++this.eventSeq, t, kind, message };
    this.events.update((list) => [event, ...list].slice(0, MAX_EVENTS));
  }
}
