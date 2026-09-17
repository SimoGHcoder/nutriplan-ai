// GESTIONE MODALE IMPOSTAZIONI API
function openConfigModal() {
  const modal = document.getElementById('configModal');
  if (modal) {
    caricaConfigInModal();
    modal.classList.remove('hidden');
  } else {
    console.error("Modale #configModal non trovata nel DOM.");
  }
}

function closeConfigModal() {
  const modal = document.getElementById('configModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function caricaConfigInModal() {
  const configGH = JSON.parse(localStorage.getItem('nutri_pwa_gh')) || {};
  document.getElementById('ghUsername').value = configGH.username || '';
  document.getElementById('ghRepo').value = configGH.repo || 'pwa-nutrizionista';
  document.getElementById('ghToken').value = configGH.token || '';
}

function salvaConfigurazioneGH() {
  const configGH = {
    username: document.getElementById('ghUsername').value.trim(),
    repo: document.getElementById('ghRepo').value.trim(),
    token: document.getElementById('ghToken').value.trim()
  };
  localStorage.setItem('nutri_pwa_gh', JSON.stringify(configGH));
  closeConfigModal();
  alert("Credenziali salvate nel browser!");
  if (typeof inizializzaDati === 'function') {
    inizializzaDati();
  }
}
// Registrazione Service Worker per PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(() => console.log("Service Worker Registrato"))
    .catch((err) => console.error("Errore SW:", err));
}

// Inizializzazione dati
let configGH = JSON.parse(localStorage.getItem('nutri_pwa_gh')) || { username: '', repo: '', token: '' };
let utenteData = null;
let alimentiData = [];

document.addEventListener("DOMContentLoaded", () => {
  caricaConfigInModal();
  inizializzaDati();
});

function toggleConfigModal() {
  document.getElementById('configModal').classList.toggle('hidden');
}

function caricaConfigInModal() {
  document.getElementById('ghUsername').value = configGH.username || '';
  document.getElementById('ghRepo').value = configGH.repo || 'pwa-nutrizionista';
  document.getElementById('ghToken').value = configGH.token || '';
}

function salvaConfigurazioneGH() {
  configGH = {
    username: document.getElementById('ghUsername').value.trim(),
    repo: document.getElementById('ghRepo').value.trim(),
    token: document.getElementById('ghToken').value.trim()
  };
  localStorage.setItem('nutri_pwa_gh', JSON.stringify(configGH));
  toggleConfigModal();
  alert("Credenziali salvate nel browser!");
  inizializzaDati();
}

// Funzione helper per codificare UTF-8 in Base64 (compatibile con emoji e accenti)
function utf8_to_b64(str) {
  return window.btoa(unescape(encodeURIComponent(str)));
}

// CARICAMENTO INIZIALE DATI DA GITHUB O LOCALE
async function inizializzaDati() {
  try {
    const resUtente = await fetch('data/utente_data.json?cache_bust=' + Date.now());
    utenteData = await resUtente.json();
    
    const resAlimenti = await fetch('data/alimenti.json?cache_bust=' + Date.now());
    alimentiData = await resAlimenti.json();

    popolaFormProfilo();
    if (utenteData.piano_corrente) {
      mostraPianoInUI(utenteData.piano_corrente);
    }
  } catch (err) {
    console.log("In attesa di caricamento dati...", err);
  }
}

function popolaFormProfilo() {
  if (!utenteData || !utenteData.profilo) return;
  const p = utenteData.profilo;
  document.getElementById('eta').value = p.eta;
  document.getElementById('sesso').value = p.sesso;
  document.getElementById('altezza').value = p.altezza_cm;
  document.getElementById('peso').value = p.peso_kg;
  document.getElementById('attivita').value = p.livello_attivita;
  document.getElementById('obiettivo').value = p.obiettivo;

  calcolaTargetNutrizionali(p);
}

