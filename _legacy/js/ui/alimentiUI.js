// js/ui/alimentiUI.js

let callbackToggleStato = null;
let callbackModificaAlimento = null;

export function inizializzaAlimentiUI(fnToggle, fnModifica) {
  callbackToggleStato = fnToggle;
  callbackModificaAlimento = fnModifica;

  // Gestione chiusura modale alimenti
  document.getElementById('btnChiudiModalAlimento')?.addEventListener('click', chiudiModalAlimento);
  document.getElementById('btnAnnullaAlimento')?.addEventListener('click', chiudiModalAlimento);

  // Input di ricerca nel modale alimento per autocompletamento online
  const inputNome = document.getElementById('alimento_nome');
  if (inputNome) {
    let timeoutId;
    inputNome.addEventListener('input', (e) => {
      clearTimeout(timeoutId);
      const query = e.target.value.trim();
      
      // Ritardo di 300ms per evitare chiamate eccessive durante la digitazione
      timeoutId = setTimeout(() => {
        cercaAlimentiGenerale(query);
      }, 300);
    });

    // Chiude il box suggerimenti se si clicca fuori
    document.addEventListener('click', (e) => {
      const box = document.getElementById('suggerimentiAlimenti');
      const container = document.getElementById('containerNomeAlimento');
      if (box && container && !container.contains(e.target)) {
        box.classList.add('hidden');
      }
    });
  }
}

// -------------------------------------------------------------------------
// RICERCA ONLINE (Open Food Facts filtrata senza marche)
// -------------------------------------------------------------------------
async function cercaAlimentiGenerale(query) {
  const box = document.getElementById('suggerimentiAlimenti');
  if (!box) return;

  if (!query || query.length < 2) {
    box.classList.add('hidden');
    return;
  }

  box.innerHTML = `<div class="p-2.5 text-xs text-gray-400 text-center">⏳ Ricerca online in corso...</div>`;
  box.classList.remove('hidden');

  let risultatiTrovati = [];

  try {
    const url = `https://it.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=30`;
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
          let nomePuro = p.product_name.trim();

          // Rimuove la marca dal nome del prodotto se presente nel campo brands
          if (p.brands) {
            const primaMarca = p.brands.split(',')[0].trim();
            const regexMarca = new RegExp(primaMarca, 'gi');
            nomePuro = nomePuro.replace(regexMarca, '').trim();
          }

          nomePuro = nomePuro.replace(/^[-,\s]+|[-,\s]+$/, '').trim();
          if (!nomePuro) nomePuro = p.product_name;

          const nomeNormalizzato = nomePuro.toLowerCase();
          if (!risultatiTrovati.some(r => r.nome.toLowerCase() === nomeNormalizzato)) {
            const isUova = nomeNormalizzato.includes('uov');
            
            risultatiTrovati.push({
              nome: capitalizeFirst(nomePuro),
              categoria: determinaCategoria(nomeNormalizzato),
              unita_misura: isUova ? 'pz' : 'g',
              peso_unita: isUova ? 60 : 100,
              calorie_100g: parseFloat(kcal.toFixed(1)),
              proteine_100g: parseFloat(prot.toFixed(1)),
              carboidrati_100g: parseFloat(carbo.toFixed(1)),
              grassi_100g: parseFloat(grassi.toFixed(1))
            });
          }
        }
      });
    }
  } catch (err) {
    console.warn("Errore ricerca online alimenti:", err);
  }

  mostraBoxSuggerimenti(risultatiTrovati);
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function determinaCategoria(nome) {
  const n = nome.toLowerCase();
  if (n.includes('olio') || n.includes('burro') || n.includes('frutta secca') || n.includes('mandorl') || n.includes('noci')) return 'Grassi';
  if (n.includes('pollo') || n.includes('tacchino') || n.includes('carne') || n.includes('pesce') || n.includes('salmone') || n.includes('tonno') || n.includes('uov') || n.includes('albume') || n.includes('proteine')) return 'Proteine';
  return 'Carboidrati';
}

