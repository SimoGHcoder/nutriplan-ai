export function renderPianoCorrente(utenteData) {
  const container = document.getElementById('pianoCorrenteContainer');
  if (!container) return;

  const piano = utenteData?.piano_corrente;
  if (!piano) {
    container.innerHTML = `<div class="text-center py-8 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">Nessun piano attivo. Clicca su "Genera Nuovo Piano" per crearlo.</div>`;
    return;
  }

  let html = `
    <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
      <div class="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h3 class="text-sm font-bold text-emerald-400">Piano Attivo del ${piano.data_creazione}</h3>
          <p class="text-[11px] text-slate-400">Target giornaliero generato</p>
        </div>
        <span class="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-mono font-bold">
          ${piano.target_totale.targetKcal} kcal
        </span>
      </div>

      <div class="space-y-3">
  `;

  piano.pasti.forEach(p => {
    html += `
      <div class="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
        <div class="flex justify-between items-center text-xs font-semibold text-slate-300 mb-2">
          <span class="text-emerald-400">${p.pasto}</span>
          <span class="text-slate-400 font-mono">${p.target_kcal} kcal</span>
        </div>
        <ul class="text-xs text-slate-300 space-y-1">
    `;
    p.alimenti.forEach(a => {
      html += `<li class="flex justify-between border-b border-slate-900 pb-1">
        <span>• ${a.nome}</span>
        <span class="font-mono text-slate-400">${a.grammi}g <span class="text-[10px] text-slate-500">(${a.kcal} kcal)</span></span>
      </li>`;
    });
    html += `</ul></div>`;
  });

  html += `</div></div>`;
  container.innerHTML = html;
}
