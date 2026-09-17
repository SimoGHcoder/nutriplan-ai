// js/ui/alimentiUI.js

let callbackToggleAlimento = null;
let callbackEditAlimento = null;
let debounceTimer = null;

// Database di base pulito con esempi misti (uova a pezzi, albume in grammi, salmone a porzione)
const DATABASE_BASE = [
  { nome: "Uova intere", categoria: "Proteine", unita_misura: "pz", peso_unita: 60, calorie_100g: 128, proteine_100g: 12.4, carboidrati_100g: 0.1, grassi_100g: 8.7 },
  { nome: "Albume d'uovo (liquido)", categoria: "Proteine", unita_misura: "g", peso_unita: 100, calorie_100g: 52, proteine_100g: 10.9, carboidrati_100g: 0.7, grassi_100g: 0.2 },
  { nome: "Trancio di Salmone", categoria: "Proteine", unita_misura: "porzione", peso_unita: 150, calorie_100g: 185, proteine_100g: 18.4, carboidrati_100g: 0.0, grassi_100g: 12.0 },
  { nome: "Riso Basmati", categoria: "Carboidrati", unita_misura: "g", peso_unita: 100, calorie_100g: 345, proteine_100g: 7.0, carboidrati_100g: 78.0, grassi_100g: 0.6 },
  { nome: "Petto di pollo", categoria: "Proteine", unita_misura: "g", peso_unita: 100, calorie_100g: 100, proteine_100g: 23.3, carboidrati_100g: 0.0, grassi_100g: 0.8 },
  { nome: "Olio extravergine d'oliva", categoria: "Grassi", unita_misura: "g", peso_unita: 100, calorie_100g: 899, proteine_100g: 0.0, carboidrati_100g: 0.0, grassi_100g: 99.9 }
];

export function inizializzaAlimentiUI(onToggle, onEdit) {
  callbackToggleAlimento = onToggle;
  callbackEditAlimento = onEdit;

  document.getElementById('btnChiudiModalAlimento')?.addEventListener('click', chiudiModalAlimento);

  // Gestione visibilità campo "Peso dell'unità" in base alla scelta dell'utente
  const selectUnita = document.getElementById('alim_unita');
  const wrapperPesoUnita = document.getElementById('wrapperPesoUnita');
  if (selectUnita && wrapperPesoUnita) {
    selectUnita.addEventListener('change', (e) => {
      if (e.target.value === 'g') {
        wrapperPesoUnita.classList.add('hidden');
      } else {
        wrapperPesoUnita.classList.remove('hidden');
        const labelTesto = document.getElementById('labelPesoUnita');
        if (labelTesto) {
          labelTesto.innerText = e.target.value === 'pz' ? 'Peso medio di 1 pezzo (g)' : 'Peso fisso della porzione/confezione (g)';
        }
      }
    });
  }

  // Listener Autocomplete Open Food Facts + Base Locale
  const inputNome = document.getElementById('alim_nome');
  if (inputNome) {
    inputNome.addEventListener('input', (e) => {
      const testo = e.target.value;
      clearTimeout(debounceTimer);
      if (!testo || testo.trim().length < 2) {
        nascondiSuggerimenti();
        return;
      }
      debounceTimer = setTimeout(() => {
        cercaAlimentiGenerale(testo.trim());
      }, 300);
    });

    document.addEventListener('click', (e) => {
      const box = document.getElementById('suggerimentiAlimenti');
      if (box && !inputNome.contains(e.target) && !box.contains(e.target)) {
        nascondiSuggerimenti();
      }
    });
  }
}

