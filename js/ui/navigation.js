// js/ui/navigation.js

export function inizializzaNavigazione() {
  // Gestione tab principali
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const targetId = tab.getAttribute('data-target');
      
      // Nascondi tutte le sezioni
      document.querySelectorAll('main > section').forEach(sec => {
        sec.classList.add('hidden');
      });
      
      // Mostra la sezione selezionata
      document.getElementById(targetId)?.classList.remove('hidden');
      
      // Aggiorna lo stile attivo delle tab
      tabs.forEach(t => {
        t.classList.remove('border-white', 'bg-emerald-700', 'text-white');
        t.classList.add('border-transparent', 'text-emerald-100');
      });
      tab.classList.remove('border-transparent', 'text-emerald-100');
      tab.classList.add('border-white', 'bg-emerald-700', 'text-white');
    });
  });

  // Gestione Modale Impostazioni (Tasto Ingranaggio ⚙️)
  const btnSettings = document.getElementById('btnSettings');
  const modalConfig = document.getElementById('modalConfig');
  const btnChiudiConfig = document.getElementById('btnChiudiConfig');

  btnSettings?.addEventListener('click', () => {
    modalConfig?.classList.remove('hidden');
  });

  btnChiudiConfig?.addEventListener('click', () => {
    modalConfig?.classList.add('hidden');
  });

  // Chiudi modale cliccando sullo sfondo scuro
  modalConfig?.addEventListener('click', (e) => {
    if (e.target === modalConfig) {
      modalConfig.classList.add('hidden');
    }
  });
}
