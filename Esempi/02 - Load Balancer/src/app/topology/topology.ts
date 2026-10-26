import { Component, computed, inject } from '@angular/core';
import { algorithmInfo } from '../balancer/algorithms';
import {
  CLIENT_R,
  clientCenter,
  LB,
  LB_IN,
  LB_OUT,
  SERVER_H,
  SERVER_W,
  serverCenter,
  VIEW_H,
  VIEW_W,
} from '../layout';
import { ServerView } from '../model';
import { SimulationService } from '../simulation.service';

const MAX_DOTS = 12;

@Component({
  selector: 'app-topology',
  templateUrl: './topology.html',
  styleUrl: './topology.css',
})
export class Topology {
  protected readonly sim = inject(SimulationService);

  protected readonly viewBox = `0 0 ${VIEW_W} ${VIEW_H}`;
  protected readonly clientR = CLIENT_R;
  protected readonly lb = LB;
  protected readonly lbIn = LB_IN;
  protected readonly lbOut = LB_OUT;
  protected readonly serverW = SERVER_W;
  protected readonly serverH = SERVER_H;

  protected readonly algorithm = computed(() => algorithmInfo(this.sim.algorithm()));
  protected readonly lastPick = computed(() => this.sim.log()[0]?.server ?? '—');

  protected readonly clientNodes = computed(() => {
    const clients = this.sim.clients();
    return clients.map((c) => ({ ...c, ...clientCenter(c.index, clients.length) }));
  });

  protected readonly serverNodes = computed(() => {
    const servers = this.sim.servers();
    return servers.map((s, i) => ({
      ...s,
      ...serverCenter(i, servers.length),
      dots: s.connections.slice(0, MAX_DOTS),
      overflow: Math.max(0, s.connections.length - MAX_DOTS),
    }));
  });

  /** Seconda riga del box server: mostra i parametri rilevanti per l'algoritmo attivo. */
  protected serverMeta(s: ServerView): string {
    switch (this.sim.algorithm()) {
      case 'weighted-round-robin':
        return `peso ${s.weight} · base ${s.baseLatency} ms`;
      case 'least-time':
        return `base ${s.baseLatency} · media ${s.avgResponseTime === null ? 'n.d.' : Math.round(s.avgResponseTime)}`;
      default:
        return `elaborazione ${s.baseLatency} ms`;
    }
  }
}