async function cercaAlimentiGenerale(query) {
  const box = document.getElementById('suggerimentiAlimenti');
  if (!box) return;

  box.innerHTML = `<div class="p-2.5 text-xs text-gray-400 text-center">⏳ Ricerca in corso...</div>`;
  box.classList.remove('hidden');

  let risultatiTrovati = [];
  const matchBase = DATABASE_BASE.filter(item => item.nome.toLowerCase().includes(query.toLowerCase()));
  matchBase.forEach(m => risultatiTrovati.push({ ...m, fonte: 'Base Locale' }));

  try {
    const url = `https://it.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5`;
    const response = await fetch(url);
    const data = await response.json();

    if (data && data.products) {
      data.products.forEach(p => {
        const nut = p.nutriments || {};
        let kcal = nut['energy-kcal_100g'] || nut['energy_100g'] ? Math.round(nut['energy-kcal_100g'] || (nut['energy_100g'] / 4.184)) : 0;
        let prot = nut['proteins_100g'] || 0;
        let carbo = nut['carbohydrates_100g'] || 0;
        let grassi = nut['fat_100g'] || 0;

        if (p.product_name && kcal > 0) {
          if (!risultatiTrovati.some(r => r.nome.toLowerCase() === p.product_name.toLowerCase())) {
            // I prodotti da Open Food Facts partono sempre standard in grammi (g). 
            // Sarai tu eventualmente a cambiarlo in "pz" o "porzione" se lo desideri.
            risultatiTrovati.push({
              nome: p.brands ? `${p.product_name} (${p.brands})` : p.product_name,
              categoria: 'Generico',
              unita_misura: 'g',
              peso_unita: 100,
              calorie_100g: parseFloat(kcal.toFixed(1)),
              proteine_100g: parseFloat(prot.toFixed(1)),
              carboidrati_100g: parseFloat(carbo.toFixed(1)),
              grassi_100g: parseFloat(grassi.toFixed(1)),
              fonte: 'Open Food Facts'
            });
          }
        }
      });
    }
  } catch (err) {
    console.warn("Errore API Open Food Facts:", err);
  }

  mostraBoxSuggerimenti(risultatiTrovati);
}

function mostraBoxSuggerimenti(lista) {
  const box = document.getElementById('suggerimentiAlimenti');
  if (!box) return;

  if (!lista || lista.length === 0) {
    box.innerHTML = `<div class="p-2.5 text-xs text-gray-400 text-center">Nessun alimento trovato. Inserisci manualmente.</div>`;
    box.classList.remove('hidden');
    return;
  }

  box.innerHTML = '';
  lista.forEach(item => {
    const div = document.createElement('div');
    div.className = 'p-2.5 hover:bg-emerald-50 cursor-pointer text-xs flex justify-between items-center transition border-b border-gray-50';
    
    div.innerHTML = `
      <div>
        <span class="font-semibold text-gray-800 block">${item.nome}</span>
        <span class="text-[10px] text-gray-400">${item.fonte}</span>
      </div>
      <span class="text-gray-600 font-mono text-right">🔥 ${item.calorie_100g} kcal/100g</span>
    `;

    div.addEventListener('click', () => {
      document.getElementById('alim_nome').value = item.nome;
      document.getElementById('alim_categoria').value = item.categoria || 'Generico';
      document.getElementById('alim_unita').value = item.unita_misura || 'g';
      document.getElementById('alim_peso_unita').value = item.peso_unita || 100;
      document.getElementById('alim_kcal').value = item.calorie_100g;
      document.getElementById('alim_prot').value = item.proteine_100g;
      document.getElementById('alim_carbo').value = item.carboidrati_100g;
      document.getElementById('alim_grassi').value = item.grassi_100g;

      const wrapper = document.getElementById('wrapperPesoUnita');
      if ((item.unita_misura || 'g') === 'g') {
        wrapper.classList.add('hidden');
      } else {
        wrapper.classList.remove('hidden');
      }

      nascondiSuggerimenti();
    });

    box.appendChild(div);
  });

  box.classList.remove('hidden');
}

function nascondiSuggerimenti() {
  const box = document.getElementById('suggerimentiAlimenti');
  if (box) {
    box.classList.add('hidden');
    box.innerHTML = '';
  }
}

