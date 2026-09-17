// js/ui/alimentiUI.js

let callbackToggleAlimento = null;
let callbackEditAlimento = null;
let debounceTimer = null;

// Database di fallback rapido per alimenti base (generi comuni)
const DATABASE_BASE = [
  { nome: "Riso bianco", categoria: "Carboidrati", kcal: 350, prot: 6.7, carbo: 79.0, grassi: 0.4 },
  { nome: "Riso Basmati", categoria: "Carboidrati", kcal: 345, prot: 7.0, carbo: 78.0, grassi: 0.6 },
  { nome: "Pasta di semola", categoria: "Carboidrati", kcal: 353, prot: 10.9, carbo: 71.7, grassi: 1.4 },
  { nome: "Petto di pollo", categoria: "Proteine", kcal: 100, prot: 23.3, carbo: 0.0, grassi: 0.8 },
  { nome: "Petto di tacchino", categoria: "Proteine", kcal: 107, prot: 22.4, carbo: 0.0, grassi: 1.7 },
  { nome: "Filetto di Salmone", categoria: "Proteine", kcal: 185, prot: 18.4, carbo: 0.0, grassi: 12.0 },
  { nome: "Tonno in scatola al naturale", categoria: "Proteine", kcal: 103, prot: 25.0, carbo: 0.0, grassi: 0.8 },
  { nome: "Uova intere", categoria: "Proteine", kcal: 128, prot: 12.4, carbo: 0.1, grassi: 8.7 },
  { nome: "Olio extravergine d'oliva", categoria: "Grassi", kcal: 899, prot: 0.0, carbo: 0.0, grassi: 99.9 },
  { nome: "Parmigiano Reggiano", categoria: "Proteine", kcal: 387, prot: 33.0, carbo: 0.0, grassi: 28.4 },
  { nome: "Yogurt greco 0%", categoria: "Proteine", kcal: 57, prot: 10.3, carbo: 3.6, grassi: 0.4 }
];

