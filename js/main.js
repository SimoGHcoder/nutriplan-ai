// js/main.js

import { inizializzaNavigazione } from './ui/navigation.js';
import { popolaUIProfilo, leggiProfiloForm, aggiornaResocontoFabbisogno } from './ui/profiloUI.js';
import { getConfigGH, caricaFileDaGitHub, salvaFileSuGitHub } from './services/githubService.js';

let alimentiData = [];
let utenteData = {
  profilo: {},
  piano_alimentare: []
};

// Profilo attualmente selezionato in UI
let profiloAttivo = localStorage.getItem('pwa_profilo_attivo') || 'default';

document.addEventListener('DOMContentLoaded', async () => {
  inizializzaNavigazione();
  collegaEventiUI();
  
  // Sincronizzazione iniziale con GitHub
  await sincronizzaConGitHub();
});

async function sincronizzaConGitHub() {
  const syncIcon = document.getElementById('syncIcon');
  if (syncIcon) syncIcon.classList.add('animate-spin');

  const configGH = getConfigGH();
  if (configGH.token) {
    try {
      // Carica alimenti globali e il profilo attivo corrente
      const percorsoFileUtente = `data/utente_${profiloAttivo}.json`;
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

  // Fallback locale se non caricato dal cloud
  if (!utenteData.profilo || Object.keys(utenteData.profilo).length === 0) {
    const localeSalvato = localStorage.getItem(`pwa_utente_${profiloAttivo}`);
    if (localeSalvato) {
      try {
        utenteData = JSON.parse(localeSalvato);
        popolaUIProfilo(utenteData);
      } catch (e) {
        console.error('Errore parsing dati locali', e);
      }
    }
  }

  aggiornaSelectProfiloUI();
  if (syncIcon) syncIcon.classList.remove('animate-spin');
}

function aggiornaSelectProfiloUI() {
  const select = document.getElementById('selectProfiloAttivo');
  if (!select) return;

  // Recupera eventuali profili salvati in locale o usa quello corrente
  select.innerHTML = `<option value="${profiloAttivo}">${profiloAttivo}</option>`;
  select.value = profiloAttivo;
}

function collegaEventiUI() {
  // Apertura modale impostazioni (⚙️)
  document.getElementById('btnSettings')?.addEventListener('click', () => {
    const tokenSalvo = localStorage.getItem('gh_token') || '';
    const tokenInput = document.getElementById('cfg_token');
    if (tokenInput) tokenInput.value = tokenSalvo;
    document.getElementById('modalConfig')?.classList.remove('hidden');
  });

  // Chiusura modale impostazioni
  document.getElementById('btnChiudiConfig')?.addEventListener('click', () => {
    document.getElementById('modalConfig')?.classList.add('hidden');
  });

  // Ricalcolo in tempo reale
  ['prof_eta', 'prof_sesso', 'prof_altezza', 'prof_peso', 'prof_grasso', 'prof_muscolo', 'prof_viscerale', 'prof_attivita', 'prof_obiettivo'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', aggiornaResocontoFabbisogno);
    document.getElementById(id)?.addEventListener('input', aggiornaResocontoFabbisogno);
  });

  // Tasto Salva Profilo (Salva sul file corrispondente al nome inserito nel form)
  document.getElementById('btnSalvaProfilo')?.addEventListener('click', async () => {
    const datiForm = leggiProfiloForm();
    const nomeProfiloInserito = (document.getElementById('prof_nome')?.value || 'default').trim().toLowerCase().replace(/\s+/g, '_');
    
    if (!nomeProfiloInserito) {
      alert('Inserisci un nome valido per il profilo.');
      return;
    }

    profiloAttivo = nomeProfiloInserito;
    localStorage.setItem('pwa_profilo_attivo', profiloAttivo);

    utenteData.profilo = datiForm;
    
    // Salvataggio locale
    localStorage.setItem(`pwa_utente_${profiloAttivo}`, JSON.stringify(utenteData));

    // Salvataggio Cloud su GitHub
    const percorsoFileUtente = `data/utente_${profiloAttivo}.json`;
    try {
      await salvaFileSuGitHub(percorsoFileUtente, utenteData, `Aggiornamento profilo ${profiloAttivo}`);
      alert(`Profilo "${profiloAttivo}" salvato e sincronizzato con successo su GitHub!`);
      aggiornaSelectProfiloUI();
    } catch (err) {
      alert('Profilo salvato in locale. Errore sync GitHub: ' + err.message);
    }
  });

  // Tasto Nuovo Profilo (pulisce il form per crearne uno nuovo)
  document.getElementById('btnNuovoProfilo')?.addEventListener('click', () => {
    document.getElementById('formProfilo').reset();
    document.getElementById('prof_nome').value = 'nuovo_profilo';
    utenteData = { profilo: {}, piano_alimentare: [] };
    alert('Inserisci i dati del nuovo profilo e premi "Salva Profilo".');
  });

  // Tasto Sync manuale (🔄)
  document.getElementById('btnSyncCloud')?.addEventListener('click', async () => {
    await sincronizzaConGitHub();
    alert('Sincronizzazione completata!');
  });

  // Salvataggio Solo Token dal Modale
  document.getElementById('btnSalvaConfig')?.addEventListener('click', async () => {
    const tokenInput = document.getElementById('cfg_token');
    const token = tokenInput ? tokenInput.value.trim() : '';

    if (!token) {
      alert('Inserisci un token GitHub valido.');
      return;
    }

    localStorage.setItem('gh_token', token);
    document.getElementById('modalConfig')?.classList.add('hidden');

    await sincronizzaConGitHub();
    alert('Token salvato e dati sincronizzati con successo!');
  });
}
