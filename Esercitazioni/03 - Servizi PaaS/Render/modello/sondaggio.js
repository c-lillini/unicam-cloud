const DOMANDA = 'Quale di queste piattaforme hai già usato?';
const OPZIONI = ['Vercel', 'Netlify', 'Render', 'Nessuna'];

const avvioProcesso = Date.now();
const voti = Object.fromEntries(OPZIONI.map((o) => [o, 0]));
let richiesteServite = 0;

function registraRichiesta() {
  richiesteServite += 1;
}

function vota(opzione) {
  if (!OPZIONI.includes(opzione)) return false;
  voti[opzione] += 1;
  return true;
}

function stato() {
  return {
    domanda: DOMANDA,
    voti: { ...voti },
    totale: Object.values(voti).reduce((a, b) => a + b, 0),
    uptimeSecondi: Math.round((Date.now() - avvioProcesso) / 1000),
    richiesteServite,
    pid: process.pid,
  };
}

module.exports = { DOMANDA, OPZIONI, registraRichiesta, vota, stato };
