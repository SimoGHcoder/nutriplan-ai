// js/main.js

import { inizializzaNavigazione } from './ui/navigation.js';
import { popolaUIProfilo, leggiProfiloForm, aggiornaResocontoFabbisogno } from './ui/profiloUI.js';
import { inizializzaAlimentiUI, renderListaAlimenti, apriModalAlimento, chiudiModalAlimento, leggiAlimentoForm } from './ui/alimentiUI.js';
import { getConfigGH, caricaFileDaGitHub, salvaFileSuGitHub, elencaProfiliGitHub } from './services/githubService.js';

let alimentiData = [];
let utenteData = {
  profilo: {},
  piano_alimentare: []
};

// Migrazione una-tantum delle chiavi localStorage dal vecchio prefisso "pwa_"
// a "nutriplan_", per non perdere i dati già salvati sui dispositivi esistenti.
(function migraChiaviLocalStorage() {
  ['profilo_attivo', 'alimenti'].forEach(suffisso => {
    const vecchiaChiave = `pwa_${suffisso}`;
    const nuovaChiave = `nutriplan_${suffisso}`;
    if (localStorage.getItem(vecchiaChiave) !== null && localStorage.getItem(nuovaChiave) === null) {
      localStorage.setItem(nuovaChiave, localStorage.getItem(vecchiaChiave));
    }
  });

  // I profili utente usano una chiave dinamica: pwa_utente_<nome> -> nutriplan_utente_<nome>
  Object.keys(localStorage)
    .filter(chiave => chiave.startsWith('pwa_utente_'))
    .forEach(vecchiaChiave => {
      const nuovaChiave = 'nutriplan_' + vecchiaChiave.slice('pwa_'.length);
      if (localStorage.getItem(nuovaChiave) === null) {
        localStorage.setItem(nuovaChiave, localStorage.getItem(vecchiaChiave));
      }
    });
})();

// Profilo attualmente selezionato in UI
let profiloAttivo = localStorage.getItem('nutriplan_profilo_attivo') || 'default';
let listaProfiliTrovati = [profiloAttivo];

document.addEventListener('DOMContentLoaded', async () => {
  inizializzaNavigazione();

  // Inizializza la UI degli alimenti passando le funzioni di callback per toggle e modifica
  inizializzaAlimentiUI(toggleStatoAlimento, apriModaleModificaAlimento);

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
      // 1. Recupera la lista di tutti i profili presenti su GitHub nella cartella data/
      const profiliCloud = await elencaProfiliGitHub();
      if (profiliCloud && profiliCloud.length > 0) {
        listaProfiliTrovati = profiliCloud;
        // Se il profilo attivo attuale non è nella lista cloud, imposta il primo disponibile
        if (!listaProfiliTrovati.includes(profiloAttivo)) {
          profiloAttivo = listaProfiliTrovati[0];
          localStorage.setItem('nutriplan_profilo_attivo', profiloAttivo);
        }
      }

      // 2. Carica alimenti globali e il profilo attivo corrente
      const percorsoFileUtente = `data/utente_${profiloAttivo}.json`;
      const [alimentiCloud, utenteCloud] = await Promise.all([
        caricaFileDaGitHub('data/alimenti.json'),
        caricaFileDaGitHub(percorsoFileUtente)
      ]);

      if (alimentiCloud) {
        alimentiData = alimentiCloud;
      }
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
    const localeSalvato = localStorage.getItem(`nutriplan_utente_${profiloAttivo}`);
    if (localeSalvato) {
      try {
        utenteData = JSON.parse(localeSalvato);
        popolaUIProfilo(utenteData);
      } catch (e) {
        console.error('Errore parsing dati locali', e);
      }
    }
  }

  // Fallback alimenti locali se vuoti
  if (!alimentiData || alimentiData.length === 0) {
    const alimentiLocali = localStorage.getItem('nutriplan_alimenti');
    if (alimentiLocali) {
      try {
        alimentiData = JSON.parse(alimentiLocali);
      } catch (e) {
        console.error('Errore parsing alimenti locali', e);
      }
    }
  }

  // Ridisegna la lista alimenti con l'eventuale filtro attivo
  const filtroCorrente = document.getElementById('cercaAlimentoInput')?.value || '';
  renderListaAlimenti(alimentiData, filtroCorrente);

  await aggiornaSelectProfiloUI();
  if (syncIcon) syncIcon.classList.remove('animate-spin');
}

async function aggiornaSelectProfiloUI() {
  const select = document.getElementById('selectProfiloAttivo');
  if (!select) return;

  // Se abbiamo il token, prova ad aggiornare la lista dal cloud in tempo reale
  const configGH = getConfigGH();
  if (configGH.token) {
    const profiliCloud = await elencaProfiliGitHub();
    if (profiliCloud && profiliCloud.length > 0) {
      listaProfiliTrovati = profiliCloud;
    }
  }

  // Assicurarci che il profilo attivo sia incluso nella lista visibile
  if (!listaProfiliTrovati.includes(profiloAttivo)) {
    listaProfiliTrovati.push(profiloAttivo);
  }

  // Costruisci le opzioni del select
  select.innerHTML = listaProfiliTrovati.map(p =>
    `<option value="${p}" ${p === profiloAttivo ? 'selected' : ''}>${p}</option>`
  ).join('');
}