export function inizializzaAlimentiUI(onToggle, onEdit) {
  callbackToggleAlimento = onToggle;
  callbackEditAlimento = onEdit;

  // Gestione chiusura modale cliccando su Annulla
  document.getElementById('btnChiudiModalAlimento')?.addEventListener('click', chiudiModalAlimento);

  // Listener per l'autocomplete sul campo nome alimento con ricerca asincrona (Open Food Facts + Locale)
  const inputNome = document.getElementById('alim_nome');
  if (inputNome) {
    inputNome.addEventListener('input', (e) => {
      const testo = e.target.value;
      clearTimeout(debounceTimer);
      
      if (!testo || testo.trim().length < 2) {
        nascondiSuggerimenti();
        return;
      }

      // Debounce di 300ms per non sovraccaricare l'API mentre si digita
      debounceTimer = setTimeout(() => {
        cercaAlimentiGenerale(testo.trim());
      }, 300);
    });

    // Chiudi i suggerimenti se si clicca fuori
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

  box.innerHTML = `<div class="p-2.5 text-xs text-gray-400 text-center flex items-center justify-center gap-2"><span>⏳</span> Ricerca in corso (database globale)...</div>`;
  box.classList.remove('hidden');

  let risultatiTrovati = [];

  // 1. Cerca nel database locale di base
  const matchBase = DATABASE_BASE.filter(item => item.nome.toLowerCase().includes(query.toLowerCase()));
  matchBase.forEach(m => risultatiTrovati.push({ ...m, fonte: 'Base Locale' }));

  // 2. Interroga l'API pubblica di Open Food Facts (lingua italiana)
  try {
    const url = `https://it.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=6`;
    const response = await fetch(url);
    const data = await response.json();

    if (data && data.products) {
      data.products.forEach(p => {
        const nut = p.nutriments || {};
        // Prendi i valori per 100g (energia in kcal o kJ convertita)
        let kcal = nut['energy-kcal_100g'] || nut['energy_100g'] ? Math.round(nut['energy-kcal_100g'] || (nut['energy_100g'] / 4.184)) : 0;
        let prot = nut['proteins_100g'] || 0;
        let carbo = nut['carbohydrates_100g'] || 0;
        let grassi = nut['fat_100g'] || 0;

        if (p.product_name && kcal > 0) {
          // Evita duplicati esatti
          if (!risultatiTrovati.some(r => r.nome.toLowerCase() === p.product_name.toLowerCase())) {
            risultatiTrovati.push({
              nome: p.brands ? `${p.product_name} (${p.brands})` : p.product_name,
              categoria: assegnaCategoriaCasuale(p.categories_tags),
              kcal: parseFloat(kcal.toFixed(1)),
              prot: parseFloat(prot.toFixed(1)),
              carbo: parseFloat(carbo.toFixed(1)),
              grassi: parseFloat(grassi.toFixed(1)),
              fonte: 'Open Food Facts'
            });
          }
        }
      });
    }
  } catch (err) {
    console.warn("Impossibile contattare Open Food Facts:", err);
  }

  mostraBoxSuggerimenti(risultatiTrovati);
}

function assegnaCategoriaCasuale(tags) {
  if (!tags || !Array.isArray(tags)) return 'Generico';
  const str = tags.join(' ').toLowerCase();
  if (str.includes('protein') || str.includes('meat') || str.includes('fish') || str.includes('cheeses') || str.includes('eggs')) return 'Proteine';
  if (str.includes('cereal') || str.includes('pasta') || str.includes('rice') || str.includes('bread') || str.includes('potatoes')) return 'Carboidrati';
  if (str.includes('fat') || str.includes('oil') || str.includes('butter')) return 'Grassi';
  if (str.includes('vegetable') || str.includes('tomatoes')) return 'Verdura';
  if (str.includes('fruit')) return 'Frutta';
  return 'Generico';
}

function mostraBoxSuggerimenti(lista) {
  const box = document.getElementById('suggerimentiAlimenti');
  if (!box) return;

  if (!lista || lista.length === 0) {
    box.innerHTML = `<div class="p-2.5 text-xs text-gray-400 text-center">Nessun alimento trovato. Inserisci i dati manualmente.</div>`;
    box.classList.remove('hidden');
    return;
  }

  box.innerHTML = '';
  lista.forEach(item => {
    const div = document.createElement('div');
    div.className = 'p-2.5 hover:bg-emerald-50 cursor-pointer text-xs flex justify-between items-center transition border-b border-gray-50 last:border-none';
    div.innerHTML = `
      <div class="flex-1 pr-2">
        <span class="font-semibold text-gray-800 block">${item.nome}</span>
        <span class="text-[10px] text-gray-400">${item.fonte} • Cat: ${item.categoria}</span>
      </div>
      <span class="text-gray-600 font-mono text-right whitespace-nowrap">🔥 ${item.kcal} kcal<br><span class="text-[10px] text-gray-400">P:${item.prot} | C:${item.carbo} | G:${item.grassi}</span></span>
    `;

    div.addEventListener('click', () => {
      document.getElementById('alim_nome').value = item.nome;
      document.getElementById('alim_categoria').value = item.categoria;
      document.getElementById('alim_kcal').value = item.kcal;
      document.getElementById('alim_prot').value = item.prot;
      document.getElementById('alim_carbo').value = item.carbo;
      document.getElementById('alim_grassi').value = item.grassi;

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
    container.innerHTML = `<p class="text-xs text-gray-500 text-center py-4">Nessun alimento presente nel database.</p>`;
    return;
  }

  container.innerHTML = '';
  const testoFiltro = (filtro || '').toLowerCase().trim();
  const cibiFiltrati = alimentiData.filter(a => 
    a.nome.toLowerCase().includes(testoFiltro) || 
    (a.categoria && a.categoria.toLowerCase().includes(testoFiltro))
  );

  if (cibiFiltrati.length === 0) {
    container.innerHTML = `<p class="text-xs text-gray-500 text-center py-4">Nessun alimento trovato con questo filtro.</p>`;
    return;
  }

  cibiFiltrati.forEach(a => {
    const isAttivo = a.attivo !== false;

    const card = document.createElement('div');
    card.className = `p-3 flex items-center justify-between gap-2 transition-all ${isAttivo ? 'opacity-100' : 'opacity-50 bg-red-50/50'}`;

    card.innerHTML = `
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-gray-800">${a.nome}</span>
          <span class="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">${a.categoria || 'Generico'}</span>
        </div>
        <div class="text-[11px] text-gray-500 mt-1 flex flex-wrap gap-3 font-mono">
          <span>🔥 ${a.calorie_100g} kcal</span>
          <span>P: ${a.proteine_100g}g</span>
          <span>C: ${a.carboidrati_100g}g</span>
          <span>G: ${a.grassi_100g}g</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" class="btn-toggle text-xs px-2.5 py-1 rounded-lg border transition-all ${isAttivo ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}">
          ${isAttivo ? 'Attivo' : 'Inattivo'}
        </button>
        <button type="button" class="btn-edit p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition" title="Modifica">✏️</button>
      </div>
    `;

    card.querySelector('.btn-toggle').addEventListener('click', () => {
      if (callbackToggleAlimento) callbackToggleAlimento(a.id);
    });
    
    card.querySelector('.btn-edit').addEventListener('click', () => {
      if (callbackEditAlimento) callbackEditAlimento(a.id);
    });

    container.appendChild(card);
  });
}

export function apriModalAlimento(alim = null) {
  const modal = document.getElementById('modalAlimento');
  const titolo = document.getElementById('modalAlimentoTitolo');
  if (!modal) return;

  nascondiSuggerimenti();
  modal.classList.remove('hidden');

  if (alim) {
    if (titolo) titolo.innerHTML = '<span>✏️</span> Modifica Alimento';
    document.getElementById('editAlimentoId').value = alim.id || '';
    document.getElementById('alim_nome').value = alim.nome || '';
    document.getElementById('alim_categoria').value = alim.categoria || 'Proteine';
    document.getElementById('alim_kcal').value = alim.calorie_100g ?? '';
    document.getElementById('alim_prot').value = alim.proteine_100g ?? '';
    document.getElementById('alim_carbo').value = alim.carboidrati_100g ?? '';
    document.getElementById('alim_grassi').value = alim.grassi_100g ?? '';
  } else {
    if (titolo) titolo.innerHTML = '<span>➕</span> Aggiungi Alimento';
    document.getElementById('editAlimentoId').value = '';
    document.getElementById('alim_nome').value = '';
    document.getElementById('alim_categoria').value = 'Proteine';
    document.getElementById('alim_kcal').value = '';
    document.getElementById('alim_prot').value = '';
    document.getElementById('alim_carbo').value = '';
    document.getElementById('alim_grassi').value = '';
  }
}

export function chiudiModalAlimento() {
  document.getElementById('modalAlimento')?.classList.add('hidden');
  nascondiSuggerimenti();
}

export function leggiAlimentoForm() {
  const id = document.getElementById('editAlimentoId')?.value;
  return {
    id: id && id.trim() !== '' ? id : 'cibo_' + Date.now(),
    nome: document.getElementById('alim_nome')?.value.trim() || '',
    categoria: document.getElementById('alim_categoria')?.value || 'Generico',
    calorie_100g: parseFloat(document.getElementById('alim_kcal')?.value) || 0,
    proteine_100g: parseFloat(document.getElementById('alim_prot')?.value) || 0,
    carboidrati_100g: parseFloat(document.getElementById('alim_carbo')?.value) || 0,
    grassi_100g: parseFloat(document.getElementById('alim_grassi')?.value) || 0,
    attivo: true
  };
}
