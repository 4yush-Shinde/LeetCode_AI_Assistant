import { buildPrompt } from "./prompts.js";
import { callAI } from "./api.js";
import { buildCacheKey, getCachedResponse, setCachedResponse } from "../shared/cache.js";

const MSG = {
  GET_PROBLEM: "GET_PROBLEM",
  GET_CODE: "GET_CODE",
  ASK_AI: "ASK_AI",
  AI_RESPONSE: "AI_RESPONSE",
  AI_ERROR: "AI_ERROR",
  INJECT_BRIDGE: "INJECT_BRIDGE"
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MSG.INJECT_BRIDGE) {
    handleInjectBridge(sender.tab.id)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => {
        console.error("[LeetCode AI] handleInjectBridge failed:", err);
        sendResponse({ ok: false, error: err.message });
      });
    return true;
  }

  if (message.type === MSG.ASK_AI) {
    handleAskAI(message.payload)
      .then(sendResponse)
      .catch((err) => {
        console.error("[LeetCode AI] handleAskAI rejected unexpectedly:", err);
        sendResponse({ type: MSG.AI_ERROR, error: err.message });
      });
    return true;
  }

  return false;
});

async function handleInjectBridge(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    files: ["content/monaco-bridge.js"]
  });
}

async function handleAskAI(payload) {
  try {
    const { actionType, problem, userCode, language, hintLevel } = payload;

    const cacheKey = buildCacheKey(problem.title, actionType, userCode, hintLevel);
    const cached = await getCachedResponse(cacheKey);
    if (cached) {
      return { type: MSG.AI_RESPONSE, text: cached, cached: true };
    }

    const prompt = buildPrompt(actionType, { problem, userCode, language, hintLevel });
    const text = await callAI(prompt);
    await setCachedResponse(cacheKey, text);
    return { type: MSG.AI_RESPONSE, text, cached: false };
  } catch (err) {
    console.error("[LeetCode AI] handleAskAI failed:", err);
    return { type: MSG.AI_ERROR, error: err.message };
  }
}