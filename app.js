// STATA DELL'APPLICAZIONE
let configGH = JSON.parse(localStorage.getItem('configGH')) || { username: '', repo: '', token: '' };
let alimentiData = [];
let utenteData = { profilo: {}, progressi: [], piano_corrente: null };

// INIZIALIZZAZIONE
document.addEventListener('DOMContentLoaded', async () => {
  caricaCredenzialiUI();
  await sincronizzaConGitHub();
});

// --- GESTIONE SCHEDE (TAB) ---
function cambiaTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(el => {
    el.classList.remove('text-emerald-400');
    el.classList.add('text-slate-400');
  });

  const targetTab = document.getElementById(`tab-${tabId}`);
  const targetNav = document.getElementById(`nav-${tabId}`);

  if (targetTab) targetTab.classList.remove('hidden');
  if (targetNav) {
    targetNav.classList.remove('text-slate-400');
    targetNav.classList.add('text-emerald-400');
  }
}

// --- CONFIGURAZIONE E SYNC GITHUB ---
function caricaCredenzialiUI() {
  if (configGH.username) document.getElementById('cfg_username').value = configGH.username;
  if (configGH.repo) document.getElementById('cfg_repo').value = configGH.repo;
  if (configGH.token) document.getElementById('cfg_token').value = configGH.token;
}

function salvaConfigurazioneGitHub() {
  configGH = {
    username: document.getElementById('cfg_username').value.trim(),
    repo: document.getElementById('cfg_repo').value.trim(),
    token: document.getElementById('cfg_token').value.trim()
  };
  localStorage.setItem('configGH', JSON.stringify(configGH));
  alert('Credenziali GitHub salvate!');
  sincronizzaConGitHub();
}

async function sincronizzaConGitHub() {
  const syncIcon = document.getElementById('syncIcon');
  if (syncIcon) syncIcon.classList.add('animate-spin');

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

  popolaUIProfilo();
  renderListaAlimenti();
  renderPianoCorrente();

  if (syncIcon) syncIcon.classList.remove('animate-spin');
}

// --- TAB 1: PROFILO & CALCOLO FABBISOGNO ---
function popolaUIProfilo() {
  const p = utenteData.profilo || {};
  if (p.eta) document.getElementById('prof_eta').value = p.eta;
  if (p.sesso) document.getElementById('prof_sesso').value = p.sesso;
  if (p.altezza_cm) document.getElementById('prof_altezza').value = p.altezza_cm;
  if (p.peso_kg) document.getElementById('prof_peso').value = p.peso_kg;
  if (p.livello_attivita) document.getElementById('prof_attivita').value = p.livello_attivita;
  if (p.obiettivo) document.getElementById('prof_obiettivo').value = p.obiettivo;

  calcolaETipostatarget();
}

function calcolaTargetNutrizionali(p) {
  if (!p.peso_kg || !p.altezza_cm || !p.eta) return { targetKcal: 2000, targetProteine: 150, targetCarbo: 200, targetGrassi: 60 };

  // BMR Formula Mifflin-St Jeor
  let bmr = (10 * p.peso_kg) + (6.25 * p.altezza_cm) - (5 * p.eta);
  bmr = p.sesso === 'm' ? bmr + 5 : bmr - 161;

  let tdee = bmr * (p.livello_attivita || 1.375);

  if (p.obiettivo === 'dimagrimento') tdee *= 0.85;
  if (p.obiettivo === 'massa') tdee *= 1.10;

  const targetKcal = Math.round(tdee);
  const proteine = Math.round(p.peso_kg * 2.0); // 2g per kg
  const grassi = Math.round(p.peso_kg * 0.9); // 0.9g per kg
  const kcalRestanti = targetKcal - (proteine * 4 + grassi * 9);
  const carbo = Math.max(0, Math.round(kcalRestanti / 4));

  return { targetKcal, targetProteine: proteine, targetCarbo: carbo, targetGrassi: grassi };
}

