'use client';

import { useState, useEffect, useCallback } from 'react';
import { caricaProfilo, salvaProfilo } from '../../lib/services/profileService.js';
import { calcolaFabbisogno } from '../../lib/modules/fabbisogno.js';

const LIVELLI_ATTIVITA = [
  { value: 'sedentario',    label: 'Sedentario (poco/nessun esercizio)' },
  { value: 'leggero',      label: 'Leggero (1-3 giorni/sett)' },
  { value: 'moderato',     label: 'Moderato (3-5 giorni/sett)' },
  { value: 'intenso',      label: 'Intenso (6-7 giorni/sett)' },
  { value: 'molto_intenso', label: 'Molto Intenso (2x/giorno)' },
];

const OBIETTIVI = [
  { value: 'mantenimento',         label: 'Mantenimento' },
  { value: 'dimagrimento_leggero', label: 'Dimagrimento Leggero (-300 kcal)' },
  { value: 'dimagrimento_intenso', label: 'Dimagrimento Intenso (-500 kcal)' },
  { value: 'massa',                label: 'Aumento Massa (+300 kcal)' },
];

export default function ProfiloForm() {
  const [profilo, setProfilo] = useState({
    nome: '', eta: '', sesso: 'M',
    altezza_cm: '', peso_kg: '',
    grasso_perc: '', muscolo_kg: '', grasso_viscerale: '', acqua_perc: '',
    livello_attivita: 'sedentario', obiettivo: 'mantenimento',
  });
  const [fabbisogno, setFabbisogno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // Carica profilo all'avvio
  useEffect(() => {
    caricaProfilo().then(data => {
      if (data) {
        setProfilo(prev => ({ ...prev, ...data }));
      }
      setLoading(false);
    });
  }, []);

  // Ricalcola fabbisogno ogni volta che cambiano i dati rilevanti
  useEffect(() => {
    const p = {
      eta:              parseInt(profilo.eta) || 0,
      sesso:            profilo.sesso,
      altezza_cm:       parseFloat(profilo.altezza_cm) || 0,
      peso_kg:          parseFloat(profilo.peso_kg) || 0,
      grasso_perc:      parseFloat(profilo.grasso_perc) || 0,
      muscolo_kg:       parseFloat(profilo.muscolo_kg) || 0,
      livello_attivita: profilo.livello_attivita,
      obiettivo:        profilo.obiettivo,
    };
    if (p.eta && p.altezza_cm && p.peso_kg) {
      setFabbisogno(calcolaFabbisogno(p));
    } else {
      setFabbisogno(null);
    }
  }, [profilo.eta, profilo.sesso, profilo.altezza_cm, profilo.peso_kg,
      profilo.grasso_perc, profilo.muscolo_kg, profilo.livello_attivita, profilo.obiettivo]);

  const handleChange = (e) => {
    setProfilo(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await salvaProfilo(profilo);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const formulaLabel = parseFloat(profilo.grasso_perc) > 0
    ? 'Katch-McArdle (% grasso corporeo)'
    : 'Mifflin-St Jeor (standard)';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-emerald-600 animate-spin text-3xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Form Profilo */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
          <span>👤</span> Dati Profilo Corporeo
        </h2>

        <div className="space-y-5">
          {/* Dati Generali */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Dati Generali</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input name="nome" value={profilo.nome || ''} onChange={handleChange}
                  placeholder="Il tuo nome"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Età</label>
                <input name="eta" type="number" value={profilo.eta || ''} onChange={handleChange}
                  placeholder="30" min="10" max="100"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sesso</label>
                <select name="sesso" value={profilo.sesso || 'M'} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="M">Maschio</option>
                  <option value="F">Femmina</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Altezza (cm)</label>
                <input name="altezza_cm" type="number" value={profilo.altezza_cm || ''} onChange={handleChange}
                  placeholder="175" min="100" max="250"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                <input name="peso_kg" type="number" step="0.1" value={profilo.peso_kg || ''} onChange={handleChange}
                  placeholder="75.0" min="30" max="300"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>
          </div>

          {/* Dati BIA (opzionali) */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Composizione Corporea <span className="text-gray-400 normal-case font-normal">(opzionale – da bilancia impedenziometrica)</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'grasso_perc',      label: '% Grasso',          placeholder: '18',   unit: '%'  },
                { name: 'muscolo_kg',       label: 'Massa Muscolare',   placeholder: '35',   unit: 'kg' },
                { name: 'grasso_viscerale', label: 'Grasso Viscerale',  placeholder: '8',    unit: 'liv'},
                { name: 'acqua_perc',       label: '% Acqua',           placeholder: '58',   unit: '%'  },
              ].map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <div className="relative">
                    <input name={field.name} type="number" step="0.1"
                      value={profilo[field.name] || ''} onChange={handleChange}
                      placeholder={field.placeholder}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-9 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    <span className="absolute right-2.5 top-2 text-xs text-gray-400">{field.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stile di vita e Obiettivo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Livello Attività</label>
              <select name="livello_attivita" value={profilo.livello_attivita || 'sedentario'} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                {LIVELLI_ATTIVITA.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Obiettivo</label>
              <select name="obiettivo" value={profilo.obiettivo || 'mantenimento'} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                {OBIETTIVI.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Feedback */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              ⚠️ {error}
            </div>
          )}
          {saved && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg p-3">
              ✅ Profilo salvato con successo!
            </div>
          )}

          {/* Bottone Salva */}
          <button onClick={handleSave} disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold py-2.5 rounded-xl transition">
            {saving ? '⏳ Salvataggio...' : '💾 Salva Profilo'}
          </button>
        </div>
      </div>

      {/* Resoconto Fabbisogno */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>🔥</span> Fabbisogno Calorico
        </h2>
        {fabbisogno ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <span className="block text-xs font-semibold text-blue-600 uppercase mb-1">BMR</span>
                <span className="text-2xl font-bold text-blue-800">{fabbisogno.bmr}</span>
                <span className="text-xs text-blue-500 ml-1">kcal</span>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <span className="block text-xs font-semibold text-indigo-600 uppercase mb-1">TDEE</span>
                <span className="text-2xl font-bold text-indigo-800">{fabbisogno.tdee}</span>
                <span className="text-xs text-indigo-500 ml-1">kcal</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <span className="block text-xs font-semibold text-emerald-600 uppercase mb-1">Target</span>
                <span className="text-2xl font-bold text-emerald-800">{fabbisogno.target}</span>
                <span className="text-xs text-emerald-500 ml-1">kcal</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-400 text-right">
              Formula: <strong>{formulaLabel}</strong>
              {fabbisogno.lbm > 0 && ` | Massa magra stimata: ${fabbisogno.lbm} kg`}
            </p>
          </>
        ) : (
          <p className="text-gray-500 italic text-sm text-center py-4">
            Inserisci età, peso e altezza per calcolare il fabbisogno calorico.
          </p>
        )}
      </div>
    </div>
  );
}
