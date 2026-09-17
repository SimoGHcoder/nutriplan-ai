export function calcolaTargetNutrizionali(p) {
  if (!p.peso_kg || !p.altezza_cm || !p.eta) {
    return { targetKcal: 2000, targetProteine: 150, targetCarbo: 200, targetGrassi: 60 };
  }

  let bmr = (10 * p.peso_kg) + (6.25 * p.altezza_cm) - (5 * p.eta);
  bmr = p.sesso === 'm' ? bmr + 5 : bmr - 161;

  let tdee = bmr * (p.livello_attivita || 1.375);

  if (p.obiettivo === 'dimagrimento') tdee *= 0.85;
  if (p.obiettivo === 'massa') tdee *= 1.10;

  const targetKcal = Math.round(tdee);
  const proteine = Math.round(p.peso_kg * 2.0);
  const grassi = Math.round(p.peso_kg * 0.9);
  const kcalRestanti = targetKcal - (proteine * 4 + grassi * 9);
  const carbo = Math.max(0, Math.round(kcalRestanti / 4));

  return { targetKcal, targetProteine: proteine, targetCarbo: carbo, targetGrassi: grassi };
}
