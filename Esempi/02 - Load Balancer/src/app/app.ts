import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ALGORITHMS, algorithmInfo } from './balancer/algorithms';
import { Controls } from './controls/controls';
import { DecisionLog } from './decision-log/decision-log';
import { ServerStats } from './server-stats/server-stats';
import { SimulationService } from './simulation.service';
import { Topology } from './topology/topology';

@Component({
  selector: 'app-root',
  imports: [DecimalPipe, Topology, Controls, ServerStats, DecisionLog],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly sim = inject(SimulationService);
  protected readonly algorithms = ALGORITHMS;
  protected readonly info = computed(() => algorithmInfo(this.sim.algorithm()));
}
