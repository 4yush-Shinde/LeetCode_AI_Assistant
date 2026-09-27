// Runs in isolated content script world. Fetches problem data via GraphQL
// (same-origin, so no CORS issue), falls back to DOM scraping if it fails.

async function getTitleSlug() {
  // URL shape: https://leetcode.com/problems/two-sum/
  const parts = location.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("problems");
  return idx !== -1 ? parts[idx + 1] : null;
}

async function fetchViaGraphQL(titleSlug) {
  const res = await fetch(LEETCODE_GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      query: QUESTION_DATA_QUERY,
      variables: { titleSlug }
    })
  });

  if (!res.ok) throw new Error(`GraphQL request failed: ${res.status}`);

  const json = await res.json();
  const q = json?.data?.question;
  if (!q) throw new Error("GraphQL returned no question data");

  return {
    title: q.title,
    descriptionHtml: q.content,
    description: stripHtml(q.content),
    difficulty: q.difficulty,
    tags: q.topicTags?.map(t => t.name) ?? [],
    exampleTestcases: q.exampleTestcases ?? null,
    constraints: extractConstraints(stripHtml(q.content))
  };
}

function fetchViaDom() {
  const titleEl = document.querySelector(SELECTORS.title);
  const descEl = document.querySelector(SELECTORS.descriptionFallback);

  const title = titleEl?.innerText?.trim() ?? null;
  const description = descEl?.innerText?.trim() ?? null;

  if (!title || !description) {
    throw new Error("DOM fallback failed to locate problem elements");
  }

  return {
    title,
    description,
    descriptionHtml: descEl.innerHTML,
    difficulty: null,
    tags: [],
    exampleTestcases: null,
    constraints: extractConstraints(description)
  };
}

function stripHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.innerText.trim();
}

function extractConstraints(plainText) {
  const match = plainText.split(/Constraints:/i);
  return match.length > 1 ? match[1].trim() : null;
}

async function extractProblem() {
  const titleSlug = await getTitleSlug();
  if (!titleSlug) throw new Error("Could not determine problem slug from URL");

  try {
    return await fetchViaGraphQL(titleSlug);
  } catch (err) {
    console.warn("[LeetCode AI] GraphQL extraction failed, falling back to DOM:", err);
    return fetchViaDom();
  }
}