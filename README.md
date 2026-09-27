# LeetCode AI Assistant

A Chrome extension that reads the LeetCode problem you're on and gives you AI-generated help — explanations, hints, approach breakdowns, complexity analysis, and code walkthroughs — without ever leaving the page.

---

## What It Does

While you're on any `leetcode.com/problems/*` page, a floating sidebar panel appears with five actions:

| Button | What it returns |
|---|---|
| **Explain Problem** | Plain-language restatement of what's being asked — no code, no approach |
| **Give Hint** | One small, incremental nudge — escalates in strength on repeated clicks, capped at a configurable max level |
| **Show Approach** | Algorithm strategy and reasoning, pseudocode allowed, no full working solution |
| **Analyze Complexity** | Time/space Big-O analysis of *your own* code currently in the editor |
| **Explain My Code** | Block-by-block plain-language walkthrough of *your own* code |

The extension detects the problem automatically — title, description, constraints — and reads your code directly out of LeetCode's Monaco editor when needed, with no copy-pasting required.

---

## Tech Stack

- **Manifest V3** (Chrome Extensions)
- **Vanilla JavaScript** — no build step, no framework, no bundler
- **Google Gemini API** (`generateContent` endpoint) for AI responses
- **Chrome Storage API** — `local` for settings/API key, `session` for response caching
- **Shadow DOM** — sidebar UI isolation from LeetCode's own styles
- **LeetCode GraphQL API** — primary data source for problem content, with DOM scraping as fallback

No external npm dependencies. No backend server. Everything runs client-side inside the browser.

---

## Folder Architecture

```
leetcode-ai-assistant/
├── manifest.json                 # Extension configuration, permissions, entry points
│
├── icons/
│   ├── icon16.png                 # Toolbar icon
│   ├── icon48.png                 # Extensions management page icon
│   └── icon128.png                # Web Store / install prompt icon
│
├── content/
│   ├── content.js                 # Orchestrator — extraction, sidebar mount, route-change detection
│   ├── extractor.js                # Problem data fetch (GraphQL primary, DOM fallback)
│   ├── monaco-bridge.js            # Injected into page's MAIN world to read editor code
│   └── sidebar/
│       ├── sidebar.js               # Sidebar UI, button handlers, hint-level tracking
│       └── sidebar.css              # Scoped styles, loaded inside Shadow DOM
│
├── background/
│   ├── background.js               # Service worker — message router between content & API
│   ├── api.js                      # Gemini API request/response handling
│   └── prompts.js                  # Per-button system prompt templates
│
├── popup/
│   ├── popup.html                  # Toolbar icon popup
│   ├── popup.js                    # API key status check, current problem display
│   └── popup.css
│
├── options/
│   ├── options.html                # Settings page — API key, model, hint cap, cache toggle
│   ├── options.js
│   └── options.css
│
└── shared/
    ├── storage.js                   # Raw chrome.storage.local/session wrappers
    └── cache.js                     # Cache key construction + response caching policy
```

---

## How It Works — Data Flow

```
LeetCode page loads
        │
        ▼
content.js → extractor.js (GraphQL fetch → DOM fallback)
        │
        ▼
sidebar.js mounts floating panel (Shadow DOM)
        │
        ▼
User clicks a button
        │
        ▼
content.js sends ASK_AI message → background.js
        │
        ▼
background.js checks cache.js (chrome.storage.session)
        │
   cache miss
        ▼
prompts.js builds system+user prompt for the action
        │
        ▼
api.js sends request to Gemini generateContent endpoint
        │
        ▼
Response cached, returned to content.js → rendered in sidebar
```

For **Analyze Complexity** and **Explain My Code**, an additional step runs before the AI call: `content.js` asks `background.js` to inject `monaco-bridge.js` into the page's MAIN world (isolated content scripts can't see the page's `window.monaco` object directly), which reads the current editor content and returns it via `postMessage`.

---

## Setup

1. Clone or download this repository.
2. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com).
3. Go to `chrome://extensions` in Chrome.
4. Enable **Developer mode** (top-right toggle).
5. Click **Load unpacked** and select the project's root folder.
6. Click the extension icon → **Open Settings**.
7. Paste your API key, select a model, click **Save**.
8. Open any LeetCode problem page — the sidebar appears automatically.

---

## Configuration Options

Available on the Settings (Options) page:

- **API Key** — stored in `chrome.storage.local`, never hardcoded, never leaves the browser except to call Google's API directly
- **Model** — choose which Gemini model handles requests
- **Max Hint Escalation Level** — caps how far repeated "Give Hint" clicks can escalate (1–3)
- **Response Caching** — toggle per-problem caching to avoid repeat API calls and cost on identical requests

---

## Design Decisions Worth Knowing

- **GraphQL over DOM scraping** — LeetCode's frontend redeploys frequently and breaks CSS-selector-based scraping. The GraphQL endpoint is same-origin (no CORS issues) and returns structured data that survives UI redesigns. DOM scraping exists only as a fallback.
- **Strict prompt constraints per action** — each button has a dedicated system prompt explicitly forbidding behavior outside its scope (e.g., "Give Hint" is instructed to never provide full code, even if asked directly). Without this, LLMs default toward being maximally helpful and will leak full solutions.
- **Shadow DOM for the sidebar** — prevents LeetCode's own CSS from leaking into the extension's UI and vice versa.
- **Response caching by problem + action + code hash** — repeated clicks on the same button for the same code don't re-trigger a paid API call.
- **API key entered by the user, never bundled** — this extension is built for personal/local use. If distributed publicly, each user must supply their own key; a shared key baked into the extension is a guaranteed leak and a cost/abuse liability.

---

## Known Limitations

- Gemini model availability shifts frequently — model names occasionally return `404` as Google deprecates or restricts versions for new API keys. If this happens, check which models your key can access via:
  ```
  https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY
  ```
  and update the model name in Settings accordingly.
- Reading code from the editor depends on LeetCode's Monaco editor exposing `window.monaco` on the page — if LeetCode changes this internal implementation, `monaco-bridge.js` will need updating.
- No handling yet for premium-only LeetCode problems, where problem content may be restricted for non-premium accounts.
- This extension automates interaction with LeetCode's problem pages. Check LeetCode's current Terms of Service before using this beyond personal practice, particularly regarding contest pages.

---

## Roadmap / Not Yet Built

- [ ] Hint-level UI feedback when the configured max level is reached
- [ ] Support for additional LLM providers (OpenAI, local models)
- [ ] Response streaming instead of full-wait responses
- [ ] Dark/light theme toggle matching LeetCode's own theme setting
- [ ] Packaging for Chrome Web Store distribution (per-user key flow, privacy policy, review compliance)

---

## Disclaimer

This tool is intended to support learning — understanding problems, reasoning through approaches, and reviewing your own code — not to bypass the problem-solving process. The prompt design deliberately withholds full solutions on request. Treat hints as hints.

---

## License

Personal/educational use. Add a license of your choice before public distribution.
