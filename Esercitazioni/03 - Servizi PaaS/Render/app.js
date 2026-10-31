const path = require('path');
const express = require('express');
const sondaggio = require('./modello/sondaggio');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Ogni richiesta che passa di qui viene contata: serve al contatore proiettato.
app.use((req, res, next) => {
  sondaggio.registraRichiesta();
  next();
});

// Vista per i telefoni degli studenti: la domanda e i bottoni.
app.get('/', (req, res) => {
  res.render('telefono', {
    domanda: sondaggio.DOMANDA,
    opzioni: sondaggio.OPZIONI,
  });
});

// Registrazione di un voto.
app.post('/voto/:opzione', (req, res) => {
  const accettato = sondaggio.vota(req.params.opzione);
  res.status(accettato ? 200 : 400).json({ ok: accettato });
});

// Vista per il proiettore: le barre che crescono.
app.get('/schermo', (req, res) => {
  res.render('schermo', { domanda: sondaggio.DOMANDA });
});

// Lo stato in JSON: lo interroga la pagina proiettata, una volta ogni 1,5 s.
app.get('/stato', (req, res) => {
  res.json(sondaggio.stato());
});

// Render assegna la porta tramite la variabile d'ambiente PORT.
// È l'unica riga di questo file che non scrivereste su un server vostro.
const porta = process.env.PORT || 3000;
app.listen(porta, () => {
  console.log(`In ascolto sulla porta ${porta} — processo ${process.pid}`);
});
