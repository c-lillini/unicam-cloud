import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { AUTOSCALER_PRESETS, Autoscaler, AutoscalerConfig } from '../sim/autoscaler';
import { SimulationService } from '../sim/simulation.service';
import { ClockPipe } from './clock.pipe';
import { ChartBand, ChartLine, ChartMarker, ChartSeries, LegendItem, TimeChart } from './time-chart';

type NumericKey = {
  [K in keyof AutoscalerConfig]: AutoscalerConfig[K] extends number ? K : never;
}[keyof AutoscalerConfig];

@Component({
  selector: 'app-scaler-panel',
  imports: [TimeChart, ClockPipe, DecimalPipe],
  templateUrl: './scaler-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScalerPanel {
  readonly scaler = input.required<Autoscaler>();

  protected readonly sim = inject(SimulationService);
  protected readonly presets = AUTOSCALER_PRESETS;

  protected readonly cfg = computed(() => this.scaler().config());
  protected readonly history = computed(() => this.scaler().history());
  protected readonly events = computed(() => this.scaler().events());
  protected readonly stats = computed(() => this.scaler().stats());
  protected readonly times = computed(() => this.history().map((s) => s.t));
  protected readonly last = computed(() => this.history().at(-1));

  protected readonly lower = computed(() =>
    this.cfg().hysteresis ? this.cfg().scaleInThreshold : this.cfg().scaleOutThreshold,
  );

  protected readonly activePreset = computed(() => {
    const json = JSON.stringify(this.cfg());
    return this.presets.find((p) => JSON.stringify(p.config) === json)?.id ?? null;
  });

  protected readonly summary = computed(() => {
    const s = this.stats();
    return {
      avgReplicas: s.elapsed ? s.podSeconds / s.elapsed : 0,
      unservedPct: s.demandTotal ? (s.unservedTotal / s.demandTotal) * 100 : 0,
      overloadPct: s.elapsed ? (s.overloadSeconds / s.elapsed) * 100 : 0,
    };
  });

  protected readonly utilSeries = computed<ChartSeries[]>(() => [
    {
      label: 'Utilizzo medio dei pod pronti',
      color: 'var(--c-util)',
      values: this.history().map((s) => s.utilization),
    },
  ]);

  protected readonly thresholdLines = computed<ChartLine[]>(() => {
    const c = this.cfg();
    if (!c.hysteresis) {
      return [{ label: `Soglia unica ${c.scaleOutThreshold}%`, y: c.scaleOutThreshold, color: 'var(--c-upper)' }];
    }
    return [
      { label: `Scale-out > ${c.scaleOutThreshold}%`, y: c.scaleOutThreshold, color: 'var(--c-upper)' },
      { label: `Scale-in < ${c.scaleInThreshold}%`, y: c.scaleInThreshold, color: 'var(--c-lower)' },
    ];
  });

  protected readonly bands = computed<ChartBand[]>(() => {
    const c = this.cfg();
    return c.hysteresis
      ? [{ label: 'Banda di isteresi (nessuna azione)', from: c.scaleInThreshold, to: c.scaleOutThreshold, color: 'var(--c-band)' }]
      : [];
  });

  protected readonly utilMarkers = computed<ChartMarker[]>(() =>
    this.history().flatMap((s, index): ChartMarker[] => {
      if (s.action) return [{ index, y: s.utilization, kind: s.action === 'out' ? 'up' : 'down' }];
      if (s.blocked) return [{ index, y: s.utilization, kind: 'blocked' }];
      return [];
    }),
  );

  protected readonly cooldownLane = computed(() =>
    this.cfg().cooldown
      ? this.history().map((s) =>
          s.cooldown === 'out' ? 'var(--c-cool-out)' : s.cooldown === 'in' ? 'var(--c-cool-in)' : null,
        )
      : null,
  );

  protected readonly utilLegend = computed<LegendItem[]>(() => [
    { label: 'Scale-out', color: 'var(--c-out)', shape: 'up' },
    { label: 'Scale-in', color: 'var(--c-in)', shape: 'down' },
    ...(this.cfg().cooldown
      ? [
          { label: 'Bloccata dal cool-down', color: 'var(--c-blocked)', shape: 'blocked' as const },
          { label: 'Cool-down dopo scale-out (blocca tutto)', color: 'var(--c-cool-out)', shape: 'box' as const },
          { label: 'Cool-down dopo scale-in (blocca lo scale-in)', color: 'var(--c-cool-in)', shape: 'box' as const },
        ]
      : []),
  ]);

  protected readonly replicaSeries = computed<ChartSeries[]>(() => {
    const h = this.history();
    // Le pronte sono disegnate spesse e sotto, così le richieste restano visibili quando coincidono.
    return [
      { label: 'Repliche pronte', color: 'var(--c-ready)', values: h.map((s) => s.ready), step: true, width: 5 },
      { label: 'Repliche richieste', color: 'var(--c-replicas)', values: h.map((s) => s.replicas), step: true, width: 1.5 },
      {
        label: 'Minimo necessario (carico / 100%)',
        color: 'var(--c-ideal)',
        values: h.map((s) => Math.ceil(s.demand / 100)),
        step: true,
        dash: '5 4',
        width: 1.5,
      },
    ];
  });

  protected readonly replicaMax = computed(() => {
    const h = this.history();
    const peak = Math.max(
      this.cfg().maxReplicas,
      ...h.map((s) => Math.max(s.replicas, Math.ceil(s.demand / 100))),
    );
    return peak + 1;
  });

  /**
   * Passando da m a m+k repliche l'utilizzo medio scala di m/(m+k):
   * per non innescare subito l'azione opposta serve soglia_in ≤ soglia_out · m/(m+k).
   */
  protected readonly antiFlapping = computed(() => {
    const c = this.cfg();
    const lower = this.lower();
    const rows = [];
    for (let m = c.minReplicas; m + c.step <= c.maxReplicas && rows.length < 6; m++) {
      const after = (c.scaleOutThreshold * m) / (m + c.step);
      rows.push({ from: m, to: m + c.step, after, ok: lower <= after });
    }
    return rows;
  });

  protected patch(changes: Partial<AutoscalerConfig>): void {
    this.scaler().patch(changes);
  }

  /** Aggiorna un parametro numerico e riallinea il controllo se la normalizzazione ha cambiato il valore. */
  protected setNumber(key: NumericKey, event: Event): void {
    const el = event.target as HTMLInputElement;
    this.scaler().patch({ [key]: el.valueAsNumber });
    el.value = String(this.cfg()[key]);
  }

  protected checked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }
}
