// js/modules/alimenti.js

import { calcolaTargetNutrizionali } from './fabbisogno.js';

export function generaStrutturaPiano(alimentiData, utenteData) {
  const cibiAttivi = alimentiData.filter(a => a.attivo !== false);

  if (cibiAttivi.length === 0) {
    throw new Error('Nessun alimento attivo disponibile! Attiva qualche alimento dal menu "Alimenti".');
  }

  const target = calcolaTargetNutrizionali(utenteData.profilo || {});

  const ripartizione = [
    { nome: "Colazione", quota: 0.20 },
    { nome: "Spuntino Mattina", quota: 0.10 },
    { nome: "Pranzo", quota: 0.35 },
    { nome: "Spuntino Pomeriggio", quota: 0.10 },
    { nome: "Cena", quota: 0.25 }
  ];

  const piano = {
    data_creazione: new Date().toISOString().split('T')[0],
    target_totale: target,
    pasti: []
  };

  const fontiProteine = cibiAttivi.filter(c => c.categoria === 'Proteine');
  const fontiCarbo = cibiAttivi.filter(c => c.categoria === 'Carboidrati');

  const listaProt = fontiProteine.length > 0 ? fontiProteine : cibiAttivi;
  const listaCarbo = fontiCarbo.length > 0 ? fontiCarbo : cibiAttivi;

  ripartizione.forEach(pastoInfo => {
    const kcalTargetPasto = target.targetKcal * pastoInfo.quota;

    const protItem = listaProt[Math.floor(Math.random() * listaProt.length)];
    const carboItem = listaCarbo[Math.floor(Math.random() * listaCarbo.length)];

    const gProt = Math.round((kcalTargetPasto * 0.4) / ((protItem.calorie_100g || 100) / 100));
    const gCarbo = Math.round((kcalTargetPasto * 0.6) / ((carboItem.calorie_100g || 100) / 100));

    piano.pasti.push({
      pasto: pastoInfo.nome,
      target_kcal: Math.round(kcalTargetPasto),
      alimenti: [
        { nome: protItem.nome, grammi: gProt, kcal: Math.round((protItem.calorie_100g / 100) * gProt) },
        { nome: carboItem.nome, grammi: gCarbo, kcal: Math.round((carboItem.calorie_100g / 100) * gCarbo) }
      ]
    });
  });

  return piano;
}