function calcolaETipostatarget() {
  const p = {
    eta: parseInt(document.getElementById('prof_eta').value) || 28,
    sesso: document.getElementById('prof_sesso').value || 'm',
    altezza_cm: parseFloat(document.getElementById('prof_altezza').value) || 175,
    peso_kg: parseFloat(document.getElementById('prof_peso').value) || 70,
    livello_attivita: parseFloat(document.getElementById('prof_attivita').value) || 1.375,
    obiettivo: document.getElementById('prof_obiettivo').value || 'mantenimento'
  };

  const res = calcolaTargetNutrizionali(p);
  document.getElementById('targetKcalVal').innerText = res.targetKcal;
  document.getElementById('targetProtVal').innerText = res.targetProteine + 'g';
  document.getElementById('targetCarboVal').innerText = res.targetCarbo + 'g';
  document.getElementById('targetGrassiVal').innerText = res.targetGrassi + 'g';
}

async function salvaProfiloUtente() {
  utenteData.profilo = {
    eta: parseInt(document.getElementById('prof_eta').value) || 28,
    sesso: document.getElementById('prof_sesso').value || 'm',
    altezza_cm: parseFloat(document.getElementById('prof_altezza').value) || 175,
    peso_kg: parseFloat(document.getElementById('prof_peso').value) || 70,
    livello_attivita: parseFloat(document.getElementById('prof_attivita').value) || 1.375,
    obiettivo: document.getElementById('prof_obiettivo').value || 'mantenimento'
  };

  calcolaETipostatarget();

  if (configGH.token) {
    await salvaFileSuGitHub('data/utente_data.json', utenteData, 'Aggiornato profilo utente');
    alert('Profilo salvato correttamente su GitHub!');
  } else {
    alert('Profilo salvato in locale.');
  }
}

