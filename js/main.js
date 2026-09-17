import { getConfigGH, saveConfigGH, caricaCredenzialiUI, leggiCredenzialiForm } from './config.js';
import { caricaFileDaGitHub, salvaFileSuGitHub } from './api/github.js';
import { inizializzaNavigazione } from './ui/navigation.js';
import { popolaUIProfilo, leggiProfiloForm, aggiornaResocontoFabbisogno } from './ui/profiloUI.js';
import { renderListaAlimenti, apriModalAlimento, chiudiModalAlimento, leggiAlimentoForm } from './ui/alimentiUI.js';
import { renderPianoCorrente } from './ui/pianiUI.js';
import { generaStrutturaPiano } from './modules/alimenti.js';

let alimentiData = [];
let utenteData = { profilo: {}, progressi: [], piano_corrente: null };

document.addEventListener('DOMContentLoaded', async () => {
  inizializzaNavigazione();
  caricaCredenzialiUI();
  collegaEventiUI();
  await sincronizzaConGitHub();
});

function collegaEventiUI() {
  document.getElementById('btnSyncCloud')?.addEventListener('click', sincronizzaConGitHub);

  document.getElementById('btnSalvaProfilo')?.addEventListener('click', salvaProfiloHandler);
  ['prof_eta', 'prof_sesso', 'prof_altezza', 'prof_peso', 'prof_grasso', 'prof_muscolo', 'prof_viscerale', 'prof_attivita', 'prof_obiettivo'].forEach(id => {
  document.getElementById(id)?.addEventListener('change', aggiornaResocontoFabbisogno);
  document.getElementById(id)?.addEventListener('input', aggiornaResocontoFabbisogno);
});

  document.getElementById('btnNuovoAlimento')?.addEventListener('click', () => apriModalAlimento());
  document.getElementById('btnChiudiModalAlimento')?.addEventListener('click', chiudiModalAlimento);
  document.getElementById('btnSalvaAlimento')?.addEventListener('click', salvaAlimentoHandler);
  document.getElementById('cercaAlimentoInput')?.addEventListener('input', (e) => {
    renderListaAlimenti(alimentiData, e.target.value, toggleAttivoHandler, editAlimentoHandler);
  });

  document.getElementById('btnGeneraPiano')?.addEventListener('click', generaPianoHandler);

  document.getElementById('btnSalvaConfig')?.addEventListener('click', () => {
    const nuovaCfg = leggiCredenzialiForm();
    saveConfigGH(nuovaCfg);
    alert('Credenziali GitHub salvate!');
    sincronizzaConGitHub();
  });
}

async function sincronizzaConGitHub() {
  const syncIcon = document.getElementById('syncIcon');
  if (syncIcon) syncIcon.classList.add('animate-spin');

  const configGH = getConfigGH();
  if (configGH.token && configGH.username && configGH.repo) {
    try {
      const [alimentiCloud, utenteCloud] = await Promise.all([
        caricaFileDaGitHub('data/alimenti.json'),
        caricaFileDaGitHub('data/utente_data.json')
      ]);

      if (alimentiCloud) alimentiData = alimentiCloud;
      if (utenteCloud) utenteData = utenteCloud;
    } catch (err) {
      console.warn('Errore sync cloud:', err);
    }
  }

  popolaUIProfilo(utenteData);
  renderListaAlimenti(alimentiData, '', toggleAttivoHandler, editAlimentoHandler);
  renderPianoCorrente(utenteData);

  if (syncIcon) syncIcon.classList.remove('animate-spin');
}

async function salvaProfiloHandler() {
  utenteData.profilo = leggiProfiloForm();
  aggiornaResocontoFabbisogno();

  const configGH = getConfigGH();
  if (configGH.token) {
    await salvaFileSuGitHub('data/utente_data.json', utenteData, 'Aggiornato profilo utente');
    alert('Profilo salvato su GitHub!');
  } else {
    alert('Profilo salvato in locale.');
  }
}

async function salvaAlimentoHandler() {
  const nuovo = leggiAlimentoForm();
  if (!nuovo.nome) return alert("Inserisci il nome dell'alimento");

  const idx = alimentiData.findIndex(a => a.id === nuovo.id);
  if (idx !== -1) {
    nuovo.attivo = alimentiData[idx].attivo !== false;
    alimentiData[idx] = nuovo;
  } else {
    alimentiData.push(nuovo);
  }

  chiudiModalAlimento();
  renderListaAlimenti(alimentiData, '', toggleAttivoHandler, editAlimentoHandler);

  const configGH = getConfigGH();
  if (configGH.token) {
    await salvaFileSuGitHub('data/alimenti.json', alimentiData, 'Aggiornato database alimenti');
  }
}

async function toggleAttivoHandler(id) {
  const alim = alimentiData.find(a => a.id === id);
  if (alim) {
    alim.attivo = alim.attivo === false ? true : false;
    renderListaAlimenti(alimentiData, '', toggleAttivoHandler, editAlimentoHandler);
    const configGH = getConfigGH();
    if (configGH.token) {
      await salvaFileSuGitHub('data/alimenti.json', alimentiData, `Cambiato stato attivo/inattivo per ${alim.nome}`);
    }
  }
}

function editAlimentoHandler(id) {
  const alim = alimentiData.find(a => a.id === id);
  if (alim) apriModalAlimento(alim);
}

async function generaPianoHandler() {
  try {
    const piano = generaStrutturaPiano(alimentiData, utenteData);
    utenteData.piano_corrente = piano;
    renderPianoCorrente(utenteData);

    const configGH = getConfigGH();
    if (configGH.token) {
      await salvaFileSuGitHub('data/utente_data.json', utenteData, 'Generato nuovo piano alimentare');
      alert('Nuovo piano generato e sincronizzato!');
    }
  } catch (err) {
    alert(err.message);
  }
}
