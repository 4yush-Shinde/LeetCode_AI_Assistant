import { getLocal } from "../shared/storage.js";

const FALLBACK_MODEL = "gemini-3.5-flash-lite";

async function getSettings() {
  const { apiKey, model } = await getLocal(["apiKey", "model"]);
  if (!apiKey) {
    throw new Error("No API key set. Configure it in the extension options page.");
  }
  return { apiKey, model: model || FALLBACK_MODEL };
}

export async function callAI({ system, user }) {
  const { apiKey, model } = await getSettings();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: 800 }
    })
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`API request failed (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("API response contained no text content");
  }
  return text;
}