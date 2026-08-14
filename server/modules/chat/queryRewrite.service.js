const COMMON_SPELLING = {
  recieve: "receive",
  seperate: "separate",
  occurence: "occurrence",
  adress: "address",
  billingg: "billing",
  passowrd: "password",
  logn: "long",
  accout: "account",
  deposite: "deposit",
  withrdaw: "withdraw",
  transation: "transaction",
  cancle: "cancel",
  refrend: "refund",
  shiping: "shipping",
  ordre: "order",
  delivary: "delivery",
  purchse: "purchase",
  featre: "feature",
  technicall: "technical",
};

const SYNONYM_MAP = {
  refund: ["return", "money back", "reimbursement", "credit"],
  shipping: ["delivery", "track", "where is my order", "package"],
  password: ["login", "signin", "sign in", "access"],
  cancel: ["termination", "stop subscription", "discontinue"],
  bill: ["invoice", "payment", "charge", "subscription cost"],
  account: ["profile", "login", "signin", "credentials"],
  bug: ["error", "issue", "problem", "not working", "broken"],
  feature: ["capability", "function", "tool", "product"],
};

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "in", "on", "at", "to", "for",
  "of", "and", "or", "but", "i", "my", "me", "we", "you", "he", "she", "it",
  "they", "do", "does", "did", "have", "has", "had", "am", "be", "been",
  "being", "this", "that", "these", "those", "with", "from", "by", "as",
  "so", "no", "not", "if", "can", "what", "how", "when", "where", "why",
  "please", "thank", "thanks",
]);

const expandSynonyms = (query) => {
  const lowerQuery = query.toLowerCase();
  const expansions = [];

  for (const [keyword, synonyms] of Object.entries(SYNONYM_MAP)) {
    if (lowerQuery.includes(keyword)) {
      for (const syn of synonyms) {
        if (!lowerQuery.includes(syn)) {
          expansions.push(syn);
        }
      }
    }
  }

  return expansions;
};

const correctSpelling = (query) => {
  let corrected = query;
  for (const [misspelled, correct] of Object.entries(COMMON_SPELLING)) {
    const regex = new RegExp(`\\b${misspelled}\\b`, "gi");
    corrected = corrected.replace(regex, correct);
  }
  return corrected;
};

const tokenize = (text) =>
  text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

const isFollowUpQuery = (query) => {
  const lower = query.toLowerCase().trim();
  if (!lower) return false;
  const contentTokens = tokenize(lower);
  if (contentTokens.length <= 1) return true;
  if (/\b(my|your|our|their|its)\b/.test(lower)) return true;
  return /^(it|that|this|these|those|they|them|so|then|what about|how about|and|also)\b/.test(lower);
};

export const rewriteQuery = async (query, conversationContext = "") => {
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return query;
  }

  let rewritten = query.trim();

  const corrected = correctSpelling(rewritten);
  if (corrected !== rewritten) {
    rewritten = corrected;
  }

  const tokens = tokenize(rewritten);
  const expansions = expandSynonyms(rewritten);
  if (expansions.length > 0) {
    rewritten = `${rewritten} ${expansions.join(" ")}`;
  }

  if (conversationContext && isFollowUpQuery(rewritten)) {
    const contextSentences = conversationContext
      .split("\n")
      .filter((s) => s.trim().length > 5)
      .slice(-3);
    const recentTokens = tokenize(contextSentences.join(" "));
    const uniqueContext = recentTokens.filter((t) => !tokens.includes(t) && t.length > 3);
    if (uniqueContext.length > 0 && uniqueContext.length <= 5) {
      rewritten = `${rewritten} (context: ${uniqueContext.join(", ")})`;
    }
  }

  return rewritten;
};

export { expandSynonyms, correctSpelling };

export default {
  rewriteQuery,
  expandSynonyms,
  correctSpelling,
};
