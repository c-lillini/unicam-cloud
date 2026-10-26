import { Injectable, signal } from '@angular/core';
import { createStrategy } from './balancer/algorithms';
import { BalancingStrategy } from './balancer/strategy';
import { clientAnchor, LB_IN, LB_OUT, Point, serverAnchor } from './layout';
import {
  AlgorithmId,
  CLIENT_POOL,
  ClientView,
  LogEntry,
  PacketView,
  Server,
  ServerView,
  Totals,
} from './model';

/** Durata di ogni tratta di rete (client↔LB, LB↔server), in ms simulati. */
const TRAVEL_MS = 450;
/** Rallentamento per ogni connessione concorrente già attiva sul server. */
const LOAD_FACTOR = 0.35;
/** Peso dell'ultima misura nella media mobile dei tempi di risposta. */
const EWMA_ALPHA = 0.3;
const HIGHLIGHT_MS = 600;
const REJECT_MS = 800;
const LOG_SIZE = 40;

export const MAX_SERVERS = 6;
export const MIN_SERVERS = 1;
export const MIN_CLIENTS = 2;

/** Tempo di elaborazione iniziale, uguale per tutti i server. */
const DEFAULT_LATENCY = 800;
const SERVER_WEIGHTS = [3, 2, 1, 1, 2, 1];

type Phase = 'to-lb' | 'to-server' | 'processing' | 'back-to-lb' | 'back-to-client' | 'rejected';

interface Packet {
  id: number;
  client: number;
  serverId: number | null;
  phase: Phase;
  /** Istante (simulato) di inizio della fase corrente. */
  start: number;
  duration: number;
  createdAt: number;
  decidedAt: number;
  done: boolean;
}

/**
 * Motore della simulazione. Ogni richiesta percorre:
 *   client → LB (decisione) → server (elaborazione) → LB → client
 * Il tempo simulato avanza ad ogni animation frame, moltiplicato per la velocità.
 */
@Injectable({ providedIn: 'root' })
export class SimulationService {
  readonly algorithm = signal<AlgorithmId>('round-robin');
  readonly paused = signal(false);
  readonly autoTraffic = signal(true);
  /** Richieste al secondo (tempo simulato) generate in automatico. */
  readonly rate = signal(2);
  readonly speed = signal(1);
  readonly clientCount = signal(6);

  readonly servers = signal<ServerView[]>([]);
  readonly clients = signal<ClientView[]>([]);
  readonly packets = signal<PacketView[]>([]);
  readonly log = signal<LogEntry[]>([]);
  readonly totals = signal<Totals>({
    sent: 0,
    completed: 0,
    rejected: 0,
    inFlight: 0,
    avgResponseTime: null,
    time: 0,
  });

  private strategy: BalancingStrategy = createStrategy('round-robin');
  private serverState: Server[] = [];
  private packetState: Packet[] = [];
  private readonly pickedAt = new Map<number, number>();
  private readonly lastServerByClient = new Map<number, string>();

  private now = 0;
  private lastFrame: number | null = null;
  private nextArrival = 0;
  private nextPacketId = 1;
  private nextServerId = 1;
  private sent = 0;
  private completed = 0;
  private rejected = 0;
  private responseTimeSum = 0;

  constructor() {
    for (let i = 0; i < 4; i++) {
      this.addServer();
    }
    this.scheduleNextArrival();
    requestAnimationFrame(this.frame);
  }

  // ---------------------------------------------------------------- comandi

  setAlgorithm(id: AlgorithmId): void {
    this.algorithm.set(id);
    this.strategy = createStrategy(id);
    this.resetStats();
  }

  togglePause(): void {
    this.paused.update((p) => !p);
  }

  setAutoTraffic(enabled: boolean): void {
    this.autoTraffic.set(enabled);
    this.scheduleNextArrival();
  }

  setRate(rate: number): void {
    this.rate.set(rate);
    this.scheduleNextArrival();
  }

  setSpeed(speed: number): void {
    this.speed.set(speed);
  }

  setClientCount(count: number): void {
    this.clientCount.set(Math.max(MIN_CLIENTS, Math.min(CLIENT_POOL.length, count)));
  }

  /** Invia una richiesta da un client specifico o da uno casuale. */
  sendRequest(client?: number, start = this.now): void {
    this.packetState.push({
      id: this.nextPacketId++,
      client: client ?? Math.floor(Math.random() * this.clientCount()),
      serverId: null,
      phase: 'to-lb',
      start,
      duration: TRAVEL_MS,
      createdAt: start,
      decidedAt: 0,
      done: false,
    });
    this.sent++;
  }

