import { getLocal, setLocal } from "../shared/storage.js";
import { clearCache } from "../shared/cache.js";

const apiKeyInput = document.getElementById("apiKey");
const toggleVisibilityBtn = document.getElementById("toggleVisibility");
const modelSelect = document.getElementById("model");
const maxHintLevelSelect = document.getElementById("maxHintLevel");
const cacheEnabledCheckbox = document.getElementById("cacheEnabled");
const saveBtn = document.getElementById("saveBtn");
const clearCacheBtn = document.getElementById("clearCacheBtn");
const statusEl = document.getElementById("status");

async function loadSettings() {
  const {
    apiKey = "",
    model = "gemini-3.5-flash-lite",
    maxHintLevel = 2,
    cacheEnabled = true
  } = await getLocal(["apiKey", "model", "maxHintLevel", "cacheEnabled"]);

  apiKeyInput.value = apiKey;
  modelSelect.value = model;
  maxHintLevelSelect.value = String(maxHintLevel);
  cacheEnabledCheckbox.checked = cacheEnabled;
}

async function saveSettings() {
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    showStatus("API key cannot be empty.", "error");
    return;
  }

  if (!apiKey.startsWith("AIza")) {
    showStatus("Warning: key does not match expected Gemini key format. Saved anyway.", "error");
  }

  await setLocal({
    apiKey,
    model: modelSelect.value,
    maxHintLevel: Number(maxHintLevelSelect.value),
    cacheEnabled: cacheEnabledCheckbox.checked
  });

  showStatus("Settings saved.", "success");
}

async function handleClearCache() {
  await clearCache();
  showStatus("Cache cleared.", "success");
}

function toggleVisibility() {
  const isPassword = apiKeyInput.type === "password";
  apiKeyInput.type = isPassword ? "text" : "password";
  toggleVisibilityBtn.textContent = isPassword ? "Hide" : "Show";
}

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = type;
  setTimeout(() => {
    statusEl.textContent = "";
    statusEl.className = "";
  }, 3000);
}

toggleVisibilityBtn.addEventListener("click", toggleVisibility);
saveBtn.addEventListener("click", saveSettings);
clearCacheBtn.addEventListener("click", handleClearCache);

loadSettings();