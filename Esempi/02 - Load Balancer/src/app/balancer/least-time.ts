import { Server } from '../model';
import { BalancingStrategy, Decision, onlineServers, TieBreaker } from './strategy';

/**
 * Least Time: stima quanto dovrà attendere la nuova richiesta su ciascun server
 * combinando il tempo medio di risposta osservato (EWMA) con le connessioni attive:
 *
 *   punteggio = tempo medio × (connessioni attive + 1)
 *
 * e sceglie il punteggio minimo. Per un server non ancora misurato si usa la
 * media degli altri server; se nessuno è stato misurato il criterio si riduce
 * a Least Connections.
 */
export class LeastTimeStrategy implements BalancingStrategy {
  readonly id = 'least-time';
  private readonly ties = new TieBreaker();

  pick(servers: readonly Server[]): Decision | null {
    const online = onlineServers(servers);
    if (online.length === 0) {
      return null;
    }

    const measured = online.flatMap((s) => (s.avgResponseTime === null ? [] : [s.avgResponseTime]));
    const fallback =
      measured.length === 0 ? 1 : measured.reduce((a, b) => a + b, 0) / measured.length;

    const scored = online.map((s) => {
      const time = s.avgResponseTime ?? fallback;
      return { server: s, time, score: time * (s.active + 1) };
    });
    const min = Math.min(...scored.map((x) => x.score));
    const { server } = this.ties.pick(scored.filter((x) => x.score === min));

    if (measured.length === 0) {
      const snapshot = online.map((s) => `${s.name}=${s.active}`).join(' ');
      return {
        server,
        reason: `nessun tempo misurato: uso le connessioni attive [${snapshot}] → ${server.name}`,
      };
    }

    const snapshot = scored
      .map(({ server: s, time, score }) => {
        const label = s.avgResponseTime === null ? `~${Math.round(time)}` : `${Math.round(time)}`;
        return `${s.name}=${label}×${s.active + 1}=${Math.round(score)}`;
      })
      .join(' ');
    return {
      server,
      reason: `tempo medio × (attive+1) [${snapshot}] → min ${server.name}`,
    };
  }
}