  burst(count = 10): void {
    for (let i = 0; i < count; i++) {
      this.sendRequest(undefined, this.now + i * 70);
    }
  }

  addServer(): void {
    const index = this.serverState.length;
    if (index >= MAX_SERVERS) {
      return;
    }
    this.serverState.push({
      id: this.nextServerId++,
      name: `S${index + 1}`,
      ip: `10.0.0.${11 + index}`,
      weight: SERVER_WEIGHTS[index],
      baseLatency: DEFAULT_LATENCY,
      online: true,
      active: 0,
      assigned: 0,
      handled: 0,
      avgResponseTime: null,
      perClient: CLIENT_POOL.map(() => 0),
    });
  }

  removeServer(): void {
    if (this.serverState.length <= MIN_SERVERS) {
      return;
    }
    const removed = this.serverState.pop()!;
    this.packetState = this.packetState.filter((p) => p.serverId !== removed.id);
  }

  setOnline(id: number, online: boolean): void {
    this.updateServer(id, (s) => (s.online = online));
  }

  setWeight(id: number, weight: number): void {
    if (Number.isFinite(weight)) {
      this.updateServer(id, (s) => (s.weight = Math.max(0, Math.min(10, Math.round(weight)))));
    }
  }

  setLatency(id: number, latency: number): void {
    if (Number.isFinite(latency)) {
      this.updateServer(id, (s) => (s.baseLatency = Math.max(50, latency)));
    }
  }

  /** Azzera i contatori ma lascia proseguire le richieste in corso. */
  resetStats(): void {
    for (const s of this.serverState) {
      s.assigned = 0;
      s.handled = 0;
      s.avgResponseTime = null;
      s.perClient.fill(0);
    }
    this.sent = this.packetState.length;
    this.completed = 0;
    this.rejected = 0;
    this.responseTimeSum = 0;
    this.lastServerByClient.clear();
    this.log.set([]);
  }

  /** Ripristina la simulazione allo stato iniziale. */
  resetAll(): void {
    this.packetState = [];
    this.serverState = [];
    this.pickedAt.clear();
    this.nextServerId = 1;
    for (let i = 0; i < 4; i++) {
      this.addServer();
    }
    this.strategy = createStrategy(this.algorithm());
    this.resetStats();
    this.scheduleNextArrival();
  }

  // ---------------------------------------------------------------- motore

  private readonly frame = (timestamp: number): void => {
    const elapsed = this.lastFrame === null ? 0 : Math.min(timestamp - this.lastFrame, 100);
    this.lastFrame = timestamp;

    if (!this.paused()) {
      this.now += elapsed * this.speed();
      this.generateTraffic();
      this.advance();
    }
    this.publish();
    requestAnimationFrame(this.frame);
  };

  private generateTraffic(): void {
    if (!this.autoTraffic()) {
      return;
    }
    while (this.now >= this.nextArrival) {
      this.sendRequest(undefined, this.nextArrival);
      this.nextArrival += this.interArrivalTime();
    }
  }

  /** Arrivi di Poisson: tempi tra una richiesta e l'altra distribuiti esponenzialmente. */
  private interArrivalTime(): number {
    return (-Math.log(1 - Math.random()) * 1000) / this.rate();
  }

  private scheduleNextArrival(): void {
    this.nextArrival = this.now + this.interArrivalTime();
  }

  private advance(): void {
    for (const p of this.packetState) {
      while (!p.done && this.now >= p.start + p.duration) {
        this.transition(p, p.start + p.duration);
      }
    }
    this.packetState = this.packetState.filter((p) => !p.done);
  }

  private transition(p: Packet, at: number): void {
    const server = this.serverState.find((s) => s.id === p.serverId);
    p.start = at;

    switch (p.phase) {
      case 'to-lb':
        this.dispatch(p, at);
        break;

      case 'to-server': {
        if (!server) {
          p.done = true;
          break;
        }
        // il server rallenta in proporzione alle altre richieste che sta già servendo
        const load = 1 + LOAD_FACTOR * (server.active - 1);
        const jitter = 0.85 + Math.random() * 0.3;
        p.phase = 'processing';
        p.duration = server.baseLatency * load * jitter;
        break;
      }

      case 'processing':
        p.phase = 'back-to-lb';
        p.duration = TRAVEL_MS;
        break;

      case 'back-to-lb':
        if (server) {
          const responseTime = at - p.decidedAt;
          server.active--;
          server.handled++;
          server.avgResponseTime =
            server.avgResponseTime === null
              ? responseTime
              : EWMA_ALPHA * responseTime + (1 - EWMA_ALPHA) * server.avgResponseTime;
        }
        p.phase = 'back-to-client';
        p.duration = TRAVEL_MS;
        break;

      case 'back-to-client':
        p.done = true;
        this.completed++;
        this.responseTimeSum += at - p.createdAt;
        break;

      case 'rejected':
        p.done = true;
        break;
    }
  }

