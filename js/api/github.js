import { getConfigGH } from '../config.js';

export async function caricaFileDaGitHub(pathFile) {
  const configGH = getConfigGH();
  if (!configGH.token || !configGH.username || !configGH.repo) return null;

  const url = `https://api.github.com/repos/${configGH.username}/${configGH.repo}/contents/${pathFile}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `token ${configGH.token}`, 'Accept': 'application/vnd.github.v3+json' },
    cache: 'no-store'
  });

  if (!res.ok) return null;
  const data = await res.json();
  const content = decodeURIComponent(escape(atob(data.content)));
  return JSON.parse(content);
}

export async function salvaFileSuGitHub(pathFile, contenuto, commitMessage) {
  const configGH = getConfigGH();
  if (!configGH.token || !configGH.username || !configGH.repo) return;

  const url = `https://api.github.com/repos/${configGH.username}/${configGH.repo}/contents/${pathFile}`;
  
  let sha = null;
  try {
    const getRes = await fetch(url, {
      headers: { 'Authorization': `token ${configGH.token}` },
      cache: 'no-store'
    });
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }
  } catch (e) {
    console.log('File nuovo, nessun SHA precedente');
  }

  const jsonStr = JSON.stringify(contenuto, null, 2);
  const contentBase64 = btoa(unescape(encodeURIComponent(jsonStr)));

  await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${configGH.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: commitMessage,
      content: contentBase64,
      sha: sha || undefined
    })
  });
}
