// lib/services/alimentiService.js
// Gestione alimenti ibridi: globali (condivisi) + personalizzazioni utente

import { createClient } from '../supabase/client.js';

/**
 * Carica la lista alimenti unificata per l'utente:
 * 1. Alimenti globali (base di tutti)
 * 2. Sostituzione con override utente (stessa alimento_globale_id)
 * 3. Aggiunta alimenti privati dell'utente (alimento_globale_id = null)
 *
 * Ogni item nel risultato ha:
 *   - _source: 'globale' | 'utente'
 *   - _utenteId: uuid dell'entry in alimenti_utente (se esiste), null altrimenti
 *
 * @returns {Array} lista alimenti unificata
 */
export async function caricaAlimenti() {
  const supabase = createClient();

  const [{ data: globali, error: errG }, { data: utente, error: errU }] = await Promise.all([
    supabase.from('alimenti_globali').select('*').order('categoria').order('nome'),
    supabase.from('alimenti_utente').select('*').order('created_at'),
  ]);

  if (errG) console.warn('Errore caricamento alimenti globali:', errG.message);
  if (errU) console.warn('Errore caricamento alimenti utente:', errU.message);

  const globaliList = globali || [];
  const utenteList  = utente  || [];

  // Mappa override: alimento_globale_id → entry utente
  const overrideMap = {};
  const aggiunte = [];

  utenteList.forEach(a => {
    if (a.alimento_globale_id) {
      overrideMap[a.alimento_globale_id] = a;
    } else {
      aggiunte.push(a);
    }
  });

  // Costruisci lista finale
  const lista = globaliList.map(g => {
    const override = overrideMap[g.id];
    if (override) {
      // L'utente ha personalizzato questo alimento globale
      return {
        ...override,
        _source: 'utente',
        _utenteId: override.id,
        _globaleId: g.id,
      };
    }
    return {
      ...g,
      _source: 'globale',
      _utenteId: null,
      _globaleId: g.id,
    };
  });

  // Aggiungi le aggiunte pure dell'utente
  aggiunte.forEach(a => {
    lista.push({
      ...a,
      _source: 'utente',
      _utenteId: a.id,
      _globaleId: null,
    });
  });

  return lista;
}

/**
 * Crea o aggiorna un alimento.
 * Se globaleId è presente: crea/aggiorna un override in alimenti_utente.
 * Se globaleId è null: crea/aggiorna un alimento privato in alimenti_utente.
 *
 * @param {Object} alimento - dati alimento
 * @param {string|null} utenteId - id esistente in alimenti_utente (null = nuovo)
 * @param {string|null} globaleId - id dell'alimento globale da sovrascrivere
 */
export async function salvaAlimento(alimento, utenteId = null, globaleId = null) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Utente non autenticato.');

  const payload = {
    user_id:              user.id,
    alimento_globale_id:  globaleId,
    nome:                 alimento.nome,
    categoria:            alimento.categoria,
    calorie_100g:         alimento.calorie_100g,
    proteine_100g:        alimento.proteine_100g,
    carboidrati_100g:     alimento.carboidrati_100g,
    grassi_100g:          alimento.grassi_100g,
    unita_misura:         alimento.unita_misura || 'g',
    peso_unita:           alimento.peso_unita || null,
    attivo:               alimento.attivo ?? true,
  };

  let query;
  if (utenteId) {
    query = supabase
      .from('alimenti_utente')
      .update(payload)
      .eq('id', utenteId)
      .select()
      .single();
  } else {
    query = supabase
      .from('alimenti_utente')
      .insert(payload)
      .select()
      .single();
  }

  const { data, error } = await query;
  if (error) {
    console.error('Errore salvataggio alimento:', error.message);
    throw new Error(error.message);
  }
  return data;
}

/**
 * Attiva/disattiva un alimento.
 * Se è globale e non ha ancora un override: crea un override con attivo=!stato.
 *
 * @param {Object} item - item dalla lista unificata (con _source, _utenteId, _globaleId)
 * @param {boolean} nuovoStato
 */
export async function toggleAlimento(item, nuovoStato) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Utente non autenticato.');

  if (item._utenteId) {
    // Aggiorna l'entry utente esistente
    const { error } = await supabase
      .from('alimenti_utente')
      .update({ attivo: nuovoStato })
      .eq('id', item._utenteId);

    if (error) throw new Error(error.message);
  } else {
    // Alimento globale senza override: crea un override minimale
    const payload = {
      user_id:              user.id,
      alimento_globale_id:  item._globaleId,
      nome:                 item.nome,
      categoria:            item.categoria,
      calorie_100g:         item.calorie_100g,
      proteine_100g:        item.proteine_100g,
      carboidrati_100g:     item.carboidrati_100g,
      grassi_100g:          item.grassi_100g,
      unita_misura:         item.unita_misura || 'g',
      peso_unita:           item.peso_unita || null,
      attivo:               nuovoStato,
    };

    const { error } = await supabase.from('alimenti_utente').insert(payload);
    if (error) throw new Error(error.message);
  }
}

/**
 * Elimina un alimento utente (solo alimenti con _source = 'utente').
 * @param {string} utenteId - id in alimenti_utente
 */
export async function eliminaAlimento(utenteId) {
  const supabase = createClient();
  const { error } = await supabase
    .from('alimenti_utente')
    .delete()
    .eq('id', utenteId);

  if (error) throw new Error(error.message);
}