// CALCOLO BMR, TDEE E MACRONUTRIENTI
function calcolaTargetNutrizionali(profilo) {
  let bmr = (10 * profilo.peso_kg) + (6.25 * profilo.altezza_cm) - (5 * profilo.eta);
  bmr = profilo.sesso === 'm' ? bmr + 5 : bmr - 161;

  const tdee = Math.round(bmr * profilo.livello_attivita);
  let targetKcal = tdee;

  if (profilo.obiettivo === 'ipocalorica') targetKcal = Math.round(tdee * 0.85);
  if (profilo.obiettivo === 'ipercalorica') targetKcal = Math.round(tdee * 1.15);

  // Ripartizione Macro: Proteine 2g/kg, Grassi 0.9g/kg, Restante Carboidrati
  const protGrams = Math.round(profilo.peso_kg * 2.0);
  const grassiGrams = Math.round(profilo.peso_kg * 0.9);
  const kcalProtGrassi = (protGrams * 4) + (grassiGrams * 9);
  const carboGrams = Math.max(50, Math.round((targetKcal - kcalProtGrassi) / 4));

  document.getElementById('resBMR').textContent = Math.round(bmr);
  document.getElementById('resTDEE').textContent = tdee;
  document.getElementById('resTarget').textContent = targetKcal;
  document.getElementById('risultatiNutri').classList.remove('hidden');

  return { bmr, tdee, targetKcal, protGrams, carboGrams, grassiGrams };
}

