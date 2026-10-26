export type AlgorithmId =
  'round-robin' | 'weighted-round-robin' | 'least-connections' | 'least-time' | 'ip-hash';

export interface Client {
  name: string;
  ip: string;
  color: string;
}

/** Stato interno di un server di backend (mutabile, gestito dalla simulazione). */
export interface Server {
  id: number;
  name: string;
  ip: string;
  /** Peso usato dal Weighted Round Robin (0 = escluso). */
  weight: number;
  /** Tempo di elaborazione a vuoto, in ms di tempo simulato. */
  baseLatency: number;
  online: boolean;
  /** Connessioni aperte dal load balancer verso il server e non ancora concluse. */
  active: number;
  /** Richieste assegnate dal load balancer. */
  assigned: number;
  /** Risposte ricevute dal load balancer. */
  handled: number;
  /** Media mobile esponenziale (EWMA) dei tempi di risposta osservati. */
  avgResponseTime: number | null;
  /** Richieste assegnate, suddivise per client. */
  perClient: number[];
}

/** Fotografia di un server pubblicata ad ogni frame per la UI. */
export interface ServerView extends Readonly<Omit<Server, 'perClient'>> {
  perClient: readonly number[];
  /** Colori dei client con una connessione attiva sul server. */
  connections: readonly string[];
  /** Intensità (0..1) dell'evidenziazione dopo una scelta del bilanciatore. */
  highlight: number;
  /** Quota di richieste assegnate rispetto al totale (0..1). */
  share: number;
}

export interface ClientView extends Client {
  index: number;
  lastServer: string | null;
}

export interface PacketView {
  id: number;
  x: number;
  y: number;
  color: string;
  rejected: boolean;
  opacity: number;
}

export interface LogEntry {
  requestId: number;
  time: number;
  client: Client;
  server: string | null;
  reason: string;
}

export interface Totals {
  sent: number;
  completed: number;
  rejected: number;
  inFlight: number;
  avgResponseTime: number | null;
  time: number;
}

export const CLIENT_POOL: readonly Client[] = [
  { name: 'A', ip: '93.41.12.7', color: '#f87171' },
  { name: 'B', ip: '151.38.200.14', color: '#fb923c' },
  { name: 'C', ip: '79.20.66.131', color: '#facc15' },
  { name: 'D', ip: '5.90.143.22', color: '#4ade80' },
  { name: 'E', ip: '185.12.9.253', color: '#2dd4bf' },
  { name: 'F', ip: '62.101.88.3', color: '#60a5fa' },
  { name: 'G', ip: '37.159.4.76', color: '#a78bfa' },
  { name: 'H', ip: '213.45.170.9', color: '#f472b6' },
];
