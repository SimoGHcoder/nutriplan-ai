'use client';

import { useState } from 'react';
import { salvaAlimento } from '../../lib/services/alimentiService.js';

const CATEGORIE = ['Proteine', 'Carboidrati', 'Grassi', 'Latticini', 'Verdure', 'Frutta', 'Altro'];

export default function ModalAlimento({ item, onClose, onSaved }) {
  // Se item ha _globaleId ma non _utenteId → stiamo personalizzando un globale
  // Se item ha _utenteId → stiamo modificando un alimento utente
  // Se item è null → nuovo alimento
  const isGlobale = item && item._source === 'globale';

  const [form, setForm] = useState({
    nome:              item?.nome             || '',
    categoria:         item?.categoria        || 'Proteine',
    calorie_100g:      item?.calorie_100g     || '',
    proteine_100g:     item?.proteine_100g    || '',
    carboidrati_100g:  item?.carboidrati_100g || '',
    grassi_100g:       item?.grassi_100g      || '',
    unita_misura:      item?.unita_misura     || 'g',
    peso_unita:        item?.peso_unita       || '',
    attivo:            item?.attivo ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Open Food Facts autocomplete
  const [query, setQuery] = useState('');
  const [suggerimenti, setSuggerimenti] = useState([]);
  const [cercando, setCercando] = useState(false);
  let cercaTimeout = null;

  const handleNomeInput = (e) => {
    const val = e.target.value;
    setForm(f => ({ ...f, nome: val }));
    setQuery(val);
    clearTimeout(cercaTimeout);
    if (val.length >= 2) {
      cercaTimeout = setTimeout(() => cercaOnline(val), 350);
    } else {
      setSuggerimenti([]);
    }
  };

  async function cercaOnline(q) {
    setCercando(true);
    try {
      const url = `https://it.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=20`;
      const res = await fetch(url);
      const data = await res.json();

      const prodotti = (data.products || [])
        .filter(p => p.product_name_it || p.product_name)
        .filter(p => {
          const n = (p.product_name_it || p.product_name || '').toLowerCase();
          return !n.includes(' ') || n.split(' ').length <= 4;
        })
        .slice(0, 6)
        .map(p => ({
          nome:             (p.product_name_it || p.product_name || '').trim(),
          calorie_100g:     p.nutriments?.['energy-kcal_100g'] || null,
          proteine_100g:    p.nutriments?.proteins_100g        || null,
          carboidrati_100g: p.nutriments?.carbohydrates_100g   || null,
          grassi_100g:      p.nutriments?.fat_100g             || null,
        }))
        .filter(p => p.nome && p.calorie_100g);

      setSuggerimenti(prodotti);
    } catch {
      setSuggerimenti([]);
    } finally {
      setCercando(false);
    }
  }

  const selezionaSuggerimento = (s) => {
    setForm(f => ({
      ...f,
      nome:             s.nome,
      calorie_100g:     s.calorie_100g     ? Math.round(s.calorie_100g)     : f.calorie_100g,
      proteine_100g:    s.proteine_100g    ? Math.round(s.proteine_100g)    : f.proteine_100g,
      carboidrati_100g: s.carboidrati_100g ? Math.round(s.carboidrati_100g) : f.carboidrati_100g,
      grassi_100g:      s.grassi_100g      ? Math.round(s.grassi_100g)      : f.grassi_100g,
    }));
    setSuggerimenti([]);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    if (!form.nome.trim()) { setError('Il nome è obbligatorio.'); return; }
    setSaving(true);
    setError(null);
    try {
      await salvaAlimento(
        form,
        item?._utenteId || null,
        isGlobale ? item._globaleId : (item?._globaleId || null)
      );
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">
              {!item ? '➕ Nuovo Alimento' : isGlobale ? '✏️ Personalizza Alimento' : '✏️ Modifica Alimento'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          {isGlobale && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-lg p-2.5">
              📌 Stai personalizzando un alimento del database globale. Le modifiche saranno visibili solo a te.
            </div>
          )}

          {/* Nome + autocomplete */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              value={form.nome} onChange={handleNomeInput}
              placeholder="Cerca o scrivi il nome..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            {(suggerimenti.length > 0 || cercando) && (
              <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {cercando && <div className="p-2 text-xs text-gray-400 text-center">⏳ Ricerca...</div>}
                {suggerimenti.map((s, i) => (
                  <button key={i} onClick={() => selezionaSuggerimento(s)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 border-b border-gray-100 last:border-0">
                    <span className="font-medium">{s.nome}</span>
                    {s.calorie_100g && <span className="text-xs text-gray-400 ml-2">{s.calorie_100g} kcal/100g</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select name="categoria" value={form.categoria} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
              {CATEGORIE.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Valori nutrizionali */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Valori per 100g</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'calorie_100g',     label: 'Calorie (kcal)', placeholder: '110' },
                { name: 'proteine_100g',    label: 'Proteine (g)',   placeholder: '23' },
                { name: 'carboidrati_100g', label: 'Carboidrati (g)', placeholder: '0' },
                { name: 'grassi_100g',      label: 'Grassi (g)',     placeholder: '1.2' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                  <input name={f.name} type="number" step="0.1" min="0"
                    value={form[f.name] || ''} onChange={handleChange}
                    placeholder={f.placeholder}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              ))}
            </div>
          </div>

          {/* Attivo */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="attivo" checked={form.attivo} onChange={handleChange}
              className="w-4 h-4 accent-emerald-500" />
            <span className="text-sm text-gray-700">Alimento attivo (incluso nei piani)</span>
          </label>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-2.5">⚠️ {error}</div>}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
              Annulla
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white py-2.5 rounded-xl text-sm font-semibold transition">
              {saving ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
