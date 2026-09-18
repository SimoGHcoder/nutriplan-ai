-- NutriPlan AI - Schema iniziale Supabase
-- Migrazione: 001_initial.sql

-- ============================================================
-- 1. PROFILI UTENTE
-- Creato automaticamente al primo login tramite trigger
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id                uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  nome              text,
  eta               integer,
  sesso             char(1),
  altezza_cm        numeric,
  peso_kg           numeric,
  grasso_perc       numeric,
  muscolo_kg        numeric,
  grasso_viscerale  integer,
  acqua_perc        numeric,
  livello_attivita  text DEFAULT 'sedentario',
  obiettivo         text DEFAULT 'mantenimento',
  updated_at        timestamptz DEFAULT now()
);

-- ============================================================
-- 2. ALIMENTI GLOBALI
-- Gestiti da noi. Gli utenti non li modificano direttamente.
-- Aggiornamenti futuri: solo INSERT/UPDATE su questa tabella.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.alimenti_globali (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome                text NOT NULL,
  categoria           text,
  calorie_100g        numeric,
  proteine_100g       numeric,
  carboidrati_100g    numeric,
  grassi_100g         numeric,
  unita_misura        text DEFAULT 'g',
  peso_unita          numeric,
  attivo              boolean DEFAULT true,
  created_at          timestamptz DEFAULT now()
);

-- ============================================================
-- 3. ALIMENTI UTENTE
-- Personalizzazioni e aggiunte private per ogni utente.
-- MAI toccate dagli aggiornamenti dell'app.
-- Se alimento_globale_id IS NOT NULL: è una sostituzione del globale.
-- Se alimento_globale_id IS NULL: è un'aggiunta pura dell'utente.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.alimenti_utente (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  alimento_globale_id   uuid REFERENCES public.alimenti_globali ON DELETE SET NULL,
  nome                  text NOT NULL,
  categoria             text,
  calorie_100g          numeric,
  proteine_100g         numeric,
  carboidrati_100g      numeric,
  grassi_100g           numeric,
  unita_misura          text DEFAULT 'g',
  peso_unita            numeric,
  attivo                boolean DEFAULT true,
  created_at            timestamptz DEFAULT now()
);

-- ============================================================
-- 4. PIANI ALIMENTARI
-- Storico dei piani generati per ogni utente.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.piani_alimentari (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  data_creazione  date DEFAULT current_date,
  target_kcal     integer,
  target_proteine integer,
  target_carbo    integer,
  target_grassi   integer,
  pasti           jsonb NOT NULL DEFAULT '[]',
  created_at      timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alimenti_globali ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alimenti_utente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piani_alimentari ENABLE ROW LEVEL SECURITY;

-- Profiles: ogni utente gestisce solo il proprio
CREATE POLICY "Profilo: lettura propria" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Profilo: modifica propria" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Alimenti globali: lettura per tutti gli utenti autenticati, scrittura solo service_role
CREATE POLICY "Globali: lettura autenticati" ON public.alimenti_globali
  FOR SELECT USING (auth.role() = 'authenticated');

-- Alimenti utente: ogni utente gestisce solo i propri
CREATE POLICY "Utente alimenti: tutti propri" ON public.alimenti_utente
  FOR ALL USING (auth.uid() = user_id);

-- Piani alimentari: ogni utente gestisce solo i propri
CREATE POLICY "Piani: tutti propri" ON public.piani_alimentari
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: crea profilo automaticamente al primo login
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
