const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

const QUESTION_DATA_QUERY = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      title
      content
      difficulty
      exampleTestcases
      topicTags { name }
    }
  }
`;

const SELECTORS = {
  title: '[data-cy="question-title"], .text-title-large, div[class*="title"] a',
  descriptionFallback: '[data-track-load="description_content"]'
};

const MSG = {
  GET_PROBLEM: "GET_PROBLEM",
  GET_CODE: "GET_CODE",
  ASK_AI: "ASK_AI",
  AI_RESPONSE: "AI_RESPONSE",
  AI_ERROR: "AI_ERROR",
  INJECT_BRIDGE: "INJECT_BRIDGE"
};