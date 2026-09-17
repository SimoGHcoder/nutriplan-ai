// js/services/githubService.js

// Repository fisso condiviso
const REPO_NAME = "pwa-nutrizionista";

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
    if (!res.ok) return null;
    const data = await res.json();
    return data.login; // Ritorna il nome utente esatto di GitHub
  } catch (e) {
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

    if (!res.ok) return null;
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
    // File non esiste, verrà creato
  }

  const contentString = JSON.stringify(jsonObject, null, 2);
  const contentBase64 = btoa(unescape(encodeURIComponent(contentString)));

  const bodyData = {
    message: messaggioCommit || `Aggiornamento ${pathFile}`,
    content: contentBase64
  };
  if (sha) bodyData.sha = sha;

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
    throw new Error(errJson.message || 'Errore durante il salvataggio su GitHub');
  }

  return await resPut.json();
}
