'use client';

import { useState, useEffect } from 'react';
import { caricaPiani, salvaPiano, eliminaPiano } from '../../lib/services/pianiService.js';
import { caricaAlimenti } from '../../lib/services/alimentiService.js';
import { caricaProfilo } from '../../lib/services/profileService.js';
import { generaStrutturaPiano } from '../../lib/modules/alimenti.js';

export default function PianoView() {
  const [piani, setPiani] = useState([]);
  const [pianoCorrente, setPianoCorrente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [errore, setErrore] = useState(null);

  useEffect(() => {
    caricaPiani(5).then(data => {
      setPiani(data);
      if (data.length > 0) setPianoCorrente(data[0]);
      setLoading(false);
    });
  }, []);

  const generaNuovoPiano = async () => {
    setGenerando(true);
    setErrore(null);
    try {
      const [alimentiData, profiloData] = await Promise.all([
        caricaAlimenti(),
        caricaProfilo(),
      ]);

      const piano = generaStrutturaPiano(alimentiData, profiloData || {});
      const salvato = await salvaPiano(piano);

      // Ricostruisce il piano in formato compatibile con il rendering
      const pianoDaVisualizzare = {
        ...salvato,
        target_totale: {
          targetKcal:     salvato.target_kcal,
          targetProteine: salvato.target_proteine,
          targetCarbo:    salvato.target_carbo,
          targetGrassi:   salvato.target_grassi,
        },
        pasti: salvato.pasti,
      };

      setPianoCorrente(pianoDaVisualizzare);
      setPiani(prev => [salvato, ...prev].slice(0, 5));
    } catch (err) {
      setErrore(err.message);
    } finally {
      setGenerando(false);
    }
  };

  const handleElimina = async (pianoId) => {
    if (!confirm('Eliminare questo piano?')) return;
    try {
      await eliminaPiano(pianoId);
      const aggiornati = piani.filter(p => p.id !== pianoId);
      setPiani(aggiornati);
      if (pianoCorrente?.id === pianoId) {
        setPianoCorrente(aggiornati.length > 0 ? aggiornati[0] : null);
      }
    } catch (err) {
      alert('Errore: ' + err.message);
    }
  };

  const selezionaPiano = (piano) => {
    const pianoDaVisualizzare = {
      ...piano,
      target_totale: {
        targetKcal:     piano.target_kcal,
        targetProteine: piano.target_proteine,
        targetCarbo:    piano.target_carbo,
        targetGrassi:   piano.target_grassi,
      },
    };
    setPianoCorrente(pianoDaVisualizzare);
  };

  if (loading) {
    return <div className="text-center py-20 text-emerald-600">⏳ Caricamento piani...</div>;
  }

  return (
    <div className="space-y-6">

      {/* Header + Genera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">📋 Piani Alimentari</h2>
          <p className="text-sm text-gray-500 mt-0.5">Genera piani giornalieri personalizzati in base al tuo profilo.</p>
        </div>
        <button onClick={generaNuovoPiano} disabled={generando}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition whitespace-nowrap">
          {generando ? '⏳ Generazione...' : '✨ Genera Nuovo Piano'}
        </button>
      </div>

      {errore && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">
          ⚠️ {errore}
        </div>
      )}

      {/* Piano attivo */}
      {pianoCorrente ? (
        <PianoCard piano={pianoCorrente} onElimina={handleElimina} />
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-sm">Nessun piano ancora. Clicca "Genera Nuovo Piano" per iniziare!</p>
        </div>
      )}

      {/* Storico piani (se più di uno) */}
      {piani.length > 1 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">📅 Storico</h3>
          <div className="space-y-2">
            {piani.map((p, i) => (
              <button key={p.id} onClick={() => selezionaPiano(p)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition flex justify-between items-center ${
                  pianoCorrente?.id === p.id
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
                    : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'
                }`}>
                <span>Piano del {p.data_creazione}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">{p.target_kcal} kcal</span>
                  <button onClick={(e) => { e.stopPropagation(); handleElimina(p.id); }}
                    className="text-red-400 hover:text-red-600 text-xs p-1">🗑️</button>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PianoCard({ piano, onElimina }) {
  const target = piano.target_totale || {};

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header piano */}
      <div className="bg-emerald-600 text-white p-4 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-base">Piano del {piano.data_creazione}</h3>
          <p className="text-emerald-200 text-xs mt-0.5">Target giornaliero personalizzato</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-lg">{target.targetKcal} <span className="text-sm font-normal text-emerald-200">kcal</span></span>
          {piano.id && (
            <button onClick={() => onElimina(piano.id)}
              className="text-emerald-300 hover:text-white transition text-sm">🗑️</button>
          )}
        </div>
      </div>

      {/* Macros */}
      {(target.targetProteine || target.targetCarbo || target.targetGrassi) && (
        <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50 border-b border-gray-100">
          {[
            { label: 'Proteine', val: target.targetProteine, color: 'text-red-600' },
            { label: 'Carboidrati', val: target.targetCarbo, color: 'text-yellow-600' },
            { label: 'Grassi', val: target.targetGrassi, color: 'text-orange-600' },
          ].map(m => (
            <div key={m.label} className="text-center py-2.5">
              <span className={`block font-bold text-base ${m.color}`}>{m.val}g</span>
              <span className="text-xs text-gray-400">{m.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Pasti */}
      <div className="divide-y divide-gray-50">
        {(piano.pasti || []).map((pasto, i) => (
          <div key={i} className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-sm text-emerald-700">{pasto.pasto}</span>
              <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{pasto.target_kcal} kcal</span>
            </div>
            <ul className="space-y-1">
              {(pasto.alimenti || []).map((a, j) => (
                <li key={j} className="flex justify-between text-sm text-gray-600">
                  <span>• {a.nome}</span>
                  <span className="text-gray-400 font-mono text-xs">{a.grammi}g <span className="text-gray-300">({a.kcal} kcal)</span></span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