function mostraBoxSuggerimenti(lista) {
  const box = document.getElementById('suggerimentiAlimenti');
  if (!box) return;

  if (lista.length === 0) {
    box.innerHTML = `<div class="p-2.5 text-xs text-gray-400 text-center">Nessun alimento trovato online. Inserisci i dati manualmente.</div>`;
    box.classList.remove('hidden');
    return;
  }

  box.innerHTML = lista.map((item, index) => `
    <div class="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 text-xs flex justify-between items-center" data-index="${index}">
      <div>
        <span class="font-medium text-gray-800 dark:text-gray-200">${item.nome}</span>
        <span class="text-[10px] text-gray-500 ml-1.5 bg-gray-200 dark:bg-gray-600 px-1 py-0.5 rounded">${item.categoria}</span>
      </div>
      <div class="text-right text-[11px] text-gray-600 dark:text-gray-400">
        <span>${item.calorie_100g} kcal</span> | 
        <span class="text-blue-500">P:${item.proteine_100g}g</span> 
        <span class="text-amber-500">C:${item.carboidrati_100g}g</span> 
        <span class="text-rose-500">G:${item.grassi_100g}g</span>
      </div>
    </div>
  `).join('');

  box.classList.remove('hidden');

  box.querySelectorAll('div[data-index]').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-index'));
      applicaAlimentoSelezionato(lista[idx]);
      box.classList.add('hidden');
    });
  });
}

function applicaAlimentoSelezionato(item) {
  document.getElementById('alimento_nome').value = item.nome;
  document.getElementById('alimento_categoria').value = item.categoria;
  document.getElementById('alimento_unita').value = item.unita_misura;
  document.getElementById('alimento_peso_unita').value = item.peso_unita;
  document.getElementById('alimento_calorie').value = item.calorie_100g;
  document.getElementById('alimento_proteine').value = item.proteine_100g;
  document.getElementById('alimento_carboidrati').value = item.carboidrati_100g;
  document.getElementById('alimento_grassi').value = item.grassi_100g;
}

// -------------------------------------------------------------------------
// RENDER DELLA LISTA ALIMENTI SALVATI
// -------------------------------------------------------------------------
export function renderListaAlimenti(alimentiData, filtro = '') {
  const container = document.getElementById('listaAlimentiContainer');
  if (!container) return;

  const filtroLower = filtro.toLowerCase().trim();
  const alimentiFiltrati = alimentiData.filter(a => 
    a.nome.toLowerCase().includes(filtroLower) || 
    (a.categoria && a.categoria.toLowerCase().includes(filtroLower))
  );

  if (alimentiFiltrati.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-8 text-gray-400 text-sm">
        Nessun alimento trovato ${filtro ? 'per la ricerca corrente' : 'nel database locale'}. Clicca su "+ Nuovo Alimento" per aggiungerne uno.
      </div>
    `;
    return;
  }

  container.innerHTML = alimentiFiltrati.map(alimento => {
    const isAttivo = alimento.attivo !== false;
    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between transition-all hover:shadow-md ${!isAttivo ? 'opacity-50 grayscale' : ''}">
        <div>
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-semibold text-gray-800 dark:text-gray-100 text-sm leading-snug">${alimento.nome}</h3>
            <span class="text-[10px] px-2 py-0.5 rounded-full font-medium ${getCategoriaBadgeClass(alimento.categoria)}">
              ${alimento.categoria || 'Generico'}
            </span>
          </div>
          
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-3 space-y-0.5">
            <div>Unità base: <strong>100${alimento.unita_misura || 'g'}</strong> (${alimento.peso_unita || 100}g)</div>
            <div class="font-medium text-gray-700 dark:text-gray-300">Valori per 100g:</div>
          </div>

          <div class="grid grid-cols-4 gap-1 text-center bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg mb-3 text-xs">
            <div>
              <div class="text-[10px] text-gray-400">Kcal</div>
              <div class="font-bold text-gray-800 dark:text-gray-200">${alimento.calorie_100g || 0}</div>
            </div>
            <div>
              <div class="text-[10px] text-blue-500">Pro</div>
              <div class="font-bold text-blue-600 dark:text-blue-400">${alimento.proteine_100g || 0}g</div>
            </div>
            <div>
              <div class="text-[10px] text-amber-500">Carb</div>
              <div class="font-bold text-amber-600 dark:text-amber-400">${alimento.carboidrati_100g || 0}g</div>
            </div>
            <div>
              <div class="text-[10px] text-rose-500">Grassi</div>
              <div class="font-bold text-rose-600 dark:text-rose-400">${alimento.grassi_100g || 0}g</div>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700 text-xs">
          <button onclick="window.toggleStatoAlimento('${alimento.id}')" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
            <i class="fa-solid ${isAttivo ? 'fa-toggle-on text-emerald-500 text-sm' : 'fa-toggle-off text-gray-400 text-sm'}"></i>
            <span>${isAttivo ? 'Attivo' : 'Disattivato'}</span>
          </button>
          
          <button onclick="window.apriModaleModificaAlimento('${alimento.id}')" class="text-blue-500 hover:text-blue-600 font-medium">
            <i class="fa-solid fa-pen-to-square mr-1"></i>Modifica
          </button>
        </div>
      </div>
    `;
  }).join('');

  window.toggleStatoAlimento = callbackToggleStato;
  window.apriModaleModificaAlimento = callbackModificaAlimento;
}

