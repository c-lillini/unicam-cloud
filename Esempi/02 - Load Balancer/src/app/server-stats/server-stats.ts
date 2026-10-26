import { Component, computed, inject } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { algorithmInfo } from '../balancer/algorithms';
import { CLIENT_POOL } from '../model';
import { SimulationService } from '../simulation.service';

@Component({
  selector: 'app-server-stats',
  imports: [DecimalPipe, PercentPipe],
  templateUrl: './server-stats.html',
  styleUrl: './server-stats.css',
})
export class ServerStats {
  protected readonly sim = inject(SimulationService);
  protected readonly clientPool = CLIENT_POOL;
  protected readonly usesWeight = computed(() => algorithmInfo(this.sim.algorithm()).usesWeight);

  /** Larghezza percentuale dei segmenti della barra: richieste per client sul totale assegnato. */
  protected readonly totalAssigned = computed(() =>
    this.sim.servers().reduce((sum, s) => sum + s.assigned, 0),
  );

  protected numberFrom(event: Event): number {
    return (event.target as HTMLInputElement).valueAsNumber;
  }

  protected checkedFrom(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }
}
