# Load Balancer Simulator ⚖️

Applicazione Angular che mostra, con una simulazione animata, come un load balancer distribuisce le richieste dei client tra i server di backend.

Algoritmi disponibili:

| Algoritmo                | Regola                                                       |
| ------------------------ | ------------------------------------------------------------ |
| **Round Robin**          | i server vengono scelti a turno                              |
| **Weighted Round Robin** | a turno, in proporzione al peso (variante "smooth" di NGINX) |
| **Least Connections**    | il server con meno connessioni attive                        |
| **Least Time**           | `tempo medio di risposta × (connessioni attive + 1)` minimo  |
| **IP Hash**              | `hash(IP client) mod N` server online                        |

## Avvio

```bash
npm install
npm start
```

Poi apri <http://localhost:4200>.

## Cosa si può fare

- scegliere l'algoritmo dalla barra in alto (le statistiche vengono azzerate a ogni cambio);
- regolare traffico automatico (arrivi di Poisson), velocità della simulazione, numero di client (2–8) e di server (1–6);
- inviare una singola richiesta, un burst di 10 richieste, oppure cliccare un client per inviare una richiesta da quell'IP;
- per ogni server: metterlo offline, cambiare il peso (usato da Weighted RR) e il tempo di elaborazione base;
- leggere nel registro **perché** il load balancer ha scelto un certo server (turno, pesi correnti, connessioni, punteggi, hash).

## Modello della simulazione

Ogni richiesta percorre `client → LB → server → LB → client`; ogni tratta di rete dura 450 ms simulati.
Il tempo di elaborazione su un server è:

```
base × (1 + 0,35 × (connessioni attive − 1)) × jitter(0,85…1,15)
```

quindi un server sovraccarico rallenta. Il tempo di risposta misurato dal load balancer (usato da Least Time) va dall'inoltro della richiesta alla ricezione della risposta ed è mediato con una EWMA (α = 0,3).

## Struttura del codice

```
src/app/
├── balancer/               # un file per algoritmo + descrizioni (algorithms.ts)
├── simulation.service.ts   # motore: tempo simulato, pacchetti, statistiche
├── layout.ts               # geometria del diagramma SVG
├── topology/               # diagramma animato
├── controls/               # pannello di controllo
├── server-stats/           # tabella e configurazione dei server
└── decision-log/           # registro delle decisioni
```

Per aggiungere un algoritmo basta implementare l'interfaccia `BalancingStrategy` (`balancer/strategy.ts`) e registrarlo in `balancer/algorithms.ts`.
