import { Server } from '../model';
import { BalancingStrategy, Decision } from './strategy';

/**
 * Weighted Round Robin nella variante "smooth" usata da NGINX.
 * Ad ogni richiesta:
 *  1. ogni server incrementa il proprio peso corrente del suo peso statico;
 *  2. viene scelto il server con peso corrente massimo;
 *  3. al server scelto si sottrae la somma dei pesi.
 * In un ciclo di (somma dei pesi) richieste ogni server ne riceve esattamente
 * quante il suo peso, ma intercalate invece che consecutive.
 */
export class WeightedRoundRobinStrategy implements BalancingStrategy {
  readonly id = 'weighted-round-robin';
  private readonly current = new Map<number, number>();

  pick(servers: readonly Server[]): Decision | null {
    const candidates = servers.filter((s) => s.online && s.weight > 0);
    if (candidates.length === 0) {
      return null;
    }

    const total = candidates.reduce((sum, s) => sum + s.weight, 0);
    let best = candidates[0];
    for (const server of candidates) {
      this.current.set(server.id, (this.current.get(server.id) ?? 0) + server.weight);
      if (this.current.get(server.id)! > this.current.get(best.id)!) {
        best = server;
      }
    }

    const snapshot = candidates.map((s) => `${s.name}=${this.current.get(s.id)}`).join(' ');
    this.current.set(best.id, this.current.get(best.id)! - total);

    return {
      server: best,
      reason: `pesi correnti [${snapshot}] → max ${best.name}; ${best.name} −= ${total} (somma pesi)`,
    };
  }
}
