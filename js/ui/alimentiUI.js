// js/ui/alimentiUI.js

let callbackToggleAlimento = null;
let callbackEditAlimento = null;

export function inizializzaAlimentiUI(onToggle, onEdit) {
  callbackToggleAlimento = onToggle;
  callbackEditAlimento = onEdit;

  // Gestione chiusura modale cliccando su Annulla
  document.getElementById('btnChiudiModalAlimento')?.addEventListener('click', chiudiModalAlimento);
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
