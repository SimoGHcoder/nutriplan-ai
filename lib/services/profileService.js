// lib/services/profileService.js
// CRUD profilo utente su Supabase

import { createClient } from '../supabase/client.js';

/**
 * Carica il profilo dell'utente corrente.
 * @returns {Object|null} dati profilo o null
 */
export async function caricaProfilo() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.warn('Errore caricamento profilo:', error.message);
    return null;
  }
  return data;
}

/**
 * Salva (upsert) il profilo dell'utente corrente.
 * @param {Object} datiProfilo - campi del profilo da salvare
 * @returns {Object|null} profilo salvato o null in caso di errore
 */
export async function salvaProfilo(datiProfilo) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Utente non autenticato.');

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      { id: user.id, ...datiProfilo, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Errore salvataggio profilo:', error.message);
    throw new Error(error.message);
  }
  return data;
}
