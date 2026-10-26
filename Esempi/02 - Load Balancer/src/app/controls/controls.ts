import { Component, computed, inject } from '@angular/core';
import { CLIENT_POOL } from '../model';
import { MAX_SERVERS, MIN_CLIENTS, MIN_SERVERS, SimulationService } from '../simulation.service';

@Component({
  selector: 'app-controls',
  templateUrl: './controls.html',
  styleUrl: './controls.css',
})
export class Controls {
  protected readonly sim = inject(SimulationService);

  protected readonly minClients = MIN_CLIENTS;
  protected readonly maxClients = CLIENT_POOL.length;
  protected readonly canAddServer = computed(() => this.sim.servers().length < MAX_SERVERS);
  protected readonly canRemoveServer = computed(() => this.sim.servers().length > MIN_SERVERS);

  protected numberFrom(event: Event): number {
    return (event.target as HTMLInputElement).valueAsNumber;
  }

  protected checkedFrom(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }
}
