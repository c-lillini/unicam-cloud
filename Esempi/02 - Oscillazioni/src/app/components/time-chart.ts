import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatClock } from './clock.pipe';

export interface ChartSeries {
  label: string;
  color: string;
  values: number[];
  step?: boolean;
  dash?: string;
  width?: number;
}

export interface ChartLine {
  label: string;
  y: number;
  color: string;
}

export interface ChartBand {
  label: string;
  from: number;
  to: number;
  color: string;
}

export type MarkerKind = 'up' | 'down' | 'blocked';

export interface ChartMarker {
  index: number;
  y: number;
  kind: MarkerKind;
}

export interface LegendItem {
  label: string;
  color: string;
  shape: 'line' | 'dash' | 'box' | MarkerKind;
}

const W = 800;
const PAD = { left: 44, right: 12, top: 12, bottom: 22 };
const LANE_H = 10;

/** Grafico temporale in SVG: serie, soglie orizzontali, bande, marcatori e una corsia di stato. */
@Component({
  selector: 'app-time-chart',
  templateUrl: './time-chart.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeChart {
  readonly times = input.required<number[]>();
  readonly capacity = input.required<number>();
  readonly yMax = input.required<number>();
  readonly height = input(200);
  readonly unit = input('');
  readonly series = input<ChartSeries[]>([]);
  readonly lines = input<ChartLine[]>([]);
  readonly bands = input<ChartBand[]>([]);
  readonly markers = input<ChartMarker[]>([]);
  /** Colore (o null) per ogni campione, disegnato come striscia sotto il grafico. */
  readonly lane = input<(string | null)[] | null>(null);
  readonly extraLegend = input<LegendItem[]>([]);
  readonly label = input('');

  protected readonly W = W;
  protected readonly PAD = PAD;
  protected readonly LANE_H = LANE_H;

  protected readonly bottom = computed(
    () => this.height() - PAD.bottom - (this.lane() ? LANE_H + 6 : 0),
  );

  protected x(i: number): number {
    return PAD.left + (i / (this.capacity() - 1)) * (W - PAD.left - PAD.right);
  }

  protected y(v: number): number {
    const clamped = Math.min(this.yMax(), Math.max(0, v));
    return this.bottom() - (clamped / this.yMax()) * (this.bottom() - PAD.top);
  }

  protected readonly paths = computed(() =>
    this.series().map((s) => {
      let d = '';
      s.values.forEach((v, i) => {
        const x = this.x(i).toFixed(1);
        const y = this.y(v).toFixed(1);
        if (i === 0) d = `M${x},${y}`;
        else d += s.step ? `H${x}V${y}` : `L${x},${y}`;
      });
      return { ...s, d };
    }),
  );

  protected readonly yTicks = computed(() => {
    const max = this.yMax();
    const raw = max / 4;
    const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500].find((s) => s >= raw) ?? raw;
    const ticks: number[] = [];
    for (let v = 0; v <= max + 1e-9; v += step) ticks.push(v);
    return ticks;
  });

  protected readonly xTicks = computed(() => {
    const times = this.times();
    const dt = times.length > 1 ? times[1] - times[0] : 5;
    const interval = this.capacity() * dt > 600 ? 120 : 60;
    return times
      .map((t, i) => ({ t, i, label: formatClock(t) }))
      .filter((tick) => tick.t % interval === 0);
  });

  protected readonly laneSegments = computed(() => {
    const lane = this.lane();
    if (!lane) return [];
    const segments: { x: number; w: number; color: string }[] = [];
    let start = -1;
    for (let i = 0; i <= lane.length; i++) {
      const color = lane[i] ?? null;
      if (start >= 0 && color !== lane[start]) {
        const x = this.x(start);
        const end = Math.min(this.x(i), W - PAD.right);
        segments.push({ x, w: Math.max(1, end - x), color: lane[start]! });
        start = -1;
      }
      if (start < 0 && color) start = i;
    }
    return segments;
  });

  protected readonly markerShapes = computed(() =>
    this.markers().map((m) => {
      const x = this.x(m.index);
      const y = this.y(m.y);
      const points =
        m.kind === 'up'
          ? `${x},${y - 14} ${x - 5},${y - 5} ${x + 5},${y - 5}`
          : `${x},${y + 14} ${x - 5},${y + 5} ${x + 5},${y + 5}`;
      return { ...m, x, y, points };
    }),
  );

  protected readonly legend = computed<LegendItem[]>(() => [
    ...this.series().map((s) => ({
      label: s.label,
      color: s.color,
      shape: s.dash ? ('dash' as const) : ('line' as const),
    })),
    ...this.lines().map((l) => ({ label: l.label, color: l.color, shape: 'dash' as const })),
    ...this.bands().map((b) => ({ label: b.label, color: b.color, shape: 'box' as const })),
    ...this.extraLegend(),
  ]);
}
