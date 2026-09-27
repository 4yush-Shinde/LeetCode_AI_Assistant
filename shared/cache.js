import { getSession, setSession, clearSession, getLocal } from "./storage.js";

export function buildCacheKey(problemTitle, actionType, userCode, hintLevel) {
  const codePart = userCode ? simpleHash(userCode) : "nocode";
  const hintPart = actionType === "GIVE_HINT" ? `::hint${hintLevel ?? 1}` : "";
  return `${problemTitle}::${actionType}::${codePart}${hintPart}`;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
}

export async function getCachedResponse(key) {
  const { cacheEnabled = true } = await getLocal("cacheEnabled");
  if (!cacheEnabled) return null;
  const store = await getSession(key);
  return store[key] ?? null;
}

export async function setCachedResponse(key, value) {
  const { cacheEnabled = true } = await getLocal("cacheEnabled");
  if (!cacheEnabled) return;
  await setSession({ [key]: value });
}

export async function clearCache() {
  await clearSession();
}