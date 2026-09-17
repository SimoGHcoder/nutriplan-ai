# 🥗 PWA Nutrizionista

https://simoghcoder.github.io/pwa-nutrizionista/

Una Progressive Web App (PWA) moderna, leggera e orientata alla privacy per la gestione personalizzata dei piani alimentari, del fabbisogno calorico avanzato e del database degli alimenti, con sincronizzazione diretta su GitHub.

## ✨ Caratteristiche Principali

* **Profilo Avanzato & Parametri BIA:** Calcolo preciso del metabolismo basale (BMR) e del TDEE integrando i dati della bilancia impedenziometrica (Percentuale di grasso corporeo, Massa magra/muscolare, Grasso viscerale).
* **Formula Katch-McArdle:** Attivazione automatica della formula basata sulla massa magra quando viene inserita la percentuale di grasso corporeo, per una precisione millimetrica.
* **Database Alimenti & Categorie:** Gestione completa degli alimenti suddivisi per macro-categorie con ricerca in tempo reale.
* **Piani Alimentari Personalizzati:** Generazione e visualizzazione del piano calorico/nutrizionale mirato in base agli obiettivi (dimagrimento, mantenimento o massa).
* **Multi-Profilo Cloud (GitHub Sync):** Condividi lo stesso token e database alimenti su GitHub, salvando i dati di ogni utente su file dedicati (es. `data/utente_simone.json`).
* **Offline-First / PWA:** Installabile su smartphone e PC, progettata per funzionare in modo reattivo.

---

## 🚀 Configurazione e Utilizzo

1. Apri l'applicazione nel browser.
2. Clicca sull'icona delle impostazioni (**⚙️**) in alto a destra.
3. Inserisci le tue credenziali GitHub:
   * **Personal Access Token** (con permessi di lettura/scrittura sui contenuti del repo).
   * **Username GitHub** e **Nome Repository**.
   * **ID Profilo** (es. `simone` o `laura`), che determinerà il file sul cloud (`data/utente_simone.json`).
4. Clicca su **Salva e Sincronizza**: l'app caricherà immediatamente i tuoi dati salvati sul cloud!

---

## 🛠️ Struttura del Progetto

```text
├── index.html              # Interfaccia principale e modali
├── manifest.json           # Manifest PWA
├── data/
│   ├── alimenti.json       # Database alimenti condiviso
│   └── utente_[id].json    # File profilo e piano specifico per utente
└── js/
    ├── main.js             # Entry point e coordinamento eventi
    ├── services/
    │   └── githubService.js # Comunicazione con le API di GitHub
    └── ui/
        ├── navigation.js   # Gestione tab e modali
        └── profiloUI.js    # Form profilo, logica BIA e formule BMR
