// lib/modules/fabbisogno.js
// Calcolo BMR, TDEE e target calorico — INVARIATO dal progetto originale

export function calcolaFabbisogno(p) {
  if (!p.peso_kg || !p.altezza_cm || !p.eta) {
    return { bmr: 0, tdee: 0, target: 0, lbm: 0 };
  }

  let bmr = 0;
  let lbm = 0;

  // Katch-McArdle se disponibile la % grasso corporeo
  if (p.grasso_perc && p.grasso_perc > 0 && p.grasso_perc < 60) {
    lbm = p.peso_kg * (1 - p.grasso_perc / 100);
    bmr = 370 + (21.6 * lbm);
  } else {
    // Mifflin-St Jeor
    lbm = p.muscolo_kg || (p.peso_kg * 0.75);
    if (p.sesso === 'M') {
      bmr = (10 * p.peso_kg) + (6.25 * p.altezza_cm) - (5 * p.eta) + 5;
    } else {
      bmr = (10 * p.peso_kg) + (6.25 * p.altezza_cm) - (5 * p.eta) - 161;
    }
  }

  const lafMap = {
    sedentario:    1.2,
    leggero:       1.375,
    moderato:      1.55,
    intenso:       1.725,
    molto_intenso: 1.9,
  };
  const laf = lafMap[p.livello_attivita] || 1.2;
  const tdee = bmr * laf;

  let target = tdee;
  if (p.obiettivo === 'dimagrimento_leggero') target -= 300;
  if (p.obiettivo === 'dimagrimento_intenso') target -= 500;
  if (p.obiettivo === 'massa') target += 300;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    target: Math.round(target),
    lbm: Math.round(lbm * 10) / 10,
  };
}

export function calcolaTargetNutrizionali(p) {
  const { target } = calcolaFabbisogno(p);
  const kcal = target || 2000;

  const proteine = Math.round((p.peso_kg || 70) * 2.0);
  const grassi   = Math.round((p.peso_kg || 70) * 0.9);
  const kcalRestanti = kcal - (proteine * 4 + grassi * 9);
  const carbo = Math.max(0, Math.round(kcalRestanti / 4));

  return {
    targetKcal:     kcal,
    targetProteine: proteine,
    targetCarbo:    carbo,
    targetGrassi:   grassi,
  };
}
