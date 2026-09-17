// js/services/githubService.js

export function getConfigGH() {
  return {
    token: localStorage.getItem('gh_token') || '',
    username: localStorage.getItem('gh_username') || '',
    repo: localStorage.getItem('gh_repo') || '',
    profiloId: localStorage.getItem('gh_profilo_id') || 'default'
  };
}

export async function caricaFileDaGitHub(pathFile) {
  const cfg = getConfigGH();
  if (!cfg.token || !cfg.username || !cfg.repo) return null;

  const url = `https://api.github.com/repos/${cfg.username}/${cfg.repo}/contents/${pathFile}`;
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
  if (!cfg.token || !cfg.username || !cfg.repo) {
    throw new Error('Configurazione GitHub mancante nelle impostazioni.');
  }

  const url = `https://api.github.com/repos/${cfg.username}/${cfg.repo}/contents/${pathFile}`;
  let sha = null;

  // 1. Ottieni lo sha corrente del file (necessario per l'update su GitHub)
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
    // File non esiste ancora, verrà creato ex novo
  }

  // 2. Prepara il payload in base64
  const contentString = JSON.stringify(jsonObject, null, 2);
  const contentBase64 = btoa(unescape(encodeURIComponent(contentString)));

  const bodyData = {
    message: messaggioCommit || `Aggiornamento ${pathFile}`,
    content: contentBase64
  };
  if (sha) bodyData.sha = sha;

  // 3. Esegui la chiamata PUT
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
