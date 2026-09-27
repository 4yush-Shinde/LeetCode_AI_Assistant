// Isolated world. Orchestrates extraction, injects monaco-bridge into MAIN world,
// mounts sidebar UI, and relays messages to/from background.js.

let currentProblem = null;

async function init() {
  try {
    currentProblem = await extractProblem();
    window.__laiCurrentTitle = currentProblem.title;
  } catch (err) {
    console.error("[LeetCode AI] Failed to extract problem:", err);
    return;
  }

  mountSidebar(currentProblem);
  observeRouteChanges();
}

function observeRouteChanges() {
  let lastPath = location.pathname;
  const observer = new MutationObserver(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      handleRouteChange();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

async function handleRouteChange() {
  removeSidebar();
  try {
    currentProblem = await extractProblem();
    window.__laiCurrentTitle = currentProblem.title;
    mountSidebar(currentProblem);
  } catch (err) {
    console.error("[LeetCode AI] Re-extraction failed on route change:", err);
    window.__laiCurrentTitle = "unknown";
  }
}

function getUserCode() {
  return new Promise((resolve) => {
    const BRIDGE_REQUEST = "LEETCODE_AI_GET_CODE_REQUEST";
    const BRIDGE_RESPONSE = "LEETCODE_AI_GET_CODE_RESPONSE";

    function handleMessage(event) {
      if (event.source !== window) return;
      if (event.data?.type !== BRIDGE_RESPONSE) return;
      window.removeEventListener("message", handleMessage);
      resolve(event.data.result);
    }

    window.addEventListener("message", handleMessage);

    chrome.runtime.sendMessage({ type: MSG.INJECT_BRIDGE }, () => {
      window.postMessage({ type: BRIDGE_REQUEST }, "*");
    });

    setTimeout(() => {
      window.removeEventListener("message", handleMessage);
      resolve({ error: "Timed out waiting for editor bridge" });
    }, 3000);
  });
}

// hintLevel is undefined for every action except GIVE_HINT, where sidebar.js
// computes and passes the escalating level.
async function handleAction(actionType, hintLevel) {
  if (!currentProblem) {
    return { error: "Problem data not yet loaded" };
  }

  let userCode = null;
  if (actionType === "ANALYZE_COMPLEXITY" || actionType === "EXPLAIN_CODE") {
    userCode = await getUserCode();
    if (userCode?.error) {
      return { error: `Could not read editor: ${userCode.error}` };
    }
  }

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: MSG.ASK_AI,
        payload: {
          actionType,
          problem: currentProblem,
          userCode: userCode?.code ?? null,
          language: userCode?.language ?? null,
          hintLevel: hintLevel ?? null
        }
      },
      (response) => resolve(response)
    );
  });
}

init();