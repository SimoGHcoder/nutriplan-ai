import { calcolaTargetNutrizionali } from '../modules/fabbisogno.js';

export function popolaUIProfilo(utenteData) {
  const p = utenteData?.profilo || {};
  if (p.eta) document.getElementById('prof_eta').value = p.eta;
  if (p.sesso) document.getElementById('prof_sesso').value = p.sesso;
  if (p.altezza_cm) document.getElementById('prof_altezza').value = p.altezza_cm;
  if (p.peso_kg) document.getElementById('prof_peso').value = p.peso_kg;
  if (p.livello_attivita) document.getElementById('prof_attivita').value = p.livello_attivita;
  if (p.obiettivo) document.getElementById('prof_obiettivo').value = p.obiettivo;

  aggiornaResocontoFabbisogno();
}

export function leggiProfiloForm() {
  return {
    eta: parseInt(document.getElementById('prof_eta').value) || 28,
    sesso: document.getElementById('prof_sesso').value || 'm',
    altezza_cm: parseFloat(document.getElementById('prof_altezza').value) || 175,
    peso_kg: parseFloat(document.getElementById('prof_peso').value) || 70,
    livello_attivita: parseFloat(document.getElementById('prof_attivita').value) || 1.375,
    obiettivo: document.getElementById('prof_obiettivo').value || 'mantenimento'
  };
}

export function aggiornaResocontoFabbisogno() {
  const p = leggiProfiloForm();
  const res = calcolaTargetNutrizionali(p);

  document.getElementById('targetKcalVal').innerText = res.targetKcal;
  document.getElementById('targetProtVal').innerText = res.targetProteine + 'g';
  document.getElementById('targetCarboVal').innerText = res.targetCarbo + 'g';
  document.getElementById('targetGrassiVal').innerText = res.targetGrassi + 'g';
}
