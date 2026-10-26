# Autoscaling: soglie di isteresi e cool-down

Simulatore didattico (Angular 21) che mostra perché un autoscaler a soglie può **oscillare** (_flapping_)
e come lo evitano le due tecniche classiche:

- **soglie di isteresi**: soglia di scale-out e soglia di scale-in distinte, con una banda morta in mezzo;
- **cool-down**: dopo ogni azione di scaling si attende prima di poterne fare un'altra.

Due autoscaler (A e B), configurabili in modo indipendente, ricevono **lo stesso identico carico**,
così da poter confrontare i comportamenti fianco a fianco.

## Avvio

```bash
npm install
npm start          # http://localhost:4200
```

Altri comandi: `npm test` (unit test con Vitest), `npm run build` (build di produzione in `dist/`).

> Richiede Node.js ≥ 20.19 (Angular 21).

## Il modello simulato

| Elemento | Comportamento |
| --- | --- |
| Tempo | passo di 5 s; i grafici mostrano gli ultimi 15 minuti |
| Carico | in "% di CPU di un pod" (100% = un pod saturo); costante, sinusoidale, a gradini o a picchi, più rumore casuale riproducibile |
| Metrica | utilizzo medio dei **pod pronti** = carico / pod pronti (max 100%); l'eccedenza è carico non servito |
| Valutazione | ogni _N_ secondi (default 15 s, come l'HPA di Kubernetes) |
| Avvio pod | un nuovo pod diventa pronto dopo un tempo configurabile (default 30 s) |
| Scale-out | se utilizzo > soglia di scale-out → + _passo_ repliche |
| Scale-in | se utilizzo < soglia di scale-in (o < soglia unica se l'isteresi è disattivata) → − _passo_ repliche, rimuovendo per primi i pod più recenti |
| Cool-down di scale-out | dopo uno scale-out nessuna azione per il periodo indicato |
| Cool-down di scale-in | dopo uno scale-in nessun altro scale-in per il periodo indicato (uno scale-out resta possibile) |

Per ogni autoscaler l'interfaccia mostra:

- grafico dell'utilizzo con soglie, banda di isteresi, azioni (▲ / ▼), decisioni bloccate (○) e una
  striscia che evidenzia i periodi di cool-down;
- grafico delle repliche richieste, pronte e del minimo necessario;
- statistiche: azioni, **inversioni di direzione** (misura del flapping), decisioni bloccate,
  repliche medie (costo), carico non servito;
- tabella "anti-flapping": verifica la condizione `soglia_in ≤ soglia_out · m / (m + k)`;
- registro testuale di ogni decisione.

In fondo alla pagina una sezione teorica riassume i concetti, propone esperimenti e collega il modello
a Kubernetes HPA, AWS e Azure.

## Struttura

```
src/app/
├── sim/
│   ├── load.ts                 # generatore di carico (scenari + rumore con seme fisso)
│   ├── autoscaler.ts           # logica dell'autoscaler: soglie, isteresi, cool-down, statistiche
│   ├── autoscaler.spec.ts      # test sul comportamento (flapping, overshoot, cool-down)
│   └── simulation.service.ts   # orologio della simulazione, condiviso dai due autoscaler
├── components/
│   ├── load-panel.*            # parametri del carico e dell'ambiente
│   ├── scaler-panel.*          # configurazione, grafici, statistiche e log di un autoscaler
│   ├── time-chart.*            # grafico temporale SVG senza dipendenze esterne
│   ├── theory.*                # spiegazione teorica
│   └── clock.pipe.ts
└── app.*                       # barra dei comandi e layout
```
