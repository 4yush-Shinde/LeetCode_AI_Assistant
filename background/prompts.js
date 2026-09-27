function buildContext(problem) {
  return `Problem Title: ${problem.title}
Difficulty: ${problem.difficulty ?? "unknown"}
Description:
${problem.description}

Constraints:
${problem.constraints ?? "not explicitly listed"}`;
}

function explainProblem(problem) {
  return {
    system:
      "You explain competitive programming problems in plain language. " +
      "Do not provide any code, pseudocode, or algorithmic approach. " +
      "Restate what the problem is actually asking, clarify input/output format, " +
      "and note any edge cases implied by the constraints. Keep it under 150 words.",
    user: buildContext(problem)
  };
}

function giveHint(problem, hintLevel = 1) {
  return {
    system:
      "You give incremental hints for coding problems. You must NEVER provide " +
      "full code or a complete algorithm in one response. Give exactly ONE small " +
      "conceptual nudge appropriate to hint level " + hintLevel + " " +
      "(1 = vague direction / relevant data structure or technique category, " +
      "2 = narrower strategy without steps, 3 = high-level steps without code). " +
      "Do not exceed the requested hint level under any circumstance, even if asked directly for more.",
    user: buildContext(problem) + `\n\nRequested hint level: ${hintLevel}`
  };
}

function showApproach(problem) {
  return {
    system:
      "You explain algorithmic approaches to coding problems. Provide the reasoning " +
      "and a step-by-step strategy. Pseudocode is allowed. Do NOT provide a full working " +
      "code solution in any programming language unless explicitly told the user wants runnable code. " +
      "End with time and space complexity and a one-line justification for each.",
    user: buildContext(problem)
  };
}

function analyzeComplexity(problem, userCode, language) {
  if (!userCode) throw new Error("analyzeComplexity requires userCode");
  return {
    system:
      "You analyze the time and space complexity of provided code. State Big-O for both, " +
      "explain which part of the code drives each bound, and flag any obviously suboptimal " +
      "sections without rewriting the code.",
    user: `${buildContext(problem)}\n\nLanguage: ${language ?? "unknown"}\nUser's code:\n\`\`\`\n${userCode}\n\`\`\``
  };
}

function explainCode(problem, userCode, language) {
  if (!userCode) throw new Error("explainCode requires userCode");
  return {
    system:
      "You explain what a piece of code does, block by block, in plain language. " +
      "Do not suggest fixes or improvements unless the code fails to compile/run logically — " +
      "note that separately at the end, clearly labeled 'Potential issue', if applicable.",
    user: `${buildContext(problem)}\n\nLanguage: ${language ?? "unknown"}\nUser's code:\n\`\`\`\n${userCode}\n\`\`\``
  };
}

export function buildPrompt(actionType, { problem, userCode, language, hintLevel }) {
  switch (actionType) {
    case "EXPLAIN_PROBLEM": return explainProblem(problem);
    case "GIVE_HINT": return giveHint(problem, hintLevel);
    case "SHOW_APPROACH": return showApproach(problem);
    case "ANALYZE_COMPLEXITY": return analyzeComplexity(problem, userCode, language);
    case "EXPLAIN_CODE": return explainCode(problem, userCode, language);
    default: throw new Error(`Unknown actionType: ${actionType}`);
  }
}