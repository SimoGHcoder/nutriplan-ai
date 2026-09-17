export function getConfigGH() {
  return JSON.parse(localStorage.getItem('configGH')) || { username: '', repo: '', token: '' };
}

export function saveConfigGH(config) {
  localStorage.setItem('configGH', JSON.stringify(config));
}

export function caricaCredenzialiUI() {
  const configGH = getConfigGH();
  if (configGH.username) document.getElementById('cfg_username').value = configGH.username;
  if (configGH.repo) document.getElementById('cfg_repo').value = configGH.repo;
  if (configGH.token) document.getElementById('cfg_token').value = configGH.token;
}

export function leggiCredenzialiForm() {
  return {
    username: document.getElementById('cfg_username').value.trim(),
    repo: document.getElementById('cfg_repo').value.trim(),
    token: document.getElementById('cfg_token').value.trim()
  };
}
