// js/ui/alimentiUI.js

let callbackToggleAlimento = null;
let callbackEditAlimento = null;

// Database di riferimento per il riconoscimento automatico (valori per 100g)
const DATABASE_RIFERIMENTO = [
  { nome: "Riso bianco bollito/crudo", categoria: "Carboidrati", kcal: 350, prot: 6.7, carbo: 79.0, grassi: 0.4 },
  { nome: "Riso Basmati", categoria: "Carboidrati", kcal: 345, prot: 7.0, carbo: 78.0, grassi: 0.6 },
  { nome: "Riso Integrale", categoria: "Carboidrati", kcal: 337, prot: 7.5, carbo: 74.0, grassi: 2.2 },
  { nome: "Pasta di semola di grano duro", categoria: "Carboidrati", kcal: 353, prot: 10.9, carbo: 71.7, grassi: 1.4 },
  { nome: "Pasta integrale", categoria: "Carboidrati", kcal: 348, prot: 12.5, carbo: 64.7, grassi: 2.0 },
  { nome: "Petto di pollo", categoria: "Proteine", kcal: 100, prot: 23.3, carbo: 0.0, grassi: 0.8 },
  { nome: "Petto di tacchino", categoria: "Proteine", kcal: 107, prot: 22.4, carbo: 0.0, grassi: 1.7 },
  { nome: "Carne bovina magra (fesa)", categoria: "Proteine", kcal: 115, prot: 21.0, carbo: 0.0, grassi: 3.2 },
  { nome: "Filetto di Salmone", categoria: "Proteine", kcal: 185, prot: 18.4, carbo: 0.0, grassi: 12.0 },
  { nome: "Petto di Merluzzo / Filetti", categoria: "Proteine", kcal: 82, prot: 17.8, carbo: 0.0, grassi: 0.9 },
  { nome: "Tonno in scatola al naturale", categoria: "Proteine", kcal: 103, prot: 25.0, carbo: 0.0, grassi: 0.8 },
  { nome: "Uova di gallina (intero)", categoria: "Proteine", kcal: 128, prot: 12.4, carbo: 0.1, grassi: 8.7 },
  { nome: "Albume d'uovo", categoria: "Proteine", kcal: 52, prot: 10.9, carbo: 0.7, grassi: 0.2 },
  { nome: "Olio extravergine d'oliva", categoria: "Grassi", kcal: 899, prot: 0.0, carbo: 0.0, grassi: 99.9 },
  { nome: "Burro", categoria: "Grassi", kcal: 758, prot: 0.8, carbo: 0.7, grassi: 83.3 },
  { nome: "Mandorle sgusciate", categoria: "Grassi", kcal: 603, prot: 22.1, carbo: 5.9, grassi: 52.5 },
  { nome: "Parmigiano Reggiano", categoria: "Proteine", kcal: 387, prot: 33.0, carbo: 0.0, grassi: 28.4 },
  { nome: "Fiocchi di latte (Vitasnella/Light)", categoria: "Proteine", kcal: 98, prot: 12.5, carbo: 3.5, grassi: 4.0 },
  { nome: "Yogurt greco 0% grassi", categoria: "Proteine", kcal: 57, prot: 10.3, carbo: 3.6, grassi: 0.4 },
  { nome: "Patate bollite", categoria: "Carboidrati", kcal: 87, prot: 2.1, carbo: 20.0, grassi: 0.1 },
  { nome: "Pane di tipo 0", categoria: "Carboidrati", kcal: 289, prot: 8.8, carbo: 58.7, grassi: 2.1 },
  { nome: "Avocado", categoria: "Grassi", kcal: 160, prot: 2.0, carbo: 1.8, grassi: 14.7 },
  { nome: "Broccoli lessati", categoria: "Verdura", kcal: 24, prot: 2.9, carbo: 2.6, grassi: 0.4 },
  { nome: "Spinaci freschi / bolliti", categoria: "Verdura", kcal: 23, prot: 3.0, carbo: 2.9, grassi: 0.4 },
  { nome: "Petto di pollo arrosto", categoria: "Proteine", kcal: 135, prot: 26.5, carbo: 0.0, grassi: 2.6 }
];

export function inizializzaAlimentiUI(onToggle, onEdit) {
  callbackToggleAlimento = onToggle;
  callbackEditAlimento = onEdit;

  // Gestione chiusura modale cliccando su Annulla
  document.getElementById('btnChiudiModalAlimento')?.addEventListener('click', chiudiModalAlimento);

  // Listener per l'autocomplete sul campo nome alimento
  const inputNome = document.getElementById('alim_nome');
  if (inputNome) {
    inputNome.addEventListener('input', (e) => {
      gestisciSuggerimenti(e.target.value);
    });

    // Chiudi i suggerimenti se si clicca fuori
    document.addEventListener('click', (e) => {
      const box = document.getElementById('suggerimentiAlimenti');
      if (box && !inputNome.contains(e.target) && !box.contains(e.target)) {
        box.classList.add('hidden');
      }
    });
  }
}

function gestisciSuggerimenti(testo) {
  const box = document.getElementById('suggerimentiAlimenti');
  if (!box) return;

  const query = (testo || '').toLowerCase().trim();
  if (query.length < 2) {
    box.classList.add('hidden');
    box.innerHTML = '';
    return;
  }

  const risultati = DATABASE_RIFERIMENTO.filter(item => 
    item.nome.toLowerCase().includes(query)
  );

  if (risultati.length === 0) {
    box.classList.add('hidden');
    box.innerHTML = '';
    return;
  }

  box.innerHTML = '';
  risultati.forEach(item => {
    const div = document.createElement('div');
    div.className = 'p-2.5 hover:bg-emerald-50 cursor-pointer text-xs flex justify-between items-center transition';
    div.innerHTML = `
      <span class="font-semibold text-gray-800">${item.nome}</span>
      <span class="text-gray-500 font-mono">${item.kcal} kcal | P:${item.prot}g C:${item.carbo}g G:${item.grassi}g</span>
    `;

    div.addEventListener('click', () => {
      // Compila automaticamente i campi
      document.getElementById('alim_nome').value = item.nome;
      document.getElementById('alim_categoria').value = item.categoria;
      document.getElementById('alim_kcal').value = item.kcal;
      document.getElementById('alim_prot').value = item.prot;
      document.getElementById('alim_carbo').value = item.carbo;
      document.getElementById('alim_grassi').value = item.grassi;

      box.classList.add('hidden');
    });

    box.appendChild(div);
  });

  box.classList.remove('hidden');
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
  const boxSuggerimenti = document.getElementById('suggerimentiAlimenti');
  if (!modal) return;

  if (boxSuggerimenti) boxSuggerimenti.classList.add('hidden');
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
  const boxSuggerimenti = document.getElementById('suggerimentiAlimenti');
  if (boxSuggerimenti) boxSuggerimenti.classList.add('hidden');
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
