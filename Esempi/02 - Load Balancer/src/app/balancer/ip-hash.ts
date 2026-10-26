import { Client, Server } from '../model';
import { BalancingStrategy, Decision, onlineServers } from './strategy';

/** Hash FNV-1a a 32 bit: semplice, deterministico e ben distribuito. */
export function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/**
 * IP Hash: indice = hash(IP del client) mod (numero di server online).
 * Lo stesso client finisce sempre sullo stesso server finché l'insieme dei
 * server online non cambia; quando cambia, gran parte dei client viene rimappata.
 */
export class IpHashStrategy implements BalancingStrategy {
  readonly id = 'ip-hash';

  pick(servers: readonly Server[], client: Client): Decision | null {
    const online = onlineServers(servers);
    if (online.length === 0) {
      return null;
    }

    const hash = fnv1a(client.ip);
    const index = hash % online.length;
    const server = online[index];
    return {
      server,
      reason: `hash("${client.ip}") = ${hash}; ${hash} mod ${online.length} = ${index} → ${server.name}`,
    };
  }
}
