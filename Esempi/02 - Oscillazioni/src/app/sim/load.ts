export type LoadScenario = 'costante' | 'sinusoide' | 'gradini' | 'picchi';

/**
 * Il carico è espresso in "% di CPU di un singolo pod": 100 = un pod saturo,
 * 250 = lavoro sufficiente a saturare due pod e mezzo.
 */
export interface LoadConfig {
  scenario: LoadScenario;
  base: number;
  amplitude: number;
  /** Periodo della forma d'onda, in secondi. */
  period: number;
  /** Ampiezza massima del rumore casuale (±). */
  noise: number;
}

export interface LoadSample {
  t: number;
  demand: number;
}

export const SCENARIOS: { value: LoadScenario; label: string }[] = [
  { value: 'costante', label: 'Costante' },
  { value: 'sinusoide', label: 'Sinusoidale' },
  { value: 'gradini', label: 'Onda quadra (gradini)' },
  { value: 'picchi', label: 'Picchi periodici' },
];

export interface LoadPreset {
  label: string;
  hint: string;
  config: LoadConfig;
}

export const LOAD_PRESETS: LoadPreset[] = [
  {
    label: 'Vicino alla soglia',
    hint: 'Carico stabile di circa 1,45 pod con un po’ di rumore: il caso tipico in cui una soglia singola fa oscillare il sistema.',
    config: { scenario: 'costante', base: 145, amplitude: 0, period: 300, noise: 10 },
  },
  {
    label: 'Onda lenta',
    hint: 'Carico che sale e scende lentamente (ciclo di 8 minuti), come il traffico durante la giornata.',
    config: { scenario: 'sinusoide', base: 250, amplitude: 150, period: 480, noise: 10 },
  },
  {
    label: 'Gradini',
    hint: 'Il carico salta bruscamente tra due livelli ogni 5 minuti.',
    config: { scenario: 'gradini', base: 120, amplitude: 250, period: 600, noise: 8 },
  },
  {
    label: 'Picchi brevi',
    hint: 'Picchi di 30 s, più brevi del tempo necessario ad avviare un pod e a valutare la metrica.',
    config: { scenario: 'picchi', base: 120, amplitude: 300, period: 200, noise: 8 },
  },
];

/** Andamento deterministico del carico (senza rumore) all'istante t. */
export function loadShape(t: number, cfg: LoadConfig): number {
  const phase = (t % cfg.period) / cfg.period;
  switch (cfg.scenario) {
    case 'sinusoide':
      return cfg.base + cfg.amplitude * Math.sin(2 * Math.PI * phase);
    case 'gradini':
      return cfg.base + (phase >= 0.5 ? cfg.amplitude : 0);
    case 'picchi':
      return cfg.base + (phase >= 0.5 && phase < 0.65 ? cfg.amplitude : 0);
    default:
      return cfg.base;
  }
}

const SEED = 20261026;

/** Generatore pseudo-casuale con seme fisso: il reset riproduce sempre la stessa sequenza. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class LoadGenerator {
  private rng = mulberry32(SEED);

  reset(): void {
    this.rng = mulberry32(SEED);
  }

  next(t: number, cfg: LoadConfig): number {
    const noise = (this.rng() * 2 - 1) * cfg.noise;
    return Math.max(0, Math.round(loadShape(t, cfg) + noise));
  }
}