function getCategoriaBadgeClass(categoria) {
  switch ((categoria || '').toLowerCase()) {
    case 'proteine': return 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    case 'carboidrati': return 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
    case 'grassi': return 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400';
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  }
}

// -------------------------------------------------------------------------
// GESTIONE MODALE (APERTURA / CHIUSURA / LETTURA FORM)
// -------------------------------------------------------------------------
export function apriModalAlimento(alimento = null) {
  const modal = document.getElementById('modalAlimento');
  const titolo = document.getElementById('modalAlimentoTitolo');
  if (!modal) return;

  document.getElementById('formAlimento')?.reset();
  document.getElementById('alimento_id').value = alimento ? alimento.id : 'cibo_' + Date.now();

  if (alimento) {
    if (titolo) titolo.textContent = 'Modifica Alimento';
    document.getElementById('alimento_nome').value = alimento.nome || '';
    document.getElementById('alimento_categoria').value = alimento.categoria || 'Carboidrati';
    document.getElementById('alimento_unita').value = alimento.unita_misura || 'g';
    document.getElementById('alimento_peso_unita').value = alimento.peso_unita || 100;
    document.getElementById('alimento_calorie').value = alimento.calorie_100g || 0;
    document.getElementById('alimento_proteine').value = alimento.proteine_100g || 0;
    document.getElementById('alimento_carboidrati').value = alimento.carboidrati_100g || 0;
    document.getElementById('alimento_grassi').value = alimento.grassi_100g || 0;
  } else {
    if (titolo) titolo.textContent = 'Nuovo Alimento';
    document.getElementById('alimento_peso_unita').value = 100;
    document.getElementById('alimento_unita').value = 'g';
  }

  modal.classList.remove('hidden');
}

export function chiudiModalAlimento() {
  const modal = document.getElementById('modalAlimento');
  if (modal) modal.classList.add('hidden');
  const boxSuggerimenti = document.getElementById('suggerimentiAlimenti');
  if (boxSuggerimenti) boxSuggerimenti.classList.add('hidden');
}

export function leggiAlimentoForm() {
  return {
    id: document.getElementById('alimento_id')?.value || ('cibo_' + Date.now()),
    nome: document.getElementById('alimento_nome')?.value.trim() || '',
    categoria: document.getElementById('alimento_categoria')?.value || 'Carboidrati',
    unita_misura: document.getElementById('alimento_unita')?.value || 'g',
    peso_unita: parseFloat(document.getElementById('alimento_peso_unita')?.value) || 100,
    calorie_100g: parseFloat(document.getElementById('alimento_calorie')?.value) || 0,
    proteine_100g: parseFloat(document.getElementById('alimento_proteine')?.value) || 0,
    carboidrati_100g: parseFloat(document.getElementById('alimento_carboidrati')?.value) || 0,
    grassi_100g: parseFloat(document.getElementById('alimento_grassi')?.value) || 0
  };
}
