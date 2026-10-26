import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ClockPipe } from './components/clock.pipe';
import { LoadPanel } from './components/load-panel';
import { ScalerPanel } from './components/scaler-panel';
import { Theory } from './components/theory';
import { SPEEDS, SimulationService } from './sim/simulation.service';

@Component({
  selector: 'app-root',
  imports: [LoadPanel, ScalerPanel, Theory, ClockPipe],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly sim = inject(SimulationService);
  protected readonly speeds = SPEEDS;

  protected setSpeed(event: Event): void {
    this.sim.setSpeed(Number((event.target as HTMLSelectElement).value));
  }
}
