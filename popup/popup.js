const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const problemRow = document.getElementById("problemRow");
const problemTitle = document.getElementById("problemTitle");
const openOptionsBtn = document.getElementById("openOptionsBtn");
const footerNote = document.getElementById("footerNote");

async function init() {
  const { apiKey } = await chrome.storage.local.get("apiKey");

  if (!apiKey) {
    setStatus("error", "No API key configured");
    footerNote.textContent = "Open Settings to add your Anthropic API key before using the extension.";
  } else {
    setStatus("ok", "API key configured");
  }

  await checkActiveTab();
}

async function checkActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.url || !tab.url.includes("leetcode.com/problems/")) {
    problemRow.hidden = true;
    if (footerNote.textContent === "") {
      footerNote.textContent = "Navigate to a LeetCode problem page to use the assistant.";
    }
    return;
  }

  // content.js does not currently expose a message handler for popup queries —
  // this asks it directly for the current problem title via the same
  // window.__laiCurrentTitle global it already sets. If content.js hasn't
  // loaded yet (page still loading), this will fail silently and the row
  // just stays hidden.
  try {
    const [{ result } = {}] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.__laiCurrentTitle ?? null
    });

    if (result) {
      problemRow.hidden = false;
      problemTitle.textContent = result;
    }
  } catch (err) {
    // Extension may not have permission/injection on this tab yet — non-fatal.
    problemRow.hidden = true;
  }
}

function setStatus(type, text) {
  statusDot.className = `status-dot ${type}`;
  statusText.textContent = text;
}

openOptionsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

init();