  /** La richiesta è arrivata al load balancer: l'algoritmo sceglie il server. */
  private dispatch(p: Packet, at: number): void {
    const client = CLIENT_POOL[p.client];
    const decision = this.strategy.pick(this.serverState, client);

    if (!decision) {
      p.phase = 'rejected';
      p.duration = REJECT_MS;
      this.rejected++;
      this.addLog({
        requestId: p.id,
        time: at,
        client,
        server: null,
        reason: 'nessun server disponibile → 503',
      });
      return;
    }

    const server = decision.server;
    server.active++;
    server.assigned++;
    server.perClient[p.client]++;
    p.serverId = server.id;
    p.decidedAt = at;
    p.phase = 'to-server';
    p.duration = TRAVEL_MS;
    this.pickedAt.set(server.id, at);
    this.lastServerByClient.set(p.client, server.name);
    this.addLog({
      requestId: p.id,
      time: at,
      client,
      server: server.name,
      reason: decision.reason,
    });
  }

  private addLog(entry: LogEntry): void {
    this.log.update((log) => [entry, ...log].slice(0, LOG_SIZE));
  }

  private updateServer(id: number, change: (s: Server) => void): void {
    const server = this.serverState.find((s) => s.id === id);
    if (server) {
      change(server);
    }
  }

  // ---------------------------------------------------------------- viste

  private publish(): void {
    const clientCount = this.clientCount();
    const serverIndex = new Map(this.serverState.map((s, i) => [s.id, i]));
    const connections = new Map<number, string[]>();
    const packets: PacketView[] = [];

    for (const p of this.packetState) {
      if (this.now < p.start) {
        continue;
      }
      const color = CLIENT_POOL[p.client].color;
      if (p.serverId !== null && p.phase !== 'back-to-client') {
        connections.set(p.serverId, [...(connections.get(p.serverId) ?? []), color]);
      }
      // si disegnano solo le richieste in andata: il viaggio di ritorno della risposta
      // viene simulato (conta nei tempi) ma non mostrato
      if (p.phase !== 'to-lb' && p.phase !== 'to-server' && p.phase !== 'rejected') {
        continue;
      }
      if (p.client >= clientCount) {
        continue;
      }

      const progress = Math.min(1, (this.now - p.start) / p.duration);
      const t = progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2;
      const client = clientAnchor(p.client, clientCount);
      const server =
        p.serverId === null
          ? null
          : serverAnchor(serverIndex.get(p.serverId)!, this.serverState.length);

      let from: Point;
      let to: Point;
      switch (p.phase) {
        case 'to-lb':
          [from, to] = [client, LB_IN];
          break;
        case 'to-server':
          [from, to] = [LB_OUT, server!];
          break;
        default:
          [from, to] = [LB_IN, LB_IN];
      }
      packets.push({
        id: p.id,
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
        color,
        rejected: p.phase === 'rejected',
        opacity: p.phase === 'rejected' ? 1 - progress : 1,
      });
    }

    const totalAssigned = this.serverState.reduce((sum, s) => sum + s.assigned, 0);
    this.servers.set(
      this.serverState.map((s) => {
        const picked = this.pickedAt.get(s.id);
        return {
          ...s,
          perClient: [...s.perClient],
          connections: connections.get(s.id) ?? [],
          highlight: picked === undefined ? 0 : Math.max(0, 1 - (this.now - picked) / HIGHLIGHT_MS),
          share: totalAssigned === 0 ? 0 : s.assigned / totalAssigned,
        };
      }),
    );

    this.clients.set(
      CLIENT_POOL.slice(0, clientCount).map((c, index) => ({
        ...c,
        index,
        lastServer: this.lastServerByClient.get(index) ?? null,
      })),
    );

    this.packets.set(packets);
    this.totals.set({
      sent: this.sent,
      completed: this.completed,
      rejected: this.rejected,
      inFlight: this.packetState.length,
      avgResponseTime: this.completed === 0 ? null : this.responseTimeSum / this.completed,
      time: this.now,
    });
  }
}