// --- TAB 2: DATABASE ALIMENTI ---
function renderListaAlimenti(filtro = '') {
  const container = document.getElementById('listaAlimentiContainer');
  if (!container) return;

  if (!alimentiData || alimentiData.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 text-center py-4">Nessun alimento presente nel database.</p>`;
    return;
  }

  let html = '';
  const cibiFiltrati = alimentiData.filter(a => a.nome.toLowerCase().includes(filtro.toLowerCase()));

  cibiFiltrati.forEach(a => {
    const isAttivo = a.attivo !== false; // Di default attivo se non specificato

    html += `
      <div class="bg-slate-900 border ${isAttivo ? 'border-slate-800' : 'border-red-900/30 opacity-60'} p-3 rounded-xl flex items-center justify-between gap-2">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-white">${a.nome}</span>
            <span class="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">${a.categoria || 'Generico'}</span>
          </div>
          <div class="text-[11px] text-slate-400 mt-1 flex gap-3 font-mono">
            <span>🔥 ${a.calorie_100g} kcal</span>
            <span>P: ${a.proteine_100g}g</span>
            <span>C: ${a.carboidrati_100g}g</span>
            <span>G: ${a.grassi_100g}g</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- TOGGLE ATTIVO / INATTIVO PER IL GENERATORE PIANO -->
          <button onclick="toggleAttivoAlimento('${a.id}')" class="text-xs px-2.5 py-1 rounded-lg border transition-all ${isAttivo ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}">
            ${isAttivo ? 'Attivo' : 'Inattivo'}
          </button>
          
          <button onclick="apriModalAlimento('${a.id}')" class="p-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">✏️</button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function filtraAlimentiUI() {
  const query = document.getElementById('cercaAlimentoInput').value;
  renderListaAlimenti(query);
}

function apriModalAlimento(id = null) {
  document.getElementById('modalAlimento').classList.remove('hidden');
  if (id) {
    const alim = alimentiData.find(a => a.id === id);
    document.getElementById('modalAlimentoTitolo').innerText = '✏️ Modifica Alimento';
    document.getElementById('editAlimentoId').value = alim.id;
    document.getElementById('alim_nome').value = alim.nome;
    document.getElementById('alim_categoria').value = alim.categoria || 'Proteine';
    document.getElementById('alim_kcal').value = alim.calorie_100g;
    document.getElementById('alim_prot').value = alim.proteine_100g;
    document.getElementById('alim_carbo').value = alim.carboidrati_100g;
    document.getElementById('alim_grassi').value = alim.grassi_100g;
  } else {
    document.getElementById('modalAlimentoTitolo').innerText = '➕ Aggiungi Alimento';
    document.getElementById('editAlimentoId').value = '';
    document.getElementById('alim_nome').value = '';
    document.getElementById('alim_kcal').value = '';
    document.getElementById('alim_prot').value = '';
    document.getElementById('alim_carbo').value = '';
    document.getElementById('alim_grassi').value = '';
  }
}

function chiudiModalAlimento() {
  document.getElementById('modalAlimento').classList.add('hidden');
}

async function salvaAlimento() {
  const id = document.getElementById('editAlimentoId').value;
  const nuovo = {
    id: id || 'cibo_' + Date.now(),
    nome: document.getElementById('alim_nome').value.trim(),
    categoria: document.getElementById('alim_categoria').value,
    calorie_100g: parseFloat(document.getElementById('alim_kcal').value) || 0,
    proteine_100g: parseFloat(document.getElementById('alim_prot').value) || 0,
    carboidrati_100g: parseFloat(document.getElementById('alim_carbo').value) || 0,
    grassi_100g: parseFloat(document.getElementById('alim_grassi').value) || 0,
    attivo: true
  };

  if (!nuovo.nome) return alert('Inserisci il nome dell\'alimento');

  if (id) {
    const idx = alimentiData.findIndex(a => a.id === id);
    if (idx !== -1) {
      nuovo.attivo = alimentiData[idx].attivo !== false;
      alimentiData[idx] = nuovo;
    }
  } else {
    alimentiData.push(nuovo);
  }

  chiudiModalAlimento();
  renderListaAlimenti();

  if (configGH.token) {
    await salvaFileSuGitHub('data/alimenti.json', alimentiData, 'Aggiornato database alimenti');
  }
}

async function toggleAttivoAlimento(id) {
  const alim = alimentiData.find(a => a.id === id);
  if (alim) {
    alim.attivo = alim.attivo === false ? true : false;
    renderListaAlimenti();
    if (configGH.token) {
      await salvaFileSuGitHub('data/alimenti.json', alimentiData, `Cambiato stato attivo/inattivo per ${alim.nome}`);
    }
  }
}

// --- TAB 3: GENERAZIONE E VISUALIZZAZIONE PIANI ---
async function generaPianoAlimentare() {
  // Prendi solo i cibi contrassegnati come ATTIVI
  const cibiAttivi = alimentiData.filter(a => a.attivo !== false);

  if (cibiAttivi.length === 0) {
    alert('Nessun alimento attivo disponibile! Attiva qualche alimento dal menu "Alimenti".');
    return;
  }

  const target = calcolaTargetNutrizionali(utenteData.profilo || {});

  const ripartizione = [
    { nome: "Colazione", quota: 0.20 },
    { nome: "Spuntino Mattina", quota: 0.10 },
    { nome: "Pranzo", quota: 0.35 },
    { nome: "Spuntino Pomeriggio", quota: 0.10 },
    { nome: "Cena", quota: 0.25 }
  ];

  const piano = {
    data_creazione: new Date().toISOString().split('T')[0],
    target_totale: target,
    pasti: []
  };

  // Separa cibi per categoria principale
  const fontiProteine = cibiAttivi.filter(c => c.categoria === 'Proteine') || cibiAttivi;
  const fontiCarbo = cibiAttivi.filter(c => c.categoria === 'Carboidrati') || cibiAttivi;

  ripartizione.forEach(pastoInfo => {
    const kcalTargetPasto = target.targetKcal * pastoInfo.quota;

    // Seleziona alimenti a caso tra quelli attivi
    const protItem = fontiProteine[Math.floor(Math.random() * fontiProteine.length)] || cibiAttivi[0];
    const carboItem = fontiCarbo[Math.floor(Math.random() * fontiCarbo.length)] || cibiAttivi[0];

    const gProt = Math.round((kcalTargetPasto * 0.4) / ((protItem.calorie_100g || 100) / 100));
    const gCarbo = Math.round((kcalTargetPasto * 0.6) / ((carboItem.calorie_100g || 100) / 100));

    piano.pasti.push({
      pasto: pastoInfo.nome,
      target_kcal: Math.round(kcalTargetPasto),
      alimenti: [
        { nome: protItem.nome, grammi: gProt, kcal: Math.round((protItem.calorie_100g / 100) * gProt) },
        { nome: carboItem.nome, grammi: gCarbo, kcal: Math.round((carboItem.calorie_100g / 100) * gCarbo) }
      ]
    });
  });

  utenteData.piano_corrente = piano;
  renderPianoCorrente();

  if (configGH.token) {
    await salvaFileSuGitHub('data/utente_data.json', utenteData, 'Generato nuovo piano alimentare');
    alert('Nuovo piano generato e sincronizzato!');
  }
}

function renderPianoCorrente() {
  const container = document.getElementById('pianoCorrenteContainer');
  if (!container) return;

  const piano = utenteData?.piano_corrente;
  if (!piano) {
    container.innerHTML = `<div class="text-center py-8 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">Nessun piano attivo. Clicca su "Genera Nuovo Piano" per crearlo.</div>`;
    return;
  }

  let html = `
    <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
      <div class="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h3 class="text-sm font-bold text-emerald-400">Piano Attivo del ${piano.data_creazione}</h3>
          <p class="text-[11px] text-slate-400">Target giornaliero generato</p>
        </div>
        <span class="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-mono font-bold">
          ${piano.target_totale.targetKcal} kcal
        </span>
      </div>

      <div class="space-y-3">
  `;

  piano.pasti.forEach(p => {
    html += `
      <div class="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
        <div class="flex justify-between items-center text-xs font-semibold text-slate-300 mb-2">
          <span class="text-emerald-400">${p.pasto}</span>
          <span class="text-slate-400 font-mono">${p.target_kcal} kcal</span>
        </div>
        <ul class="text-xs text-slate-300 space-y-1">
    `;
    p.alimenti.forEach(a => {
      html += `<li class="flex justify-between border-b border-slate-900 pb-1">
        <span>• ${a.nome}</span>
        <span class="font-mono text-slate-400">${a.grammi}g <span class="text-[10px] text-slate-500">(${a.kcal} kcal)</span></span>
      </li>`;
    });
    html += `</ul></div>`;
  });

  html += `</div></div>`;
  container.innerHTML = html;
}

// --- FUNZIONI DI CHIAMATA HTTP A GITHUB API ---
async function caricaFileDaGitHub(pathFile) {
  if (!configGH.token || !configGH.username || !configGH.repo) return null;

  const url = `https://api.github.com/repos/${configGH.username}/${configGH.repo}/contents/${pathFile}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `token ${configGH.token}`, 'Accept': 'application/vnd.github.v3+json' },
    cache: 'no-store'
  });

  if (!res.ok) return null;
  const data = await res.json();
  const content = decodeURIComponent(escape(atob(data.content)));
  return JSON.parse(content);
}

async function salvaFileSuGitHub(pathFile, contenuto, commitMessage) {
  if (!configGH.token || !configGH.username || !configGH.repo) return;

  const url = `https://api.github.com/repos/${configGH.username}/${configGH.repo}/contents/${pathFile}`;
  
  let sha = null;
  try {
    const getRes = await fetch(url, {
      headers: { 'Authorization': `token ${configGH.token}` },
      cache: 'no-store'
    });
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }
  } catch (e) {
    console.log('File nuovo, nessun SHA precedente');
  }

  const jsonStr = JSON.stringify(contenuto, null, 2);
  const contentBase64 = btoa(unescape(encodeURIComponent(jsonStr)));

  await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${configGH.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: commitMessage,
      content: contentBase64,
      sha: sha || undefined
    })
  });
}
