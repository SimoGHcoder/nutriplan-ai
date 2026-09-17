================================================================================
          GUIDA DI CONFIGURAZIONE E CODICE SORGENTE - PWA NUTRIZIONISTA
================================================================================

--------------------------------------------------------------------------------
1. CONFIGURAZIONE INIZIALE REPOSITORY GITHUB & TOKEN
--------------------------------------------------------------------------------

FASE A: Creazione del Repository
1. Vai su GitHub -> "New repository".
2. Nome Repository: pwa-nutrizionista (o nome a tua scelta).
3. Visibilità: Pubblico oppure Privato.
4. Seleziona "Add a README file" e fai clic su "Create repository".
5. Vai nelle Impostazioni del Repository (Settings) -> Pages:
   - Source: "Deploy from a branch"
   - Branch: "main" / folder "/ (root)"
   - Salva. Il tuo sito/PWA sarà raggiungibile su: 
     https://<TUO_USERNAME>.github.io/pwa-nutrizionista/

FASE B: Generazione del Fine-Grained Personal Access Token (PAT)
1. Su GitHub, clicca sulla tua foto profilo in alto a destra -> Settings.
2. Scorri in fondo al menu di sinistra -> Developer Settings -> Personal access tokens -> Fine-grained tokens.
3. Clicca su "Generate new token".
4. Compila i campi:
   - Token name: PWA Nutrizionista Token
   - Expiration: Seleziona la durata desiderata (es. 90 giorni o Custom).
   - Repository access: "Only select repositories" -> Seleziona "pwa-nutrizionista".
   - Permissions -> Repository permissions:
     * Contents: "Access: Read and write"
5. Clicca su "Generate token" e COPIA il token generato.
   (Lo inserirai nella schermata delle impostazioni della PWA al primo avvio).


--------------------------------------------------------------------------------
2. STRUTTURA DEI FILE SUL REPOSITORY
--------------------------------------------------------------------------------

pwa-nutrizionista/
│
├── index.html               # Interfaccia Utente e Gestione PWA
├── app.js                   # Logica dell'app, formule BMR/TDEE e sync GitHub API
├── manifest.json            # Configurazione PWA per l'installazione su dispositivi
├── sw.js                    # Service Worker per caching e supporto offline
│
└── data/
    ├── alimenti.json        # Database cibi e macronutrienti
    └── utente_data.json     # Profilo, storico pesate e piano nutrizionale


--------------------------------------------------------------------------------
3. STRUTTURA DEI DATI (JSON)
--------------------------------------------------------------------------------

--- FILE: data/alimenti.json ---
[
  {
    "id": "cibo_001",
    "nome": "Petto di Pollo (crudo)",
    "categoria": "Proteine",
    "unita": "g",
    "calorie_100g": 110,
    "proteine_100g": 23.0,
    "carboidrati_100g": 0.0,
    "grassi_100g": 1.2
  },
  {
    "id": "cibo_002",
    "nome": "Riso Basmati (crudo)",
    "categoria": "Carboidrati",
    "unita": "g",
    "calorie_100g": 350,
    "proteine_100g": 7.0,
    "carboidrati_100g": 78.0,
    "grassi_100g": 0.8
  },
  {
    "id": "cibo_003",
    "nome": "Olio Extravergine d'Oliva",
    "categoria": "Grassi",
    "unita": "g",
    "calorie_100g": 884,
    "proteine_100g": 0.0,
    "carboidrati_100g": 0.0,
    "grassi_100g": 100.0
  }
]


--- FILE: data/utente_data.json ---
{
  "profilo": {
    "eta": 28,
    "sesso": "m",
    "altezza_cm": 178,
    "peso_kg": 75.0,
    "livello_attivita": 1.375,
    "obiettivo": "mantenimento"
  },
  "progressi": [
    {
      "data": "2026-09-17",
      "peso_kg": 75.0,
      "note": "Inizio percorso"
    }
  ],
  "piano_corrente": null
}


--------------------------------------------------------------------------------
4. MANIFEST.JSON E SERVICE WORKER (SW.JS)
--------------------------------------------------------------------------------

--- FILE: manifest.json ---
{
  "short_name": "NutriPWA",
  "name": "Nutrizionista PWA",
  "icons": [
    {
      "src": "https://cdn-icons-png.flaticon.com/512/3059/3059997.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": "./index.html",
  "background_color": "#0f172a",
  "theme_color": "#10b981",
  "display": "standalone",
  "orientation": "portrait"
}


--- FILE: sw.js ---
const CACHE_NAME = 'nutri-pwa-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './data/alimenti.json',
  './data/utente_data.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  // Bypassa la cache per le chiamate API dirette a GitHub
  if (event.request.url.includes('api.github.com')) {
    return event.respondWith(fetch(event.request));
  }
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});


--------------------------------------------------------------------------------
5. INTERFACCIA UTENTE (INDEX.HTML)
--------------------------------------------------------------------------------

