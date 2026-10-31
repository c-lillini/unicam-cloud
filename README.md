# Applicazioni Web, Mobile e Cloud - Modulo II 🚀

Questo repository contiene il materiale del corso "Applicazioni Web, Mobile e Cloud - Modulo II" dell'Università di Camerino.

- La cartella `Esempi` 💡 raccoglie i simulatori didattici interattivi usati a lezione per illustrare i concetti teorici.
- La cartella `Esercitazioni` 📂 raccoglie le esercitazioni viste a lezione, suddivise per capitoli.

## Struttura del repository

- 💡 `Esempi/` – applicazioni Angular che simulano visivamente i concetti presentati a lezione (avvio con `npm install` e `npm start`).
  - ⚖️ `02 - Load Balancer/` – simulatore animato di un load balancer che distribuisce le richieste tra i server di backend con diversi algoritmi (Round Robin, Weighted Round Robin, Least Connections, Least Time, IP Hash).
  - 📈 `02 - Oscillazioni/` – simulatore di autoscaling che mostra il fenomeno del _flapping_ e come evitarlo tramite soglie di isteresi e cool-down, confrontando due autoscaler sullo stesso carico.
  - 🔤 `03 - Tokenizer/` – mostra come un LLM divide il testo in token con i tokenizer reali di OpenAI (`o200k_base` di GPT-4o/GPT-5 e `cl100k_base` di GPT-4), e confronta quanti token servono per la stessa frase in lingue diverse.
- 📁 `Esercitazioni/` – esercitazioni del corso organizzate per capitolo, con materiali e soluzioni a supporto delle lezioni.
  - 🏗️ `02 - Infrastruttura IaaS/` – laboratori dedicati alla costruzione di ambienti su Infrastructure as a Service.
    - 🖥️ `AWS EC2/` – guida passo-passo per distribuire WordPress e MariaDB su due istanze EC2 (app pubblica + DB privato) in configurazione Single-AZ.
  - 📘 `03 - Servizi PaaS/` – panoramica sui servizi Platform as a Service.
    - 🚀 `AWSBeanstalk/` – applicazione Blazor (.NET) d'esempio per il deployment su AWS Elastic Beanstalk.
    - 🌐 `Netlify/` – esercitazione sul deploy di un sito statico con Netlify.
  - 🐳 `04 - Docker/` – laboratori dedicati alla containerizzazione di servizi tramite Docker e Docker Compose.
    - 🧾 `Catalog/` – servizio Catalog Node.js/Express con MongoDB, completo di configurazione Docker Compose per API e database e collezione Bruno per testare le API.
    - 🟢 `NodeJs/` – semplice server Express containerizzato che restituisce le informazioni sull'host (hostname, IP, memoria, uptime).
    - 📰 `Wordpress/` – stack WordPress + MariaDB containerizzato con volumi persistenti e rete isolata per test locali rapidi.
  - ☸️ `06 - Kubernetes/` – laboratori su un cluster Kubernetes (k3s) con manifest di deployment e load balancer NGINX esterno.
    - 👋 `Hello/` – deployment di `nginxdemos/hello` su più repliche esposto tramite NodePort, con configurazione NGINX per bilanciare il traffico tra i nodi del cluster.
    - 🌍 `Nginx/` – immagine Docker personalizzata di NGINX con pagina statica, relativo deployment Kubernetes e configurazione del load balancer.
    - 📊 `HPA/` – Horizontal Pod Autoscaler basato sull'utilizzo della CPU, con test plan JMeter per generare carico e osservare lo scaling.
  - 🔄 `07 - DevOps/` – laboratori su pratiche DevOps e pipeline CI/CD.
    - 🧮 `Cloud Calculator/` – Web API .NET con unit test e pipeline GitLab CI/CD (build, test, SAST e secret detection, build e push dell'immagine Docker, deploy manuale in produzione).
