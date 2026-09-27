export async function getLocal(keys) {
  return chrome.storage.local.get(keys);
}

export async function setLocal(obj) {
  return chrome.storage.local.set(obj);
}

export async function getSession(keys) {
  return chrome.storage.session.get(keys);
}

export async function setSession(obj) {
  return chrome.storage.session.set(obj);
}

export async function clearSession() {
  return chrome.storage.session.clear();
}