import { Server } from '../model';
import { BalancingStrategy, Decision } from './strategy';

/**
 * Round Robin: un puntatore scorre ciclicamente la lista dei server,
 * saltando quelli offline.
 */
export class RoundRobinStrategy implements BalancingStrategy {
  readonly id = 'round-robin';
  private next = 0;

  pick(servers: readonly Server[]): Decision | null {
    const n = servers.length;
    for (let i = 0; i < n; i++) {
      const index = (this.next + i) % n;
      const server = servers[index];
      if (server.online) {
        this.next = (index + 1) % n;
        const skipped = i > 0 ? ` (saltati ${i} server offline)` : '';
        return {
          server,
          reason: `turno ${index + 1}/${n} → ${server.name}${skipped}; prossimo turno: ${servers[this.next].name}`,
        };
      }
    }
    return null;
  }
}
