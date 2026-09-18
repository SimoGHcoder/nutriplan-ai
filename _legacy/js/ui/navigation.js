// js/ui/navigation.js

export function inizializzaNavigazione() {
  // Gestione tab principali
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-target');
      
      document.querySelectorAll('main > section').forEach(sec => {
        sec.classList.add('hidden');
      });
      
      document.getElementById(targetId)?.classList.remove('hidden');
      
      tabs.forEach(t => {
        t.classList.remove('border-white', 'bg-emerald-700', 'text-white');
        t.classList.add('border-transparent', 'text-emerald-100');
      });
      tab.classList.remove('border-transparent', 'text-emerald-100');
      tab.classList.add('border-white', 'bg-emerald-700', 'text-white');
    });
  });

  // Gestione Modale Impostazioni
  const btnSettings = document.getElementById('btnSettings');
  const modalConfig = document.getElementById('modalConfig');
  const btnChiudiConfig = document.getElementById('btnChiudiConfig');
  const inputProfiloId = document.getElementById('cfg_profilo_id');
  const lblPreview = document.getElementById('lblNomeFilePreview');

  const aggiornaAnteprimaFile = () => {
    const id = inputProfiloId?.value.trim() || 'default';
    if (lblPreview) lblPreview.textContent = `data/utente_${id}.json`;
  };

  inputProfiloId?.addEventListener('input', aggiornaAnteprimaFile);

  btnSettings?.addEventListener('click', () => {
    // Carica i dati salvati nel form impostazioni se esistono
    if (document.getElementById('cfg_token')) document.getElementById('cfg_token').value = localStorage.getItem('gh_token') || '';
    if (document.getElementById('cfg_username')) document.getElementById('cfg_username').value = localStorage.getItem('gh_username') || '';
    if (document.getElementById('cfg_repo')) document.getElementById('cfg_repo').value = localStorage.getItem('gh_repo') || '';
    if (inputProfiloId) inputProfiloId.value = localStorage.getItem('gh_profilo_id') || 'default';
    
    aggiornaAnteprimaFile();
    modalConfig?.classList.remove('hidden');
  });

  btnChiudiConfig?.addEventListener('click', () => {
    modalConfig?.classList.add('hidden');
  });

  modalConfig?.addEventListener('click', (e) => {
    if (e.target === modalConfig) {
      modalConfig.classList.add('hidden');
    }
  });
}