function collegaEventiUI() {
  // Cambio profilo dal menu a tendina
  document.getElementById('selectProfiloAttivo')?.addEventListener('change', async (e) => {
    profiloAttivo = e.target.value;
    localStorage.setItem('nutriplan_profilo_attivo', profiloAttivo);

    // Ricarica i dati del profilo appena selezionato
    await sincronizzaConGitHub();
  });

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

  // Ricalcolo in tempo reale del profilo
  ['prof_eta', 'prof_sesso', 'prof_altezza', 'prof_peso', 'prof_grasso', 'prof_muscolo', 'prof_viscerale', 'prof_attivita', 'prof_obiettivo'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', aggiornaResocontoFabbisogno);
    document.getElementById(id)?.addEventListener('input', aggiornaResocontoFabbisogno);
  });

  // Tasto Salva Profilo
  document.getElementById('btnSalvaProfilo')?.addEventListener('click', async () => {
    const datiForm = leggiProfiloForm();
    const nomeProfiloInserito = (document.getElementById('prof_nome')?.value || profiloAttivo).trim().toLowerCase().replace(/\s+/g, '_');

    if (!nomeProfiloInserito) {
      alert('Inserisci un nome valido per il profilo.');
      return;
    }

    profiloAttivo = nomeProfiloInserito;
    localStorage.setItem('nutriplan_profilo_attivo', profiloAttivo);

    utenteData.profilo = datiForm;

    // Salvataggio locale
    localStorage.setItem(`nutriplan_utente_${profiloAttivo}`, JSON.stringify(utenteData));

    // Salvataggio Cloud su GitHub
    const percorsoFileUtente = `data/utente_${profiloAttivo}.json`;
    try {
      await salvaFileSuGitHub(percorsoFileUtente, utenteData, `Aggiornamento profilo ${profiloAttivo}`);
      alert(`Profilo "${profiloAttivo}" salvato e sincronizzato con successo su GitHub!`);
      await aggiornaSelectProfiloUI();
    } catch (err) {
      alert('Profilo salvato in locale. Errore sync GitHub: ' + err.message);
    }
  });

  // Tasto Nuovo Profilo
  document.getElementById('btnNuovoProfilo')?.addEventListener('click', () => {
    document.getElementById('formProfilo').reset();
    document.getElementById('prof_nome').value = 'nuovo_profilo';
    utenteData = { profilo: {}, piano_alimentare: [] };
    alert('Inserisci i dati del nuovo profilo e premi "Salva Profilo" per caricarlo sul cloud.');
  });

  // Tasto Sync manuale (🔄)
  document.getElementById('btnSyncCloud')?.addEventListener('click', async () => {
    await sincronizzaConGitHub();
    alert('Sincronizzazione e aggiornamento profili completati!');
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
    alert('Token salvato e profili sincronizzati con successo!');
  });

  // --- SEZIONE GESTIONE ALIMENTI ---

  // 1. Ricerca live nella lista alimenti
  document.getElementById('cercaAlimentoInput')?.addEventListener('input', (e) => {
    renderListaAlimenti(alimentiData, e.target.value);
  });

  // 2. Pulsante "Nuovo Alimento" (apre il modale pulito)
  document.getElementById('btnNuovoAlimento')?.addEventListener('click', () => {
    apriModalAlimento(null);
  });

  // 3. Pulsante salvataggio dal modale Alimento (Crea o Aggiorna)
  document.getElementById('btnSalvaAlimento')?.addEventListener('click', async () => {
    const nuovoAlimento = leggiAlimentoForm();

    if (!nuovoAlimento.nome) {
      alert('Il nome dell\'alimento è obbligatorio.');
      return;
    }

    // Controlla se l'alimento esiste già per ID (Modifica vs Inserimento)
    const existingIndex = alimentiData.findIndex(a => a.id === nuovoAlimento.id);

    if (existingIndex !== -1) {
      // Mantiene lo stato attivo precedente
      nuovoAlimento.attivo = alimentiData[existingIndex].attivo;
      alimentiData[existingIndex] = nuovoAlimento;
    } else {
      nuovoAlimento.attivo = true;
      alimentiData.push(nuovoAlimento);
    }

    chiudiModalAlimento();

    // Salva in locale come cache di sicurezza
    localStorage.setItem('nutriplan_alimenti', JSON.stringify(alimentiData));

    // Ridisegna la lista mantenendo il filtro di ricerca attivo
    const filtroCorrente = document.getElementById('cercaAlimentoInput')?.value || '';
    renderListaAlimenti(alimentiData, filtroCorrente);

    // Sincronizzazione Cloud su GitHub (data/alimenti.json)
    try {
      await salvaFileSuGitHub('data/alimenti.json', alimentiData, `Aggiornamento alimento: ${nuovoAlimento.nome}`);
    } catch (err) {
      console.warn('Errore sync GitHub alimenti:', err);
      alert('Alimento salvato in locale. Errore di sincronizzazione con GitHub: ' + err.message);
    }
  });
}

// Funzione di toggle attivazione/disattivazione alimento
function toggleStatoAlimento(id) {
  const alimento = alimentiData.find(a => a.id === id);
  if (alimento) {
    alimento.attivo = alimento.attivo === false ? true : false;

    // Salva in locale
    localStorage.setItem('nutriplan_alimenti', JSON.stringify(alimentiData));

    const filtroCorrente = document.getElementById('cercaAlimentoInput')?.value || '';
    renderListaAlimenti(alimentiData, filtroCorrente);
    
    // Sincronizza lo stato modificato su GitHub
    salvaFileSuGitHub('data/alimenti.json', alimentiData, `Cambio stato alimento: ${alimento.nome}`).catch(err => {
      console.warn("Errore sync stato alimento su GitHub:", err);
    });
  }
}

// Funzione di apertura modale per la modifica di un alimento esistente
function apriModaleModificaAlimento(id) {
  const alimento = alimentiData.find(a => a.id === id);
  if (alimento) {
    apriModalAlimento(alimento);
  }
}