// FUNZIONE CHIAVE: SALVATAGGIO COMMIT SU GITHUB
async function salvaFileSuGitHub(pathFile, nuovoOggettoContenuto, commitMessage) {
  if (!configGH.username || !configGH.token || !configGH.repo) {
    alert("Configura Username, Repository e Token nelle Impostazioni ⚙️!");
    toggleConfigModal();
    return false;
  }

  const url = `https://api.github.com/repos/${configGH.username}/${configGH.repo}/contents/${pathFile}`;

  try {
    let sha = "";
    // 1. Recupera lo SHA del file se esiste già
    const getRes = await fetch(url, {
      headers: { 
        'Authorization': `token ${configGH.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (getRes.ok) {
      const fileMetaData = await getRes.json();
      sha = fileMetaData.sha;
    }

    // 2. Converti in JSON e poi in Base64
    const stringaJSON = JSON.stringify(nuovoOggettoContenuto, null, 2);
    const contentBase64 = utf8_to_b64(stringaJSON);

    // 3. Esegui il PUT Commit
    const bodyPayload = {
      message: commitMessage,
      content: contentBase64
    };
    if (sha) bodyPayload.sha = sha;

    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${configGH.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify(bodyPayload)
    });

    if (putRes.ok) {
      console.log(`Salvataggio completato su ${pathFile}`);
      return true;
    } else {
      const errorData = await putRes.json();
      alert("Errore GitHub API: " + (errorData.message || "Verifica il token e i permessi."));
      return false;
    }
  } catch (err) {
    alert("Errore di connessione a GitHub: " + err.message);
    return false;
  }
}

// AGGIORNA PROFILO
async function salvaProfilo(e) {
  e.preventDefault();
  
  const nuovoProfilo = {
    eta: parseInt(document.getElementById('eta').value),
    sesso: document.getElementById('sesso').value,
    altezza_cm: parseFloat(document.getElementById('altezza').value),
    peso_kg: parseFloat(document.getElementById('peso').value),
    livello_attivita: parseFloat(document.getElementById('attivita').value),
    obiettivo: document.getElementById('obiettivo').value
  };

  utenteData.profilo = nuovoProfilo;
  const oggi = new Date().toISOString().split('T')[0];
  if (!utenteData.progressi) utenteData.progressi = [];
  utenteData.progressi.push({ data: oggi, peso_kg: nuovoProfilo.peso_kg, note: "Aggiornamento profilo" });

  calcolaTargetNutrizionali(nuovoProfilo);

  const ok = await salvaFileSuGitHub('data/utente_data.json', utenteData, 'Aggiornamento profilo utente');
  if (ok) alert("Profilo e calorie salvati su GitHub!");
}

// AGGIUNGI ALIMENTO
async function aggiungiAlimento(e) {
  e.preventDefault();

  const prot = parseFloat(document.getElementById('foodProt').value) || 0;
  const carbo = parseFloat(document.getElementById('foodCarbo').value) || 0;
  const grassi = parseFloat(document.getElementById('foodGrassi').value) || 0;
  const kcal = Math.round((prot * 4) + (carbo * 4) + (grassi * 9));

  const nuovoAlimento = {
    id: "cibo_" + Date.now(),
    nome: document.getElementById('foodNome').value,
    categoria: document.getElementById('foodCat').value || "Generico",
    unita: "g",
    calorie_100g: kcal,
    proteine_100g: prot,
    carboidrati_100g: carbo,
    grassi_100g: grassi
  };

  alimentiData.push(nuovoAlimento);

  const ok = await salvaFileSuGitHub('data/alimenti.json', alimentiData, `Aggiunto alimento: ${nuovoAlimento.nome}`);
  if (ok) {
    alert(`Alimento "${nuovoAlimento.nome}" salvato su GitHub!`);
    document.getElementById('foodForm').reset();
  }
}

// --- ALGORITMO PER LA GENERAZIONE AUTOMATICA DEL PIANO ALIMENTARE ---
async function generaPianoAlimentare() {
  if (!utenteData || !utenteData.profilo) {
    alert("Compila e salva prima il tuo profilo!");
    return;
  }
  if (alimentiData.length === 0) {
    alert("Il database alimenti è vuoto. Aggiungi prima dei cibi!");
    return;
  }

  const target = calcolaTargetNutrizionali(utenteData.profilo);

  // Suddivisione Calorie nei pasti: Colazione (20%), Spuntino (10%), Pranzo (35%), Merenda (10%), Cena (25%)
  const ripartizionePasti = [
    { nome: "Colazione", quota: 0.20 },
    { nome: "Spuntino Mattina", quota: 0.10 },
    { nome: "Pranzo", quota: 0.35 },
    { nome: "Spuntino Pomeriggio", quota: 0.10 },
    { nome: "Cena", quota: 0.25 }
  ];

  const pianoGenerato = {
    data_creazione: new Date().toISOString().split('T')[0],
    target_totale: target,
    pasti: []
  };

  // Seleziona un alimento per ciascuna categoria disponibile
  const cibiProteici = alimentiData.filter(a => a.proteine_100g > 10) || alimentiData;
  const cibiCarbo = alimentiData.filter(a => a.carboidrati_100g > 15) || alimentiData;
  const cibiGrassi = alimentiData.filter(a => a.grassi_100g > 10) || alimentiData;

  ripartizionePasti.forEach(pastoInfo => {
    const kcalPastoTarget = target.targetKcal * pastoInfo.quota;
    
    // Scegli casualmente dalla lista cibi
    const protItem = cibiProteici[Math.floor(Math.random() * cibiProteici.length)] || alimentiData[0];
    const carboItem = cibiCarbo[Math.floor(Math.random() * cibiCarbo.length)] || alimentiData[0];
    
    // Grammature stimate per coprire il target del pasto
    const grammiProt = Math.round((kcalPastoTarget * 0.4) / (protItem.calorie_100g / 100));
    const grammiCarbo = Math.round((kcalPastoTarget * 0.6) / (carboItem.calorie_100g / 100));

    pianoGenerato.pasti.push({
      pasto: pastoInfo.nome,
      target_kcal: Math.round(kcalPastoTarget),
      alimenti: [
        { nome: protItem.nome, grammi: grammiProt, kcal: Math.round((protItem.calorie_100g / 100) * grammiProt) },
        { nome: carboItem.nome, grammi: grammiCarbo, kcal: Math.round((carboItem.calorie_100g / 100) * grammiCarbo) }
      ]
    });
  });

  utenteData.piano_corrente = pianoGenerato;
  mostraPianoInUI(pianoGenerato);

  const ok = await salvaFileSuGitHub('data/utente_data.json', utenteData, 'Generato nuovo piano alimentare');
  if (ok) {
    alert("Nuovo piano alimentare generato e salvato su GitHub!");
  }
}

function mostraPianoInUI(piano) {
  const container = document.getElementById('pianoContainer');
  const listaPasti = document.getElementById('listaPasti');
  listaPasti.innerHTML = '';

  piano.pasti.forEach(p => {
    const card = document.createElement('div');
    card.className = "bg-slate-900/70 p-3 rounded-xl border border-slate-700/50 space-y-2";
    
    let htmlAlimenti = p.alimenti.map(a => 
      `<li class="flex justify-between text-xs text-slate-300">
        <span>• ${a.nome}</span>
        <span class="font-semibold text-emerald-400">${a.grammi}g (${a.kcal} kcal)</span>
      </li>`
    ).join('');

    card.innerHTML = `
      <div class="flex justify-between items-center border-b border-slate-800 pb-1">
        <span class="font-bold text-sm text-slate-200">${p.pasto}</span>
        <span class="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">~${p.target_kcal} kcal</span>
      </div>
      <ul class="space-y-1 mt-1">${htmlAlimenti}</ul>
    `;
    listaPasti.appendChild(card);
  });

  container.classList.remove('hidden');
}
