import { Server } from '../model';
import { BalancingStrategy, Decision, onlineServers, TieBreaker } from './strategy';

/**
 * Least Connections: sceglie il server con meno connessioni attive.
 * In caso di pareggio si procede a rotazione tra i candidati.
 */
export class LeastConnectionsStrategy implements BalancingStrategy {
  readonly id = 'least-connections';
  private readonly ties = new TieBreaker();

  pick(servers: readonly Server[]): Decision | null {
    const online = onlineServers(servers);
    if (online.length === 0) {
      return null;
    }

    const min = Math.min(...online.map((s) => s.active));
    const candidates = online.filter((s) => s.active === min);
    const server = this.ties.pick(candidates);

    const snapshot = online.map((s) => `${s.name}=${s.active}`).join(' ');
    const tie = candidates.length > 1 ? `, pareggio tra ${candidates.length} server` : '';
    return {
      server,
      reason: `connessioni attive [${snapshot}] → min ${min}${tie} → ${server.name}`,
    };
  }
}
