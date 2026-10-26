import { AlgorithmId } from '../model';
import { IpHashStrategy } from './ip-hash';
import { LeastConnectionsStrategy } from './least-connections';
import { LeastTimeStrategy } from './least-time';
import { RoundRobinStrategy } from './round-robin';
import { BalancingStrategy } from './strategy';
import { WeightedRoundRobinStrategy } from './weighted-round-robin';

export interface AlgorithmInfo {
  id: AlgorithmId;
  name: string;
  summary: string;
  rule: string;
  pros: string[];
  cons: string[];
  tryThis: string;
  usesWeight: boolean;
}

export const ALGORITHMS: readonly AlgorithmInfo[] = [
  {
    id: 'round-robin',
    name: 'Round Robin',
    summary:
      'Le richieste vengono assegnate ai server a turno, in ordine ciclico: S1, S2, S3, … e poi di nuovo S1.',
    rule: 'server = lista[i++ mod N]',
    pros: [
      'Semplicissimo, nessuno stato sui server',
      'Distribuzione uniforme se i server sono equivalenti',
    ],
    cons: ['Ignora capacità e carico reale', 'Un server lento accumula richieste in coda'],
    tryThis:
      'Rallenta S3 portandolo a 2000 ms: riceve comunque 1 richiesta su N e le sue connessioni attive crescono.',
    usesWeight: false,
  },
  {
    id: 'weighted-round-robin',
    name: 'Weighted Round Robin',
    summary:
      'Come il Round Robin, ma ogni server riceve un numero di richieste proporzionale al proprio peso (variante "smooth" di NGINX).',
    rule: 'corrente += peso; scegli max; scelto −= Σ pesi',
    pros: ['Gestisce server con capacità diverse', 'Deterministico e prevedibile'],
    cons: ['Pesi statici: non reagisce al carico reale', 'Pesi sbagliati = sbilanciamento'],
    tryThis:
      'Con pesi 3-2-1-1 su 7 richieste S1 ne riceve 3, S2 2, S3 e S4 una ciascuno. Imposta un peso a 0 per escludere un server.',
    usesWeight: true,
  },
  {
    id: 'least-connections',
    name: 'Least Connections',
    summary: 'Ogni nuova richiesta va al server con meno connessioni attive in quel momento.',
    rule: 'server = argmin(connessioni attive)',
    pros: ['Si adatta a richieste di durata variabile', 'I server lenti ricevono meno traffico'],
    cons: [
      'Non distingue un server veloce da uno lento a parità di connessioni',
      'Richiede di tracciare lo stato',
    ],
    tryThis:
      'Rallenta un server (es. 2000 ms) e usa "Burst ×10": restando occupato più a lungo, riceve meno richieste degli altri.',
    usesWeight: false,
  },
  {
    id: 'least-time',
    name: 'Least Time',
    summary:
      'Sceglie il server con il minor tempo di attesa stimato, combinando il tempo medio di risposta misurato e le connessioni attive (es. NGINX Plus).',
    rule: 'server = argmin(tempo medio × (attive + 1))',
    pros: ['Favorisce i server più veloci', 'Reagisce a rallentamenti reali'],
    cons: ['Richiede misurazioni continue', 'Le stime possono oscillare'],
    tryThis:
      'Abbassa la latenza di S4 a 200 ms: Least Time se ne accorge e gli invia la maggior parte del traffico.',
    usesWeight: false,
  },
  {
    id: 'ip-hash',
    name: 'IP Hash',
    summary:
      "Il server è determinato dall'hash dell'IP del client: lo stesso client finisce sempre sullo stesso server (session affinity).",
    rule: 'server = online[hash(IP) mod N]',
    pros: [
      'Sessioni "sticky" senza stato condiviso',
      'Utile per cache locali e sessioni in memoria',
    ],
    cons: [
      'Distribuzione sbilanciata con pochi client o dietro NAT',
      'Se N cambia, molti client vengono rimappati',
    ],
    tryThis:
      'Osserva i colori: ogni client va sempre sullo stesso server. Poi metti offline un server e guarda quanti client cambiano destinazione.',
    usesWeight: false,
  },
];

export function algorithmInfo(id: AlgorithmId): AlgorithmInfo {
  return ALGORITHMS.find((a) => a.id === id)!;
}

export function createStrategy(id: AlgorithmId): BalancingStrategy {
  switch (id) {
    case 'round-robin':
      return new RoundRobinStrategy();
    case 'weighted-round-robin':
      return new WeightedRoundRobinStrategy();
    case 'least-connections':
      return new LeastConnectionsStrategy();
    case 'least-time':
      return new LeastTimeStrategy();
    case 'ip-hash':
      return new IpHashStrategy();
  }
}
