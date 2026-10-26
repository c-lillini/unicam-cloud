import { AlgorithmId, Client, Server } from '../model';

export interface Decision {
  server: Server;
  /** Spiegazione leggibile della scelta, mostrata nel registro delle decisioni. */
  reason: string;
}

/**
 * Un algoritmo di bilanciamento: dato l'elenco dei server e il client che ha
 * inviato la richiesta, sceglie il server di destinazione.
 * Restituisce null se nessun server è disponibile.
 */
export interface BalancingStrategy {
  readonly id: AlgorithmId;
  pick(servers: readonly Server[], client: Client): Decision | null;
}

export function onlineServers(servers: readonly Server[]): Server[] {
  return servers.filter((s) => s.online);
}

/** Sceglie a rotazione tra più candidati a pari merito. */
export class TieBreaker {
  private counter = 0;

  pick<T>(candidates: readonly T[]): T {
    return candidates[this.counter++ % candidates.length];
  }
}
