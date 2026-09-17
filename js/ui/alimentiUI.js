export function renderListaAlimenti(alimentiData, filtro = '', onToggle, onEdit) {
  const container = document.getElementById('listaAlimentiContainer');
  if (!container) return;

  if (!alimentiData || alimentiData.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 text-center py-4">Nessun alimento presente nel database.</p>`;
    return;
  }

  container.innerHTML = '';
  const cibiFiltrati = alimentiData.filter(a => a.nome.toLowerCase().includes(filtro.toLowerCase()));

  cibiFiltrati.forEach(a => {
    const isAttivo = a.attivo !== false;

    const card = document.createElement('div');
    card.className = `bg-slate-900 border ${isAttivo ? 'border-slate-800' : 'border-red-900/30 opacity-60'} p-3 rounded-xl flex items-center justify-between gap-2`;

    card.innerHTML = `
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-white">${a.nome}</span>
          <span class="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">${a.categoria || 'Generico'}</span>
        </div>
        <div class="text-[11px] text-slate-400 mt-1 flex gap-3 font-mono">
          <span>🔥 ${a.calorie_100g} kcal</span>
          <span>P: ${a.proteine_100g}g</span>
          <span>C: ${a.carboidrati_100g}g</span>
          <span>G: ${a.grassi_100g}g</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn-toggle text-xs px-2.5 py-1 rounded-lg border transition-all ${isAttivo ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}">
          ${isAttivo ? 'Attivo' : 'Inattivo'}
        </button>
        <button class="btn-edit p-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">✏️</button>
      </div>
    `;

    card.querySelector('.btn-toggle').addEventListener('click', () => onToggle(a.id));
    card.querySelector('.btn-edit').addEventListener('click', () => onEdit(a.id));

    container.appendChild(card);
  });
}

export function apriModalAlimento(alim = null) {
  document.getElementById('modalAlimento').classList.remove('hidden');
  if (alim) {
    document.getElementById('modalAlimentoTitolo').innerText = '✏️ Modifica Alimento';
    document.getElementById('editAlimentoId').value = alim.id;
    document.getElementById('alim_nome').value = alim.nome;
    document.getElementById('alim_categoria').value = alim.categoria || 'Proteine';
    document.getElementById('alim_kcal').value = alim.calorie_100g;
    document.getElementById('alim_prot').value = alim.proteine_100g;
    document.getElementById('alim_carbo').value = alim.carboidrati_100g;
    document.getElementById('alim_grassi').value = alim.grassi_100g;
  } else {
    document.getElementById('modalAlimentoTitolo').innerText = '➕ Aggiungi Alimento';
    document.getElementById('editAlimentoId').value = '';
    document.getElementById('alim_nome').value = '';
    document.getElementById('alim_kcal').value = '';
    document.getElementById('alim_prot').value = '';
    document.getElementById('alim_carbo').value = '';
    document.getElementById('alim_grassi').value = '';
  }
}

export function chiudiModalAlimento() {
  document.getElementById('modalAlimento').classList.add('hidden');
}

export function leggiAlimentoForm() {
  const id = document.getElementById('editAlimentoId').value;
  return {
    id: id || 'cibo_' + Date.now(),
    nome: document.getElementById('alim_nome').value.trim(),
    categoria: document.getElementById('alim_categoria').value,
    calorie_100g: parseFloat(document.getElementById('alim_kcal').value) || 0,
    proteine_100g: parseFloat(document.getElementById('alim_prot').value) || 0,
    carboidrati_100g: parseFloat(document.getElementById('alim_carbo').value) || 0,
    grassi_100g: parseFloat(document.getElementById('alim_grassi').value) || 0,
    attivo: true
  };
}