export function renderListaAlimenti(alimentiData, filtro = '') {
  const container = document.getElementById('listaAlimentiContainer');
  if (!container) return;

  if (!alimentiData || alimentiData.length === 0) {
    container.innerHTML = `<p class="text-xs text-gray-500 text-center py-4">Nessun alimento presente.</p>`;
    return;
  }

  container.innerHTML = '';
  const testoFiltro = (filtro || '').toLowerCase().trim();
  const cibiFiltrati = alimentiData.filter(a => a.nome.toLowerCase().includes(testoFiltro));

  cibiFiltrati.forEach(a => {
    const isAttivo = a.attivo !== false;
    const unitaMisura = a.unita_misura || 'g';
    const descUnita = unitaMisura === 'pz' ? `Pezzo (~${a.peso_unita || 0}g)` : unitaMisura === 'porzione' ? `Porzione (${a.peso_unita || 0}g)` : 'Grammi (g)';

    const card = document.createElement('div');
    card.className = `p-3 flex items-center justify-between gap-2 transition-all ${isAttivo ? 'opacity-100' : 'opacity-50 bg-red-50/50'}`;

    card.innerHTML = `
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-gray-800">${a.nome}</span>
          <span class="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-medium">${descUnita}</span>
        </div>
        <div class="text-[11px] text-gray-500 mt-1 flex gap-3 font-mono">
          <span>🔥 ${a.calorie_100g} kcal/100g</span>
          <span>P: ${a.proteine_100g}g</span>
          <span>C: ${a.carboidrati_100g}g</span>
          <span>G: ${a.grassi_100g}g</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" class="btn-toggle text-xs px-2.5 py-1 rounded-lg border transition ${isAttivo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}">
          ${isAttivo ? 'Attivo' : 'Inattivo'}
        </button>
        <button type="button" class="btn-edit p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">✏️</button>
      </div>
    `;

    card.querySelector('.btn-toggle').addEventListener('click', () => { if (callbackToggleAlimento) callbackToggleAlimento(a.id); });
    card.querySelector('.btn-edit').addEventListener('click', () => { if (callbackEditAlimento) callbackEditAlimento(a.id); });

    container.appendChild(card);
  });
}

export function apriModalAlimento(alim = null) {
  const modal = document.getElementById('modalAlimento');
  const titolo = document.getElementById('modalAlimentoTitolo');
  if (!modal) return;

  nascondiSuggerimenti();
  modal.classList.remove('hidden');

  const wrapperPeso = document.getElementById('wrapperPesoUnita');

  if (alim) {
    if (titolo) titolo.innerHTML = '<span>✏️</span> Modifica Alimento';
    document.getElementById('editAlimentoId').value = alim.id || '';
    document.getElementById('alim_nome').value = alim.nome || '';
    document.getElementById('alim_categoria').value = alim.categoria || 'Proteine';
    document.getElementById('alim_unita').value = alim.unita_misura || 'g';
    document.getElementById('alim_peso_unita').value = alim.peso_unita || 100;
    document.getElementById('alim_kcal').value = alim.calorie_100g ?? '';
    document.getElementById('alim_prot').value = alim.proteine_100g ?? '';
    document.getElementById('alim_carbo').value = alim.carboidrati_100g ?? '';
    document.getElementById('alim_grassi').value = alim.grassi_100g ?? '';

    if ((alim.unita_misura || 'g') === 'g') wrapperPeso.classList.add('hidden');
    else wrapperPeso.classList.remove('hidden');
  } else {
    if (titolo) titolo.innerHTML = '<span>➕</span> Aggiungi Alimento';
    document.getElementById('editAlimentoId').value = '';
    document.getElementById('alim_nome').value = '';
    document.getElementById('alim_categoria').value = 'Proteine';
    document.getElementById('alim_unita').value = 'g';
    document.getElementById('alim_peso_unita').value = '60';
    document.getElementById('alim_kcal').value = '';
    document.getElementById('alim_prot').value = '';
    document.getElementById('alim_carbo').value = '';
    document.getElementById('alim_grassi').value = '';
    wrapperPeso.classList.add('hidden');
  }
}

export function chiudiModalAlimento() {
  document.getElementById('modalAlimento')?.classList.add('hidden');
  nascondiSuggerimenti();
}

export function leggiAlimentoForm() {
  const id = document.getElementById('editAlimentoId')?.value;
  const unita = document.getElementById('alim_unita')?.value || 'g';
  return {
    id: id && id.trim() !== '' ? id : 'cibo_' + Date.now(),
    nome: document.getElementById('alim_nome')?.value.trim() || '',
    categoria: document.getElementById('alim_categoria')?.value || 'Generico',
    unita_misura: unita,
    peso_unita: unita === 'g' ? 100 : parseFloat(document.getElementById('alim_peso_unita')?.value) || 100,
    calorie_100g: parseFloat(document.getElementById('alim_kcal')?.value) || 0,
    proteine_100g: parseFloat(document.getElementById('alim_prot')?.value) || 0,
    carboidrati_100g: parseFloat(document.getElementById('alim_carbo')?.value) || 0,
    grassi_100g: parseFloat(document.getElementById('alim_grassi')?.value) || 0,
    attivo: true
  };
}
