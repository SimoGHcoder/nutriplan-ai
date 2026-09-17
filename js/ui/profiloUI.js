// js/ui/profiloUI.js

export function popolaUIProfilo(utenteData) {
  const p = utenteData.profilo || {};
  
  if (document.getElementById('prof_nome')) document.getElementById('prof_nome').value = p.nome || '';
  if (document.getElementById('prof_eta')) document.getElementById('prof_eta').value = p.eta || '';
  if (document.getElementById('prof_sesso')) document.getElementById('prof_sesso').value = p.sesso || 'M';
  if (document.getElementById('prof_altezza')) document.getElementById('prof_altezza').value = p.altezza || '';
  if (document.getElementById('prof_peso')) document.getElementById('prof_peso').value = p.peso || '';
  
  // Dati BIA / Bilancia intelligente
  if (document.getElementById('prof_grasso')) document.getElementById('prof_grasso').value = p.grasso_perc || '';
  if (document.getElementById('prof_muscolo')) document.getElementById('prof_muscolo').value = p.muscolo_kg || '';
  if (document.getElementById('prof_viscerale')) document.getElementById('prof_viscerale').value = p.grasso_viscerale || '';
  if (document.getElementById('prof_acqua')) document.getElementById('prof_acqua').value = p.acqua_perc || '';

  if (document.getElementById('prof_attivita')) document.getElementById('prof_attivita').value = p.livello_attivita || 'sedentario';
  if (document.getElementById('prof_obiettivo')) document.getElementById('prof_obiettivo').value = p.obiettivo || 'mantenimento';

  aggiornaResocontoFabbisogno();
}

export function leggiProfiloForm() {
  return {
    nome: document.getElementById('prof_nome')?.value || '',
    eta: parseInt(document.getElementById('prof_eta')?.value) || 0,
    sesso: document.getElementById('prof_sesso')?.value || 'M',
    altezza: parseFloat(document.getElementById('prof_altezza')?.value) || 0,
    peso: parseFloat(document.getElementById('prof_peso')?.value) || 0,
    grasso_perc: parseFloat(document.getElementById('prof_grasso')?.value) || null,
    muscolo_kg: parseFloat(document.getElementById('prof_muscolo')?.value) || null,
    grasso_viscerale: parseInt(document.getElementById('prof_viscerale')?.value) || null,
    acqua_perc: parseFloat(document.getElementById('prof_acqua')?.value) || null,
    livello_attivita: document.getElementById('prof_attivita')?.value || 'sedentario',
    obiettivo: document.getElementById('prof_obiettivo')?.value || 'mantenimento'
  };
}

export function calcolaFabbisogno(p) {
  if (!p.peso || !p.altezza || !p.eta) return { bmr: 0, tdee: 0, target: 0, lbm: 0 };

  let bmr = 0;
  let lbm = 0;

  // Se abbiamo la % di grasso, usiamo Katch-McArdle (molto più precisa)
  if (p.grasso_perc && p.grasso_perc > 0 && p.grasso_perc < 60) {
    lbm = p.peso * (1 - p.grasso_perc / 100);
    bmr = 370 + (21.6 * lbm);
  } else {
    // Altrimenti usiamo Mifflin-St Jeor standard
    lbm = p.muscolo_kg || (p.peso * 0.75); // stima indicativa se manca la % grasso
    if (p.sesso === 'M') {
      bmr = (10 * p.peso) + (6.25 * p.altezza) - (5 * p.eta) + 5;
    } else {
      bmr = (10 * p.peso) + (6.25 * p.altezza) - (5 * p.eta) - 161;
    }
  }

  // Moltiplicatori LAF (Livello Attività Fisica)
  const lafMap = {
    sedentario: 1.2,
    leggero: 1.375,
    moderato: 1.55,
    intenso: 1.725,
    molto_intenso: 1.9
  };
  const laf = lafMap[p.livello_attivita] || 1.2;
  const tdee = bmr * laf;

  // Aggiustamento in base all'obiettivo
  let target = tdee;
  if (p.obiettivo === 'dimagrimento_leggero') target -= 300;
  if (p.obiettivo === 'dimagrimento_intenso') target -= 500;
  if (p.obiettivo === 'massa') target += 300;

  return { 
    bmr: Math.round(bmr), 
    tdee: Math.round(tdee), 
    target: Math.round(target),
    lbm: Math.round(lbm * 10) / 10 
  };
}

export function aggiornaResocontoFabbisogno() {
  const p = leggiProfiloForm();
  const res = calcolaFabbisogno(p);

  const container = document.getElementById('resocontoFabbisogno');
  if (!container) return;

  if (res.bmr === 0) {
    container.innerHTML = `<p class="text-gray-500 italic text-sm">Inserisci i dati principali (età, peso, altezza) per calcolare il fabbisogno.</p>`;
    return;
  }

  const formulaUsata = (p.grasso_perc > 0) ? 'Katch-McArdle (basata su massa magra %)' : 'Mifflin-St Jeor (standard)';

  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
      <div class="p-3 bg-blue-50 rounded-lg border border-blue-100">
        <span class="block text-xs font-semibold text-blue-600 uppercase">Metabolismo Basale (BMR)</span>
        <span class="text-2xl font-bold text-blue-800">${res.bmr} kcal</span>
      </div>
      <div class="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
        <span class="block text-xs font-semibold text-indigo-600 uppercase">Fabbisogno Giornaliero (TDEE)</span>
        <span class="text-2xl font-bold text-indigo-800">${res.tdee} kcal</span>
      </div>
      <div class="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
        <span class="block text-xs font-semibold text-emerald-600 uppercase">Target Calorico Obiettivo</span>
        <span class="text-2xl font-bold text-emerald-800">${res.target} kcal</span>
      </div>
    </div>
    <div class="mt-3 text-xs text-gray-500 text-right">
      Formula applicata: <strong>${formulaUsata}</strong> ${res.lbm > 0 ? `| Massa Magra stimata: ${res.lbm} kg` : ''}
    </div>
  `;
}