--- FILE: index.html ---
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Piano Nutrizionale PWA</title>
  <link rel="manifest" href="manifest.json">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen pb-12 font-sans">

  <header class="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-50">
    <div class="max-w-2xl mx-auto flex justify-between items-center">
      <h1 class="text-xl font-bold text-emerald-400">🥗 NutriPWA</h1>
      <button onclick="toggleConfigModal()" class="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg border border-slate-600">
        ⚙️ Impostazioni API
      </button>
    </div>
  </header>

  <main class="max-w-2xl mx-auto p-4 space-y-6">

    <!-- DASHBOARD CALCOLI NUTRIZIONALI -->
    <section class="bg-slate-800 p-5 rounded-2xl border border-slate-700">
      <h2 class="text-lg font-semibold text-slate-200 mb-4">Profilo Nutrizionale</h2>
      
      <form id="profileForm" onsubmit="salvaProfilo(event)" class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <label class="block text-slate-400 mb-1">Età</label>
          <input type="number" id="eta" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" required>
        </div>
        <div>
          <label class="block text-slate-400 mb-1">Sesso</label>
          <select id="sesso" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white">
            <option value="m">Maschio</option>
            <option value="f">Femmina</option>
          </select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1">Altezza (cm)</label>
          <input type="number" id="altezza" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" required>
        </div>
        <div>
          <label class="block text-slate-400 mb-1">Peso (kg)</label>
          <input type="number" step="0.1" id="peso" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" required>
        </div>
        <div class="col-span-2">
          <label class="block text-slate-400 mb-1">Livello Attività</label>
          <select id="attivita" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white">
            <option value="1.2">Sedentario (Poco o nessun esercizio)</option>
            <option value="1.375">Leggermente attivo (1-3 gg/settimana)</option>
            <option value="1.55">Moderatamente attivo (3-5 gg/settimana)</option>
            <option value="1.725">Molto attivo (6-7 gg/settimana)</option>
          </select>
        </div>
        <div class="col-span-2">
          <label class="block text-slate-400 mb-1">Obiettivo</label>
          <select id="obiettivo" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white">
            <option value="ipocalorica">Dimagrimento (-15% kcal)</option>
            <option value="mantenimento">Mantenimento</option>
            <option value="ipercalorica">Massa Muscolare (+15% kcal)</option>
          </select>
        </div>
        <button type="submit" class="col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg mt-2 transition">
          Calcola e Salva Su GitHub
        </button>
      </form>

      <!-- RISULTATI BMR E MACRO -->
      <div id="risultatiNutri" class="mt-6 pt-4 border-t border-slate-700 grid grid-cols-3 gap-2 text-center hidden">
        <div class="bg-slate-900/50 p-2 rounded-lg">
          <span class="text-xs text-slate-400 block">BMR</span>
          <span id="resBMR" class="font-bold text-emerald-400">0</span> <span class="text-xs">kcal</span>
        </div>
        <div class="bg-slate-900/50 p-2 rounded-lg">
          <span class="text-xs text-slate-400 block">TDEE</span>
          <span id="resTDEE" class="font-bold text-emerald-400">0</span> <span class="text-xs">kcal</span>
        </div>
        <div class="bg-slate-900/50 p-2 rounded-lg">
          <span class="text-xs text-slate-400 block">Target Kcal</span>
          <span id="resTarget" class="font-bold text-emerald-400">0</span> <span class="text-xs">kcal</span>
        </div>
      </div>
    </section>

    <!-- AGGIUNTA ALIMENTO SU GITHUB DATABASE -->
    <section class="bg-slate-800 p-5 rounded-2xl border border-slate-700">
      <h2 class="text-lg font-semibold text-slate-200 mb-4">Aggiungi Alimento al DB</h2>
      <form id="foodForm" onsubmit="aggiungiAlimento(event)" class="space-y-3 text-sm">
        <div>
          <label class="block text-slate-400 mb-1">Nome Alimento</label>
          <input type="text" id="foodNome" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" required>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block text-slate-400 mb-1">Proteine / 100g</label>
            <input type="number" step="0.1" id="foodProt" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" required>
          </div>
          <div>
            <label class="block text-slate-400 mb-1">Carbo / 100g</label>
            <input type="number" step="0.1" id="foodCarbo" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" required>
          </div>
          <div>
            <label class="block text-slate-400 mb-1">Grassi / 100g</label>
            <input type="number" step="0.1" id="foodGrassi" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" required>
          </div>
        </div>
        <button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg transition">
          Sincronizza Alimento su GitHub
        </button>
      </form>
    </section>

  </main>

  <!-- MODALE CONFIGURAZIONE CREDENZIALI GITHUB -->
  <div id="configModal" class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 hidden">
    <div class="bg-slate-800 p-6 rounded-2xl max-w-md w-full border border-slate-700 space-y-4">
      <h3 class="text-lg font-bold text-white">Configurazione GitHub API</h3>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Username GitHub</label>
        <input type="text" id="ghUsername" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm">
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Nome Repository</label>
        <input type="text" id="ghRepo" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm" value="pwa-nutrizionista">
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Personal Access Token (PAT)</label>
        <input type="password" id="ghToken" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm">
      </div>
      <div class="flex justify-end space-x-2">
        <button onclick="toggleConfigModal()" class="px-4 py-2 bg-slate-700 rounded-lg text-sm">Annulla</button>
        <button onclick="salvaConfigurazioneGH()" class="px-4 py-2 bg-emerald-600 rounded-lg text-sm text-white">Salva Token</button>
      </div>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>


