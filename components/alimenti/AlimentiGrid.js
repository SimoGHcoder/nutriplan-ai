'use client';

import { useState, useEffect, useCallback } from 'react';
import { caricaAlimenti, toggleAlimento, eliminaAlimento } from '../../lib/services/alimentiService.js';
import ModalAlimento from './ModalAlimento.js';

const BADGE_COLORI = {
  Proteine:     'bg-red-100 text-red-700',
  Carboidrati:  'bg-yellow-100 text-yellow-700',
  Grassi:       'bg-orange-100 text-orange-700',
  Latticini:    'bg-blue-100 text-blue-700',
  Verdure:      'bg-green-100 text-green-700',
  Frutta:       'bg-pink-100 text-pink-700',
  Altro:        'bg-gray-100 text-gray-600',
};

export default function AlimentiGrid() {
  const [alimenti, setAlimenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [modalItem, setModalItem] = useState(undefined); // undefined=chiuso, null=nuovo, obj=modifica

  const ricarica = useCallback(async () => {
    setLoading(true);
    const data = await caricaAlimenti();
    setAlimenti(data);
    setLoading(false);
  }, []);

  useEffect(() => { ricarica(); }, [ricarica]);

  const alimentiFiltrati = alimenti.filter(a =>
    !filtro || a.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    (a.categoria || '').toLowerCase().includes(filtro.toLowerCase())
  );

  const handleToggle = async (item) => {
    const nuovoStato = !item.attivo;
    // Aggiornamento ottimistico
    setAlimenti(prev => prev.map(a =>
      (a._source === item._source && a.id === item.id) ? { ...a, attivo: nuovoStato } : a
    ));
    try {
      await toggleAlimento(item, nuovoStato);
      // Ricarica per aggiornare _source e _utenteId se è stato creato un override
      await ricarica();
    } catch (err) {
      console.error('Errore toggle:', err);
      ricarica(); // rollback
    }
  };

  const handleElimina = async (item) => {
    if (!item._utenteId) return;
    if (!confirm(`Eliminare "${item.nome}"?`)) return;
    try {
      await eliminaAlimento(item._utenteId);
      await ricarica();
    } catch (err) {
      alert('Errore: ' + err.message);
    }
  };

  const attivi   = alimentiFiltrati.filter(a => a.attivo !== false);
  const inattivi = alimentiFiltrati.filter(a => a.attivo === false);

  return (
    <div className="space-y-4">

      {/* Barra azioni */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text" value={filtro} onChange={e => setFiltro(e.target.value)}
          placeholder="🔍 Cerca per nome o categoria..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        />
        <button onClick={() => setModalItem(null)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition whitespace-nowrap">
          ➕ Nuovo Alimento
        </button>
      </div>

      {loading && (
        <div className="text-center py-10 text-emerald-600">⏳ Caricamento alimenti...</div>
      )}

      {!loading && alimenti.length === 0 && (
        <div className="text-center py-10 text-gray-400 italic">Nessun alimento trovato.</div>
      )}

      {/* Alimenti Attivi */}
      {attivi.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            ✅ Attivi ({attivi.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attivi.map(item => (
              <AlimentoCard key={`${item._source}-${item.id}`} item={item}
                onToggle={handleToggle} onEdit={setModalItem} onElimina={handleElimina} />
            ))}
          </div>
        </div>
      )}

      {/* Alimenti Inattivi */}
      {inattivi.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-4">
            ⭕ Disattivati ({inattivi.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-60">
            {inattivi.map(item => (
              <AlimentoCard key={`${item._source}-${item.id}`} item={item}
                onToggle={handleToggle} onEdit={setModalItem} onElimina={handleElimina} />
            ))}
          </div>
        </div>
      )}

      {/* Modale */}
      {modalItem !== undefined && (
        <ModalAlimento
          item={modalItem}
          onClose={() => setModalItem(undefined)}
          onSaved={() => { setModalItem(undefined); ricarica(); }}
        />
      )}
    </div>
  );
}

function AlimentoCard({ item, onToggle, onEdit, onElimina }) {
  const badgeClass = BADGE_COLORI[item.categoria] || BADGE_COLORI['Altro'];
  const isGlobale = item._source === 'globale';

  return (
    <div className={`bg-white border rounded-xl p-4 shadow-sm transition ${item.attivo === false ? 'border-gray-200' : 'border-gray-100'}`}>
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-800 text-sm truncate">{item.nome}</span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
              {item.categoria}
            </span>
            {isGlobale && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                🌐 globale
              </span>
            )}
          </div>
          <div className="mt-1.5 text-xs text-gray-500 flex gap-3">
            <span>⚡ {item.calorie_100g} kcal</span>
            <span>🥩 {item.proteine_100g}g P</span>
            <span>🌾 {item.carboidrati_100g}g C</span>
            <span>🫙 {item.grassi_100g}g G</span>
          </div>
        </div>

        {/* Azioni */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onToggle(item)}
            title={item.attivo !== false ? 'Disattiva' : 'Attiva'}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition ${
              item.attivo !== false ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>
            {item.attivo !== false ? '✓' : '○'}
          </button>
          <button onClick={() => onEdit(item)}
            title="Modifica / Personalizza"
            className="w-8 h-8 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg flex items-center justify-center text-xs transition">
            ✏️
          </button>
          {!isGlobale && (
            <button onClick={() => onElimina(item)}
              title="Elimina"
              className="w-8 h-8 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg flex items-center justify-center text-xs transition">
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
