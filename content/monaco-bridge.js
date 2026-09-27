// Injected into the MAIN world via chrome.scripting.executeScript.
// Runs in the page's actual JS context, so window.monaco is visible here —
// it is NOT visible from an isolated content script.
// Communicates back to the isolated world via window.postMessage,
// since chrome.runtime is unavailable in MAIN world.

(function () {
  const BRIDGE_REQUEST = "LEETCODE_AI_GET_CODE_REQUEST";
  const BRIDGE_RESPONSE = "LEETCODE_AI_GET_CODE_RESPONSE";

  function readEditorCode() {
    try {
      if (!window.monaco || !window.monaco.editor) {
        return { error: "Monaco editor not found on window" };
      }
      const models = window.monaco.editor.getModels();
      if (!models || models.length === 0) {
        return { error: "No editor models found" };
      }
      // Assumes single active editor model, typical on a problem page.
      const code = models[0].getValue();
      const language = models[0].getLanguageId?.() ?? null;
      return { code, language };
    } catch (err) {
      return { error: err.message };
    }
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.data?.type !== BRIDGE_REQUEST) return;

    const result = readEditorCode();
    window.postMessage({ type: BRIDGE_RESPONSE, result }, "*");
  });
})();