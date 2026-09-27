// Isolated world. Mounts a shadow-DOM panel so LeetCode's CSS cannot bleed in
// and vice versa. Exposes mountSidebar/removeSidebar globals used by content.js.

let shadowHost = null;
let shadowRoot = null;
let hintLevelByTitle = {}; // resets on route change, tracked per problem

const BUTTONS = [
  { label: "Explain Problem", action: "EXPLAIN_PROBLEM" },
  { label: "Give Hint", action: "GIVE_HINT" },
  { label: "Show Approach", action: "SHOW_APPROACH" },
  { label: "Analyze Complexity", action: "ANALYZE_COMPLEXITY" },
  { label: "Explain My Code", action: "EXPLAIN_CODE", fullWidth: true }
];

function mountSidebar(problem) {
  if (shadowHost) removeSidebar();

  hintLevelByTitle = {}; // reset hint escalation for new problem

  shadowHost = document.createElement("div");
  shadowHost.id = "lai-shadow-host";
  document.body.appendChild(shadowHost);
  shadowRoot = shadowHost.attachShadow({ mode: "open" });

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("content/sidebar/sidebar.css");
  shadowRoot.appendChild(link);

  const panel = document.createElement("div");
  panel.className = "lai-panel";
  panel.innerHTML = `
    <div class="lai-header">
      <span>LeetCode AI — ${escapeHtml(problem.title ?? "Loading...")}</span>
      <button class="lai-close" title="Close">&times;</button>
    </div>
    <div class="lai-buttons"></div>
    <div class="lai-hint-note" hidden></div>
    <div class="lai-response" hidden></div>
  `;
  shadowRoot.appendChild(panel);

  const buttonContainer = panel.querySelector(".lai-buttons");
  BUTTONS.forEach(({ label, action, fullWidth }) => {
    const btn = document.createElement("button");
    btn.className = "lai-btn" + (fullWidth ? " full-width" : "");
    btn.textContent = label;
    btn.addEventListener("click", () => onButtonClick(action, btn, panel));
    buttonContainer.appendChild(btn);
  });

  panel.querySelector(".lai-close").addEventListener("click", removeSidebar);
  makeDraggable(panel, panel.querySelector(".lai-header"));
}

function removeSidebar() {
  if (shadowHost) {
    shadowHost.remove();
    shadowHost = null;
    shadowRoot = null;
  }
}

async function onButtonClick(actionType, clickedBtn, panel) {
  const allButtons = panel.querySelectorAll(".lai-btn");
  allButtons.forEach((b) => (b.disabled = true));

  const responseEl = panel.querySelector(".lai-response");
  const hintNoteEl = panel.querySelector(".lai-hint-note");
  responseEl.hidden = false;
  responseEl.className = "lai-response lai-loading";
  responseEl.textContent = "Thinking...";
  hintNoteEl.hidden = true;

  const title = window.__laiCurrentTitle ?? "unknown";
  let hintLevel;
  if (actionType === "GIVE_HINT") {
    hintLevel = (hintLevelByTitle[title] ?? 0) + 1;
    hintLevelByTitle[title] = hintLevel;
  }

  try {
    // handleAction is defined in content.js, loaded after this file but
    // resolved at click time, so it exists by the time this runs.
    const result = await handleAction(actionType, hintLevel);

    if (result?.error) {
      responseEl.className = "lai-response lai-error";
      responseEl.textContent = `Error: ${result.error}`;
    } else {
      responseEl.className = "lai-response";
      responseEl.textContent = result.text;
      if (actionType === "GIVE_HINT") {
        hintNoteEl.hidden = false;
        hintNoteEl.textContent = `Hint level ${hintLevel} — click again for a stronger hint.`;
      }
    }
  } catch (err) {
    responseEl.className = "lai-response lai-error";
    responseEl.textContent = `Unexpected error: ${err.message}`;
  } finally {
    allButtons.forEach((b) => (b.disabled = false));
  }
}

function makeDraggable(panel, handle) {
  let offsetX = 0, offsetY = 0, dragging = false;

  handle.addEventListener("mousedown", (e) => {
    dragging = true;
    offsetX = e.clientX - panel.getBoundingClientRect().left;
    offsetY = e.clientY - panel.getBoundingClientRect().top;
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    panel.style.left = `${e.clientX - offsetX}px`;
    panel.style.top = `${e.clientY - offsetY}px`;
    panel.style.right = "auto";
  });

  document.addEventListener("mouseup", () => {
    dragging = false;
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}