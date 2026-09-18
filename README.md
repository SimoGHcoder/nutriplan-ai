# 🥗 NutriPlan AI

**NutriPlan AI** è una web app per la gestione del profilo nutrizionale, il calcolo del fabbisogno calorico (Mifflin-St Jeor e Katch-McArdle) e la generazione automatica di piani alimentari giornalieri personalizzati.

## Stack Tecnologico

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Auth + Database**: [Supabase](https://supabase.com/) (PostgreSQL + Google OAuth)
- **Hosting**: [Vercel](https://vercel.com/)
- **CSS**: [Tailwind CSS](https://tailwindcss.com/)

## Funzionalità

- 🔐 Login con Google (Supabase Auth)
- 👤 Profilo nutrizionale personale (BMR/TDEE con Mifflin-St Jeor o Katch-McArdle)
- 🥦 Database alimenti ibrido (globale + personalizzazioni per utente)
- 🔍 Ricerca alimenti online via Open Food Facts
- 📋 Generazione piani alimentari giornalieri automatici
- 🔢 Versioning automatico visibile nell'header

---

## Setup Locale

### 1. Clona e installa

```bash
git clone <repo-url>
cd nutriplan-ai
npm install
```

### 2. Configura Supabase

1. Crea un progetto su [supabase.com](https://supabase.com)
2. Vai su **SQL Editor** ed esegui il file `supabase/migrations/001_initial.sql`
3. Abilitare Google OAuth: **Authentication → Providers → Google** (richiede Google Cloud project)
4. In **Authentication → URL Configuration** aggiungi:
   - Site URL: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/auth/callback`

### 3. Variabili d'ambiente

```bash
cp .env.example .env.local
# Modifica .env.local con i tuoi valori Supabase (Settings → API)
```

### 4. Seed alimenti globali (opzionale)

Esegui lo script seed per popolare il database di alimenti base:

```bash
# Nel SQL Editor di Supabase, inserisci gli alimenti da public/seed/alimenti_globali.json
```

### 5. Avvia in locale

```bash
npm run dev
# → http://localhost:3000
```

---

## Deploy su Vercel

1. Push del repo su GitHub
2. Connetti il repo su [vercel.com](https://vercel.com)
3. In **Settings → Environment Variables** aggiungi:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. In Supabase, aggiungi l'URL Vercel a **Authentication → URL Configuration**
5. Deploy automatico ad ogni push 🚀

---

## Versioning

La versione dell'app è gestita da `package.json` ed è visibile nell'header.

```bash
npm version patch   # bug fix:    1.0.0 → 1.0.1
npm version minor   # nuova feat: 1.0.0 → 1.1.0
npm version major   # breaking:   1.0.0 → 2.0.0
git push            # Vercel deploya automaticamente
```

---

## Struttura Progetto

```
nutriplan-ai/
├── app/                      # Next.js App Router
│   ├── auth/callback/        # OAuth callback
│   ├── login/                # Pagina login Google
│   └── dashboard/            # Area protetta (profilo, alimenti, piano)
├── components/               # Componenti React
│   ├── layout/Header.js      # Header con versione + navigazione
│   ├── profilo/              # Form profilo + calcolo fabbisogno
│   ├── alimenti/             # Griglia alimenti + modale
│   └── piano/                # Vista piano giornaliero
├── lib/
│   ├── supabase/             # Client Supabase (browser + server)
│   ├── services/             # profileService, alimentiService, pianiService
│   └── modules/              # Logica calcolo (fabbisogno, generazione piano)
├── supabase/
│   └── migrations/           # Schema SQL
└── public/
    └── seed/                 # Dati seed alimenti globali
```

---

## Note per gli Aggiornamenti

- **Aggiornamenti app**: modificare codice + `npm version` + push
- **Nuovi alimenti globali**: inserire in `alimenti_globali` via SQL (non tocca mai `alimenti_utente`)
- **Personalizzazioni utente**: gestite separatamente in `alimenti_utente` — mai modificate dagli aggiornamenti
