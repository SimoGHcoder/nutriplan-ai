// js/main.js

import { inizializzaNavigazione } from './ui/navigation.js';
import { popolaUIProfilo, leggiProfiloForm, aggiornaResocontoFabbisogno } from './ui/profiloUI.js';
import { getConfigGH, caricaFileDaGitHub, salvaFileSuGitHub } from './services/githubService.js';

let alimentiData = [];
let utenteData = {
  profilo: {},
  piano_alimentare: []
};

document.addEventListener('DOMContentLoaded', async () => {
  inizializzaNavigazione();
  collegaEventiUI();
  
  // Sincronizzazione automatica iniziale se il token è memorizzato
  await sincronizzaConGitHub();
});

async function sincronizzaConGitHub() {
  const syncIcon = document.getElementById('syncIcon');
  if (syncIcon) syncIcon.classList.add('animate-spin');

  const configGH = getConfigGH();
  if (configGH.token && configGH.username && configGH.repo) {
    try {
      const percorsoFileUtente = `data/utente_${configGH.profiloId}.json`;
      const [alimentiCloud, utenteCloud] = await Promise.all([
        caricaFileDaGitHub('data/alimenti.json'),
        caricaFileDaGitHub(percorsoFileUtente)
      ]);

      if (alimentiCloud) alimentiData = alimentiCloud;
      if (utenteCloud) {
        utenteData = utenteCloud;
        popolaUIProfilo(utenteData);
      }
    } catch (err) {
      console.warn('Errore sync cloud:', err);
    }
  }

  // Fallback su localStorage se non c'è cloud o token
  if (!utenteData.profilo || Object.keys(utenteData.profilo).length === 0) {
    const localeSalvato = localStorage.getItem('pwa_utente_data');
    if (localeSalvato) {
      try {
        utenteData = JSON.parse(localeSalvato);
        popolaUIProfilo(utenteData);
      } catch (e) {
        console.error('Errore parsing dati locali', e);
      }
    }
  }

  if (syncIcon) syncIcon.classList.remove('animate-spin');
}

function collegaEventiUI() {
  // Ascoltatori modifica campi profilo per ricalcolo in tempo reale
  ['prof_eta', 'prof_sesso', 'prof_altezza', 'prof_peso', 'prof_grasso', 'prof_muscolo', 'prof_viscerale', 'prof_attivita', 'prof_obiettivo'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', aggiornaResocontoFabbisogno);
    document.getElementById(id)?.addEventListener('input', aggiornaResocontoFabbisogno);
  });

  // Tasto Salva Profilo
  document.getElementById('btnSalvaProfilo')?.addEventListener('click', async () => {
    utenteData.profilo = leggiProfiloForm();
    
    // Backup locale
    localStorage.setItem('pwa_utente_data', JSON.stringify(utenteData));

    // Salvataggio Cloud su file specifico utente
    const configGH = getConfigGH();
    const percorsoFileUtente = `data/utente_${configGH.profiloId}.json`;

    try {
      await salvaFileSuGitHub(percorsoFileUtente, utenteData, `Aggiornamento profilo ${configGH.profiloId}`);
      alert('Profilo salvato e sincronizzato con successo su GitHub!');
    } catch (err) {
      alert('Profilo salvato in locale. Errore sync GitHub: ' + err.message);
    }
  });

  // Tasto Sync manuale (🔄)
  document.getElementById('btnSyncCloud')?.addEventListener('click', async () => {
    await sincronizzaConGitHub();
    alert('Sincronizzazione completata!');
  });

  // Salvataggio Configurazione GitHub e avvio immediato sincronizzazione
  document.getElementById('btnSalvaConfig')?.addEventListener('click', async () => {
    const token = document.getElementById('cfg_token').value.trim();
    const username = document.getElementById('cfg_username').value.trim();
    const repo = document.getElementById('cfg_repo').value.trim();
    const profiloId = document.getElementById('cfg_profilo_id').value.trim() || 'default';

    localStorage.setItem('gh_token', token);
    localStorage.setItem('gh_username', username);
    localStorage.setItem('gh_repo', repo);
    localStorage.setItem('gh_profilo_id', profiloId);

    document.getElementById('modalConfig')?.classList.add('hidden');

    // Sincronizza subito con le nuove credenziali inserite
    await sincronizzaConGitHub();
    alert('Configurazione salvata e profilo caricato correttamente!');
  });
}