--------------------------------------------------------------------------------
6. LOGICA LOGICA ED API REST (APP.JS)
--------------------------------------------------------------------------------

--- FILE: app.js ---
// Registrazione Service Worker per PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(() => console.log("Service Worker Registrato"))
    .catch((err) => console.error("Errore SW:", err));
}

// Inizializzazione dati locali
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

// CARICAMENTO INIZIALE DATI DA GITHUB
async function inizializzaDati() {
  try {
    const resUtente = await fetch('data/utente_data.json');
    utenteData = await resUtente.json();
    
    const resAlimenti = await fetch('data/alimenti.json');
    alimentiData = await resAlimenti.json();

    popolaFormProfilo();
  } catch (err) {
    console.log("In attesa di configurazione dati...", err);
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

  calcolaEmostraCalorie(p);
}

// FORMULA DI MIFFLIN-ST JEOR PER BMR E TDEE
function calcolaEmostraCalorie(profilo) {
  let bmr = (10 * profilo.peso_kg) + (6.25 * profilo.altezza_cm) - (5 * profilo.eta);
  bmr = profilo.sesso === 'm' ? bmr + 5 : bmr - 161;

  const tdee = Math.round(bmr * profilo.livello_attivita);
  let target = tdee;

  if (profilo.obiettivo === 'ipocalorica') target = Math.round(tdee * 0.85);
  if (profilo.obiettivo === 'ipercalorica') target = Math.round(tdee * 1.15);

  document.getElementById('resBMR').textContent = Math.round(bmr);
  document.getElementById('resTDEE').textContent = tdee;
  document.getElementById('resTarget').textContent = target;
  document.getElementById('risultatiNutri').classList.remove('hidden');

  return { bmr, tdee, target };
}

// FUNZIONE CENTRALE PER COMMIT AUTOMATICO SU GITHUB
async function salvaFileSuGitHub(pathFile, nuovoOggettoContenuto, commitMessage) {
  if (!configGH.username || !configGH.token) {
    alert("Configura prima lo Username e il Personal Access Token nelle Impostazioni!");
    toggleConfigModal();
    return false;
  }

  const url = `https://api.github.com/repos/${configGH.username}/${configGH.repo}/contents/${pathFile}`;

  try {
    // 1. Recupera SHA del file esistente
    const getRes = await fetch(url, {
      headers: { 'Authorization': `token ${configGH.token}` }
    });
    const fileMetaData = await getRes.json();
    const sha = fileMetaData.sha;

    // 2. Prepara contenuto Base64
    const stringaJSON = JSON.stringify(nuovoOggettoContenuto, null, 2);
    const contentBase64 = btoa(unescape(encodeURIComponent(stringaJSON)));

    // 3. Esegui PUT commit
    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${configGH.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: commitMessage,
        content: contentBase64,
        sha: sha
      })
    });

    if (putRes.ok) {
      alert("Sincronizzazione GitHub completata!");
      return true;
    } else {
      const errorData = await putRes.json();
      alert("Errore GitHub API: " + errorData.message);
      return false;
    }
  } catch (err) {
    alert("Errore durante la sincronizzazione: " + err.message);
    return false;
  }
}

// SALVATAGGIO PROFILO
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
  
  // Registra storico peso
  const oggi = new Date().toISOString().split('T')[0];
  utenteData.progressi.push({ data: oggi, peso_kg: nuovoProfilo.peso_kg, note: "Aggiornamento profilo" });

  calcolaEmostraCalorie(nuovoProfilo);

  await salvaFileSuGitHub('data/utente_data.json', utenteData, 'Aggiornamento profilo utente da PWA');
}

// AGGIUNTA ALIMENTO
async function aggiungiAlimento(e) {
  e.preventDefault();

  const prot = parseFloat(document.getElementById('foodProt').value);
  const carbo = parseFloat(document.getElementById('foodCarbo').value);
  const grassi = parseFloat(document.getElementById('foodGrassi').value);
  const kcal = Math.round((prot * 4) + (carbo * 4) + (grassi * 9));

  const nuovoAlimento = {
    id: "cibo_" + Date.now(),
    nome: document.getElementById('foodNome').value,
    categoria: "Personalizzato",
    unita: "g",
    calorie_100g: kcal,
    proteine_100g: prot,
    carboidrati_100g: carbo,
    grassi_100g: grassi
  };

  alimentiData.push(nuovoAlimento);

  const successo = await salvaFileSuGitHub('data/alimenti.json', alimentiData, `Aggiunto alimento ${nuovoAlimento.nome}`);
  if (successo) {
    document.getElementById('foodForm').reset();
  }
}
