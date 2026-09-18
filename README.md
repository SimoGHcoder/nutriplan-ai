# 🍏 NutriPlan AI

**NutriPlan AI** è una Progressive Web App (PWA) moderna, leggera e totalmente client-side per la gestione del profilo nutrizionale, il calcolo del fabbisogno calorico (Mifflin-St Jeor e Katch-McArdle), la gestione di un database alimenti con ricerca online integrata (tramite *Open Food Facts*) e la generazione automatica di piani alimentari giornalieri.

Il punto di forza di questa applicazione è la **totale assenza di un database backend tradizionale**: tutti i dati dell'utente (profilo, storico, piani) e il catalogo degli alimenti vengono salvati direttamente all'interno di un repository **GitHub privato o pubblico** di proprietà dell'utente, sfruttando le GitHub REST API.

---

## 🚀 Come usare questa repository come Template

Se vuoi creare la tua istanza personale di NutriPlan AI:

1. Clicca sul pulsante **"Use this template"** in alto a destra su questa pagina GitHub per creare una nuova repository basata su questo progetto.
2. Clona la tua nuova repository sul tuo computer o attaccala direttamente a un servizio di hosting statico (es. **GitHub Pages**, Vercel o Netlify).
3. Assicurati che all'interno della cartella `data/` siano presenti i file di esempio:
   * `data/alimenti.json` (database iniziale degli alimenti)
   * `data/utente_default.json` (profilo utente iniziale)

---

## ⚙️ Configurazione Iniziale

Per permettere all'applicazione di leggere e scrivere i file di configurazione su GitHub, devi generare un **Personal Access Token (PAT)** di GitHub:

1. Vai su GitHub -> **Settings** -> **Developer settings** -> **Personal access tokens** -> **Tokens (classic)**.
2. Genera un nuovo token con lo scope permessi **`repo`** (Full control of private repositories).
3. Apri la web app nel tuo browser, clicca sull'icona delle **Impostazioni (⚙️)** in alto e inserisci:
   * Il tuo **Token GitHub**
   * Il tuo **Username GitHub**
   * Il nome del **Repository** (es. `nutriplan-ai`)
   * L'ID del profilo (es. `default` o il tuo nome, che caricherà/salverà il file `data/utente_tuonome.json`).

---

## 📂 Struttura del Progetto

```text
nutriplan-ai/
├── index.html                  # Interfaccia principale (UI con Tailwind CSS)
├── manifest.json               # Configurazione PWA
├── sw.js                       # Service Worker per la cache offline
├── css/
│   └── style.css               # Stili personalizzati / Tailwind
├── js/
│   ├── main.js                 # Entry point dell'applicazione
│   ├── config.js               # Gestione configurazione e localStorage
│   ├── api/
│   │   └── github.js           # Servizio di comunicazione REST con GitHub
│   ├── modules/
│   │   ├── fabbisogno.js       # Calcolo BMR, TDEE e Macronutrienti
│   │   └── alimenti.js         # Logica di generazione dei piani alimentari
│   └── ui/
│       ├── navigation.js       # Gestione tab e modale impostazioni
│       ├── profiloUI.js        # Rendering e gestione dati utente / BIA
│       └── alimentiUI.js       # Gestione griglia, modali e ricerca Open Food Facts
└── data/
    ├── alimenti.json           # Database centralizzato degli alimenti
    └── utente_default.json     # Profilo utente di default
