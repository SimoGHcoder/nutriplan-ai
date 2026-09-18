// js/services/githubService.js

// Modifica qui il nome del tuo repository se dovesse essere diverso
const REPO_NAME = "nutriplan-ai";

export function getConfigGH() {
  return {
    token: localStorage.getItem('gh_token') || '',
    profiloId: localStorage.getItem('gh_profilo_id') || 'default'
  };
}

// Funzione per ricavare automaticamente lo username GitHub associato al token
async function getUsernameFromToken(token) {
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (!res.ok) {
      console.error("Errore verifica token GitHub:", res.status, res.statusText);
      return null;
    }
    const data = await res.json();
    return data.login;
  } catch (e) {
    console.error("Eccezione durante il recupero dello username GitHub:", e);
    return null;
  }
}

export async function caricaFileDaGitHub(pathFile) {
  const cfg = getConfigGH();
  if (!cfg.token) return null;

  const username = await getUsernameFromToken(cfg.token);
  if (!username) return null;

  const url = `https://api.github.com/repos/${username}/${REPO_NAME}/contents/${pathFile}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${cfg.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!res.ok) {
      console.warn(`File ${pathFile} non trovato su GitHub (potrebbe essere la prima creazione).`);
      return null;
    }
    const data = await res.json();
    const contentDecoded = decodeURIComponent(escape(atob(data.content)));
    return JSON.parse(contentDecoded);
  } catch (err) {
    console.warn(`Impossibile caricare ${pathFile} da GitHub:`, err);
    return null;
  }
}

export async function salvaFileSuGitHub(pathFile, jsonObject, messaggioCommit) {
  const cfg = getConfigGH();
  if (!cfg.token) {
    throw new Error('Token GitHub mancante nelle impostazioni.');
  }

  const username = await getUsernameFromToken(cfg.token);
  if (!username) {
    throw new Error('Token GitHub non valido o scaduto.');
  }

  const url = `https://api.github.com/repos/${username}/${REPO_NAME}/contents/${pathFile}`;
  let sha = null;

  // 1. Verifica se il file esiste già per ottenere il suo SHA (obbligatorio per aggiornare i file su GitHub)
  try {
    const resGet = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${cfg.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (resGet.ok) {
      const fileData = await resGet.json();
      sha = fileData.sha;
    }
  } catch (e) {
    console.log(`Il file ${pathFile} non esiste ancora, verrà creato.`);
  }

  // 2. Codifica corretta del contenuto in base64 UTF-8
  const contentString = JSON.stringify(jsonObject, null, 2);
  const contentBase64 = btoa(unescape(encodeURIComponent(contentString)));

  const bodyData = {
    message: messaggioCommit || `Aggiornamento ${pathFile}`,
    content: contentBase64
  };
  
  if (sha) {
    bodyData.sha = sha;
  }

  // 3. Invio della richiesta PUT a GitHub
  const resPut = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${cfg.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyData)
  });

  if (!resPut.ok) {
    const errJson = await resPut.json();
    console.error("Risposta errore GitHub API:", errJson);
    throw new Error(errJson.message || 'Errore durante il salvataggio su GitHub');
  }

  const resultData = await resPut.json();
  console.log(`File ${pathFile} salvato con successo su GitHub!`, resultData);
  return resultData;
}

// Aggiungi questa funzione in js/services/githubService.js

export async function elencaProfiliGitHub() {
  const cfg = getConfigGH();
  if (!cfg.token) return [];

  const username = await getUsernameFromToken(cfg.token);
  if (!username) return [];

  const url = `https://api.github.com/repos/${username}/${REPO_NAME}/contents/data`;
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${cfg.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!res.ok) return [];
    const files = await res.json();

    // Filtra i file che iniziano con "utente_" e terminano con ".json"
    // Estrae il nome del profilo (es. "utente_simone.json" -> "simone")
    const profili = files
      .filter(file => file.name.startsWith('utente_') && file.name.endsWith('.json'))
      .map(file => file.name.replace('utente_', '').replace('.json', ''));

    return profili;
  } catch (err) {
    console.warn("Impossibile elencare i profili da GitHub:", err);
    return [];
  }
}
