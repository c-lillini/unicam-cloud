import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Environment } from '../sim/autoscaler';
import { LOAD_PRESETS, LoadConfig, LoadPreset, LoadScenario, SCENARIOS } from '../sim/load';
import { EVAL_INTERVALS, SimulationService } from '../sim/simulation.service';
import { ChartSeries, TimeChart } from './time-chart';

@Component({
  selector: 'app-load-panel',
  imports: [TimeChart, DecimalPipe],
  templateUrl: './load-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadPanel {
  protected readonly sim = inject(SimulationService);
  protected readonly presets = LOAD_PRESETS;
  protected readonly scenarios = SCENARIOS;
  protected readonly evalIntervals = EVAL_INTERVALS;

  protected readonly load = this.sim.load;
  protected readonly env = this.sim.env;
  protected readonly history = this.sim.loadHistory;
  protected readonly times = computed(() => this.history().map((s) => s.t));

  protected readonly activePreset = computed(() => {
    const json = JSON.stringify(this.load());
    return this.presets.find((p) => JSON.stringify(p.config) === json) ?? null;
  });

  protected readonly series = computed<ChartSeries[]>(() => [
    { label: 'Carico richiesto (% CPU, 100% = 1 pod)', color: 'var(--c-demand)', values: this.history().map((s) => s.demand) },
  ]);

  protected readonly yMax = computed(() => {
    const l = this.load();
    const expected = l.base + (l.scenario === 'costante' ? 0 : l.amplitude) + l.noise;
    const peak = Math.max(expected, ...this.history().map((s) => s.demand));
    return Math.max(100, Math.ceil((peak * 1.1) / 50) * 50);
  });

  protected applyPreset(preset: LoadPreset): void {
    this.sim.load.set({ ...preset.config });
  }

  protected setScenario(event: Event): void {
    this.sim.patchLoad({ scenario: (event.target as HTMLSelectElement).value as LoadScenario });
  }

  protected setLoad(key: Exclude<keyof LoadConfig, 'scenario'>, event: Event): void {
    this.sim.patchLoad({ [key]: (event.target as HTMLInputElement).valueAsNumber });
  }

  protected setEnv(key: keyof Environment, event: Event): void {
    this.sim.patchEnv({ [key]: Number((event.target as HTMLInputElement | HTMLSelectElement).value) });
  }
}
