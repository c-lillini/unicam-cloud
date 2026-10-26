import { Autoscaler, Environment, presetConfig } from './autoscaler';

const ENV: Environment = { evalInterval: 15, startupDelay: 30 };
const DT = 5;

/** Simula `seconds` secondi di carico costante e restituisce l'autoscaler. */
function run(presetId: string, demand: number, seconds = 900): Autoscaler {
  const scaler = new Autoscaler('T', 'Test', presetConfig(presetId));
  for (let t = 0; t < seconds; t += DT) {
    scaler.step(t, demand, DT, ENV, t % ENV.evalInterval === 0, 1000);
  }
  return scaler;
}

describe('Autoscaler', () => {
  it('con soglia unica e senza cool-down oscilla attorno alla soglia', () => {
    const scaler = run('naive', 145);
    expect(scaler.stats().reversals).toBeGreaterThan(10);
  });

  it('con isteresi e cool-down si stabilizza su 2 repliche senza oscillare', () => {
    const scaler = run('full', 145);
    expect(scaler.stats().reversals).toBe(0);
    expect(scaler.history().at(-1)?.replicas).toBe(2);
  });

  it('con sola isteresi non oscilla ma va in overshoot mentre i pod si avviano', () => {
    const scaler = run('hysteresis', 145);
    expect(scaler.stats().reversals).toBe(0);
    expect(scaler.history().at(-1)?.replicas).toBe(3);
  });

  it('con solo cool-down le oscillazioni continuano, ma più lentamente', () => {
    const naive = run('naive', 145);
    const cooldown = run('cooldown', 145);
    expect(cooldown.stats().reversals).toBeGreaterThan(0);
    expect(cooldown.stats().reversals).toBeLessThan(naive.stats().reversals);
  });

  it('il cool-down di scale-out blocca un secondo scale-out ravvicinato', () => {
    const scaler = run('full', 400, 60);
    const outs = scaler.history().filter((s) => s.action === 'out');
    expect(outs.map((s) => s.t)).toEqual([0]);
    expect(scaler.history().some((s) => s.blocked === 'out')).toBe(true);
  });

  it('uno scale-out non è bloccato dal cool-down di scale-in', () => {
    const scaler = new Autoscaler('T', 'Test', { ...presetConfig('full'), minReplicas: 1 });
    // Parte con carico basso: dopo il primo scale-out il cool-down di scale-in dura 180 s.
    for (let t = 0; t < 300; t += DT) scaler.step(t, 300, DT, ENV, t % 15 === 0, 1000);
    for (let t = 300; t < 600; t += DT) scaler.step(t, 20, DT, ENV, t % 15 === 0, 1000);
    const last = scaler.history().at(-1);
    expect(last?.cooldown).toBe('in');
    // Subito dopo uno scale-in arriva un picco: lo scale-out deve partire alla prima valutazione utile.
    const t0 = 600;
    scaler.step(t0, 500, DT, ENV, true, 1000);
    expect(scaler.history().at(-1)?.action).toBe('out');
  });
});
