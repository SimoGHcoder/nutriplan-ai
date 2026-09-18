// lib/services/pianiService.js
// CRUD piani alimentari su Supabase

import { createClient } from '../supabase/client.js';

/**
 * Carica gli ultimi N piani alimentari dell'utente.
 * @param {number} limit - numero massimo di piani da caricare (default 10)
 * @returns {Array} lista piani
 */
export async function caricaPiani(limit = 10) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('piani_alimentari')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('Errore caricamento piani:', error.message);
    return [];
  }
  return data || [];
}

/**
 * Salva un nuovo piano alimentare.
 * @param {Object} piano - piano generato da generaStrutturaPiano()
 * @returns {Object} piano salvato con id
 */
export async function salvaPiano(piano) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Utente non autenticato.');

  const { data, error } = await supabase
    .from('piani_alimentari')
    .insert({
      user_id:         user.id,
      data_creazione:  piano.data_creazione || new Date().toISOString().split('T')[0],
      target_kcal:     piano.target_totale?.targetKcal,
      target_proteine: piano.target_totale?.targetProteine,
      target_carbo:    piano.target_totale?.targetCarbo,
      target_grassi:   piano.target_totale?.targetGrassi,
      pasti:           piano.pasti,
    })
    .select()
    .single();

  if (error) {
    console.error('Errore salvataggio piano:', error.message);
    throw new Error(error.message);
  }
  return data;
}

/**
 * Elimina un piano alimentare per id.
 * @param {string} pianoId
 */
export async function eliminaPiano(pianoId) {
  const supabase = createClient();
  const { error } = await supabase
    .from('piani_alimentari')
    .delete()
    .eq('id', pianoId);

  if (error) throw new Error(error.message);
}
