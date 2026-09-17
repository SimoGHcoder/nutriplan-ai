/ Registrazione Service Worker per PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(() => console.log("Service Worker Registrato"))
    .catch((err) => console.error("Errore SW:", err));
}

// Inizializzazione dati locali
let configGH = JSON.parse(localStorage.getItem('nutri_pwa_gh')) || { username: '', repo: '', token: '' };
let utenteData = null;
let alimentiData = [];

document.addEventListener("DOMContentLoaded", () => {
  caricaConfigInModal();
  inizializzaDati();
});

function toggleConfigModal() {
  document.getElementById('configModal').classList.toggle('hidden');
}

function caricaConfigInModal() {
  document.getElementById('ghUsername').value = configGH.username || '';
  document.getElementById('ghRepo').value = configGH.repo || 'pwa-nutrizionista';
  document.getElementById('ghToken').value = configGH.token || '';
}

function salvaConfigurazioneGH() {
  configGH = {
    username: document.getElementById('ghUsername').value.trim(),
    repo: document.getElementById('ghRepo').value.trim(),
    token: document.getElementById('ghToken').value.trim()
  };
  localStorage.setItem('nutri_pwa_gh', JSON.stringify(configGH));
  toggleConfigModal();
  alert("Credenziali salvate nel browser!");
  inizializzaDati();
}

// CARICAMENTO INIZIALE DATI DA GITHUB
async function inizializzaDati() {
  try {
    const resUtente = await fetch('data/utente_data.json');
    utenteData = await resUtente.json();
    
    const resAlimenti = await fetch('data/alimenti.json');
    alimentiData = await resAlimenti.json();

    popolaFormProfilo();
  } catch (err) {
    console.log("In attesa di configurazione dati...", err);
  }
}

function popolaFormProfilo() {
  if (!utenteData || !utenteData.profilo) return;
  const p = utenteData.profilo;
  document.getElementById('eta').value = p.eta;
  document.getElementById('sesso').value = p.sesso;
  document.getElementById('altezza').value = p.altezza_cm;
  document.getElementById('peso').value = p.peso_kg;
  document.getElementById('attivita').value = p.livello_attivita;
  document.getElementById('obiettivo').value = p.obiettivo;

  calcolaEmostraCalorie(p);
}

// FORMULA DI MIFFLIN-ST JEOR PER BMR E TDEE
function calcolaEmostraCalorie(profilo) {
  let bmr = (10 * profilo.peso_kg) + (6.25 * profilo.altezza_cm) - (5 * profilo.eta);
  bmr = profilo.sesso === 'm' ? bmr + 5 : bmr - 161;

  const tdee = Math.round(bmr * profilo.livello_attivita);
  let target = tdee;

  if (profilo.obiettivo === 'ipocalorica') target = Math.round(tdee * 0.85);
  if (profilo.obiettivo === 'ipercalorica') target = Math.round(tdee * 1.15);

  document.getElementById('resBMR').textContent = Math.round(bmr);
  document.getElementById('resTDEE').textContent = tdee;
  document.getElementById('resTarget').textContent = target;
  document.getElementById('risultatiNutri').classList.remove('hidden');

  return { bmr, tdee, target };
}

// FUNZIONE CENTRALE PER COMMIT AUTOMATICO SU GITHUB
async function salvaFileSuGitHub(pathFile, nuovoOggettoContenuto, commitMessage) {
  if (!configGH.username || !configGH.token) {
    alert("Configura prima lo Username e il Personal Access Token nelle Impostazioni!");
    toggleConfigModal();
    return false;
  }

  const url = `https://api.github.com/repos/${configGH.username}/${configGH.repo}/contents/${pathFile}`;

  try {
    // 1. Recupera SHA del file esistente
    const getRes = await fetch(url, {
      headers: { 'Authorization': `token ${configGH.token}` }
    });
    const fileMetaData = await getRes.json();
    const sha = fileMetaData.sha;

    // 2. Prepara contenuto Base64
    const stringaJSON = JSON.stringify(nuovoOggettoContenuto, null, 2);
    const contentBase64 = btoa(unescape(encodeURIComponent(stringaJSON)));

    // 3. Esegui PUT commit
    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${configGH.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: commitMessage,
        content: contentBase64,
        sha: sha
      })
    });

    if (putRes.ok) {
      alert("Sincronizzazione GitHub completata!");
      return true;
    } else {
      const errorData = await putRes.json();
      alert("Errore GitHub API: " + errorData.message);
      return false;
    }
  } catch (err) {
    alert("Errore durante la sincronizzazione: " + err.message);
    return false;
  }
}

// SALVATAGGIO PROFILO
async function salvaProfilo(e) {
  e.preventDefault();
  
  const nuovoProfilo = {
    eta: parseInt(document.getElementById('eta').value),
    sesso: document.getElementById('sesso').value,
    altezza_cm: parseFloat(document.getElementById('altezza').value),
    peso_kg: parseFloat(document.getElementById('peso').value),
    livello_attivita: parseFloat(document.getElementById('attivita').value),
    obiettivo: document.getElementById('obiettivo').value
  };

  utenteData.profilo = nuovoProfilo;
  
  // Registra storico peso
  const oggi = new Date().toISOString().split('T')[0];
  utenteData.progressi.push({ data: oggi, peso_kg: nuovoProfilo.peso_kg, note: "Aggiornamento profilo" });

  calcolaEmostraCalorie(nuovoProfilo);

  await salvaFileSuGitHub('data/utente_data.json', utenteData, 'Aggiornamento profilo utente da PWA');
}

// AGGIUNTA ALIMENTO
async function aggiungiAlimento(e) {
  e.preventDefault();

  const prot = parseFloat(document.getElementById('foodProt').value);
  const carbo = parseFloat(document.getElementById('foodCarbo').value);
  const grassi = parseFloat(document.getElementById('foodGrassi').value);
  const kcal = Math.round((prot * 4) + (carbo * 4) + (grassi * 9));

  const nuovoAlimento = {
    id: "cibo_" + Date.now(),
    nome: document.getElementById('foodNome').value,
    categoria: "Personalizzato",
    unita: "g",
    calorie_100g: kcal,
    proteine_100g: prot,
    carboidrati_100g: carbo,
    grassi_100g: grassi
  };

  alimentiData.push(nuovoAlimento);

  const successo = await salvaFileSuGitHub('data/alimenti.json', alimentiData, `Aggiunto alimento ${nuovoAlimento.nome}`);
  if (successo) {
    document.getElementById('foodForm').reset();
  }
}
