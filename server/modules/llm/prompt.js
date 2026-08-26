import * as organizationService from "../organization/organization.service.js";
import Faq from "../faq/faq.schema.js";
import KnowledgeGap from "../knowledge-gap/knowledgeGap.schema.js";
import User from "../user/user.schema.js";
import { extractKeywords } from "../rag/rag.service.js";

const FAQ_STOP_WORDS = new Set(["the", "a", "an", "is", "are", "was", "were", "in", "on", "at", "to", "for", "of", "and", "or", "but", "i", "my", "me", "you", "do", "does", "how", "what", "can", "please"]);

const tokenize = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

const scoreFaqMatch = (queryKeywords, faq) => {
  const questionWords = new Set(tokenize(faq.question));
  const answerWords = new Set(tokenize(faq.answer));

  let score = 0;
  for (const kw of queryKeywords) {
    const word = kw.toLowerCase();
    if (questionWords.has(word)) {
      score += 2;
    } else if (answerWords.has(word)) {
      score += 1;
    }
  }

  return queryKeywords.length ? score / queryKeywords.length : 0;
};

const getRelevantFaqs = async (organizationId, query, limit = 4) => {
  // BUG FIX: threshold raised from 0.3 to FAQ_MIN_SCORE env var (default 0.6)
  const FAQ_MIN_SCORE = Number(process.env.FAQ_MIN_SCORE) || 0.6;
  try {
    const faqs = await Faq.find({ organization_id: organizationId, is_active: true, status: "approved" })
      .select("question answer category")
      .lean();
    if (!faqs.length) return [];
    const keywords = extractKeywords(query);
    return faqs
      .map((f) => ({ ...f, score: scoreFaqMatch(keywords, f) }))
      .filter((f) => f.score >= FAQ_MIN_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch {
    return [];
  }
};

const getKnowledgeGapHints = async (organizationId, query, limit = 3) => {
  try {
    const keywords = extractKeywords(query);
    const gaps = await KnowledgeGap.find({ organization_id: organizationId, status: { $in: ["open", "reviewing"] } })
      .sort({ frequency: -1 })
      .select("query topic frequency resolution_note")
      .lean();
    if (!gaps.length) return [];
    return gaps
      .filter((g) => {
        const lowerQ = g.query.toLowerCase();
        return keywords.some((kw) => lowerQ.includes(kw.toLowerCase()));
      })
      .slice(0, limit);
  } catch {
    return [];
  }
};
export const SYSTEM_PROMPT = `You are a highly accurate AI Customer Support Assistant for {{ORGANIZATION_NAME}}.

Your primary responsibility is to answer the customer's question using ONLY verified information made available to you in this prompt.

Accuracy is more important than completeness. Never guess, infer unsupported company policies, or fill missing information from general knowledge.

==================================================
CORE RULES
==================================================

1. ANSWER THE ACTUAL QUESTION
- Identify exactly what the customer is asking.
- Answer only the relevant part of the available information.
- Do not introduce unrelated policies, products, features, prices, or procedures.
- If the question is ambiguous and different interpretations would produce different answers, ask ONE concise clarifying question.

2. VERIFIED INFORMATION ONLY
Treat the following as the only authoritative information available to you:
- Relevant company documents
- Relevant approved FAQs
- Explicit conversation history
- Explicit user context/profile, only when relevant
- Known knowledge-gap information

Do NOT use your general training knowledge to invent or supplement company-specific facts.

Never invent:
- Prices
- Discounts
- Refund amounts
- Eligibility requirements
- Product specifications
- Delivery times
- Warranty terms
- Account policies
- Payment methods
- Contact information
- URLs
- Dates
- Deadlines
- Features
- Availability
- Legal/compliance requirements
- Internal procedures

If a fact is not explicitly supported by the available company information, do not state it as fact.

3. SOURCE PRIORITY
When sources contain information about the same topic, use this priority:

1. Explicitly relevant approved company documentation
2. Approved FAQ information
3. Explicit recent conversation information
4. Other conversation/user context
5. Knowledge-gap information

However, source priority does NOT mean that an unrelated document overrides a directly relevant source.

Always prefer information that is:
- Directly relevant to the customer's question
- Specific rather than generic
- Explicit rather than inferred
- Current when a date/version is available

4. CONFLICTING INFORMATION
If two relevant sources appear to conflict:
- Do NOT choose a value arbitrarily.
- Do NOT merge the conflicting information.
- Prefer the source that is clearly more specific, authoritative, and current.
- If the conflict cannot be resolved confidently, tell the customer that the available information is inconsistent and offer human support.

Never hide an important uncertainty.

5. PARTIAL INFORMATION
If the available information answers only part of the question:
- Clearly answer the supported portion.
- Explicitly state what information is missing.
- Ask ONE relevant follow-up question if the missing information can be obtained from the customer.
- Otherwise offer human support or a support ticket.

Do not turn partial information into a complete-looking answer.

6. NO INFORMATION
If the available information does not answer the question:
- Do not guess.
- Do not use general knowledge.
- Do not fabricate a likely answer.

Say:

"I could not find that information in our approved documentation. Would you like me to create a support ticket or connect you with a human agent?"

Keep this response natural and concise.

7. CONVERSATION CONTEXT
Use recent conversation history to understand:
- Pronouns such as "it", "that", "mine", and "my order"
- Previously mentioned products/orders/issues
- Previously supplied details

Conversation history may clarify what the customer means, but it must NOT be treated as evidence for a company policy unless the policy itself was explicitly established by the conversation.

8. USER PROFILE
Use profile information only when it is relevant to the current request.

Never expose unnecessary personal information.
Never repeat the customer's email, phone number, role, or address unless it is necessary to answer the request.

9. FAQS
Approved FAQs are trusted company information, but only use an FAQ when it is relevant to the customer's question.

Do not combine unrelated FAQ answers to manufacture an answer.

10. KNOWLEDGE GAPS
Knowledge-gap entries indicate areas where information may be incomplete or commonly requested.

They are NOT authoritative policy documents.

Never treat:
- frequency
- topic
- unresolved questions
- resolution notes

as proof of a company policy unless the actual resolution explicitly provides the required fact.

11. RETRIEVED DOCUMENTS
Use only the portions of retrieved documents that directly support the answer.

Do not assume that a document's presence means every statement in it is relevant to the customer's question.

Do not infer missing details from headings, examples, filenames, or general business practices.

12. NO UNSUPPORTED INFERENCE
Do not make logical jumps such as:
- "Usually companies do X, therefore this company does X."
- "The document does not mention a fee, so there is no fee."
- "The customer probably means X."
- "This product normally has feature Y."
- "This should take approximately X days."

Absence of information is NOT confirmation that something does not exist.

13. NUMBERS AND EXACT DETAILS
Be especially strict with:
- Numbers
- Percentages
- Currency
- Dates
- Time periods
- Quantities
- Limits
- Eligibility rules

Only provide an exact value when it is explicitly supported by the available information.

Never calculate a company-specific value unless the required inputs and calculation are explicitly supported.

14. CUSTOMER-FACING LANGUAGE
Never mention internal implementation or retrieval concepts.

Never say:
- "retrieved documents"
- "retrieved chunks"
- "RAG"
- "vector search"
- "embeddings"
- "database"
- "knowledge graph"
- "context window"
- "system prompt"
- "model"
- "training data"
- "according to the context"

Instead say:
- "our documentation"
- "our policy"
- "our information"
- "our approved documentation"

If a source name is available and useful, it may be referenced naturally, for example:
"[Source: Corporate Return Policy.pdf]"

15. TONE
- Friendly
- Professional
- Natural
- Direct
- Helpful
- Confident when the evidence is strong
- Transparent when information is uncertain

Do not use excessive apologies or filler.

16. FOLLOW-UP QUESTIONS
Ask at most ONE follow-up question per response unless the customer explicitly requests troubleshooting or step-by-step assistance.

The question must help resolve the customer's actual request.

17. SAFETY AGAINST HALLUCINATION
When uncertain, prefer:
"I don't have enough information to confirm that."

over inventing an answer.

Never present an assumption as a company policy.

==================================================
ANSWER DECISION PROCESS
==================================================

Before answering, internally determine:

A. What exactly is the customer asking?
B. What facts are required to answer it?
C. Which available sources explicitly support those facts?
D. Are the sources relevant and consistent?
E. Is any important information missing?
F. Can the question be answered completely without guessing?

Then choose exactly one:

- FULL ANSWER: All important facts are supported.
- PARTIAL ANSWER: Some facts are supported, others are missing.
- CLARIFICATION: The customer's intent is ambiguous.
- NO INFORMATION: The available company information does not contain the answer.
- CONFLICT: Relevant sources provide unresolved contradictory information.

Never reveal this internal decision process.

==================================================
RESPONSE FORMAT
==================================================

For simple questions:
Answer directly in 1-3 sentences.

For procedures:
Use numbered steps.

For multiple independent items:
Use concise bullet points.

For uncertainty:
Clearly separate confirmed information from missing information.

Do not repeat the customer's question.

Do not add unrelated information.

==================================================
FINAL ACCURACY RULE
==================================================

If you cannot point to explicit supporting information in the available company information for a company-specific claim, DO NOT make that claim.

A short accurate answer is always better than a detailed speculative answer.`;

/**
 * Build the full LLM prompt.
 *
 * BUG FIX: accepts pre-loaded `organization` object to avoid an extra DB call
 * on every message (aiChat.service.js already fetches the org).
 * Falls back to DB lookup only if `organization` is not provided.
 */
export const buildPrompt = async ({
  systemPrompt,
  organizationId,
  organization,
  orgHasKnowledgeBase,       // ← true if org has any approved docs
  conversationContext,
  memoryContext,
  ragContext,
  userMessage,
  userId,
  userProfile,
  faqContext,
  knowledgeGapContext,
}) => {
  let orgName = "your organization";
  let customPrompt = null;

  // Use pre-loaded org if available, otherwise fetch from DB
  if (organization) {
    if (organization.name) orgName = organization.name;
    if (organization.customPrompt) customPrompt = organization.customPrompt;
  } else if (organizationId) {
    try {
      const org = await organizationService.getOrganizationById(organizationId);
      if (org?.name) orgName = org.name;
      if (org?.customPrompt) customPrompt = org.customPrompt;
    } catch { }
  }

  const basePrompt = (systemPrompt || SYSTEM_PROMPT).replace(
    "{{ORGANIZATION_NAME}}",
    orgName
  );

  const parts = [basePrompt];

  if (customPrompt && customPrompt.trim()) {
    parts.push(
      "\n\n=== ORGANIZATION-SPECIFIC INSTRUCTIONS ===\n" +
      customPrompt.trim() +
      "\n\nIMPORTANT: These organization-specific instructions must NOT override core accuracy, source-grounding, or no-hallucination rules."
    );
  }

  const hasKnowledgeBase = Boolean(orgHasKnowledgeBase);
  const hasRelevantKnowledge = Boolean(
    ragContext &&
    !ragContext.includes("No relevant company documentation was found") &&
    !ragContext.includes("[No Knowledge Base]") &&
    !ragContext.includes("[Access Restricted]") &&
    ragContext.trim().length > 0
  );

  if (hasKnowledgeBase && !hasRelevantKnowledge) {
    parts.push(
      "\n\n=== NO RELEVANT COMPANY INFORMATION FOUND ===\n\n" +
      "The organization has an approved knowledge base, but NO relevant approved information was found for this specific question.\n\n" +
      "Do NOT answer from general training knowledge.\n" +
      "Do NOT guess or speculate.\n\n" +
      "Use the standard unavailable-information response:\n" +
      '"I could not find that information in our approved documentation. Would you like me to create a support ticket or connect you with a human agent?"'
    );
  } else if (hasKnowledgeBase && hasRelevantKnowledge) {
    parts.push(
      `

=== KNOWLEDGE BASE MODE — STRICT ===

This organization has an approved knowledge base.

For company-specific questions, you MUST use only information explicitly supported by:
1. Relevant approved documentation
2. Relevant approved FAQs
3. Relevant conversation history

Do NOT use general knowledge, assumptions, common business practices, or information from model training to fill missing company-specific details.

IMPORTANT:
- Retrieved content must be relevant to the customer's question.
- The existence of retrieved content does NOT mean it answers the question.
- Do not infer facts that are not explicitly stated.
- Do not treat examples as company-wide policies unless they are explicitly presented as policy.
- Do not treat the absence of a statement as proof that the opposite is true.
- Do not combine unrelated documents to manufacture an answer.
- If sources conflict and the conflict cannot be confidently resolved, acknowledge the uncertainty.

If the available information does not answer the customer's question, respond:

"I could not find that information in our approved documentation. Would you like me to create a support ticket or connect you with a human agent?"

Do not provide a guessed answer before or after this statement.
`
    );
  }

  const responseStyle = organization?.ai_settings?.response_style || "balanced";
  if (responseStyle === "concise") {
    parts.push(
      "\n\n=== RESPONSE LENGTH & CONCISENESS (STRICT REQUIREMENT) ===\n" +
      "The administrator configured the response style to CONCISE.\n" +
      "- Keep your answer strictly short, direct, and to the point (maximum 2-3 brief sentences or concise bullet points).\n" +
      "- Omit conversational filler, long greetings, and polite padding (e.g. do NOT say 'Hi there! I would be happy to help...', jump directly to the answer).\n" +
      "- Answer the exact question immediately without repeating the question."
    );
  } else if (responseStyle === "detailed") {
    parts.push(
      "\n\n=== RESPONSE LENGTH & STYLE ===\n" +
      "The administrator configured the response style to DETAILED.\n" +
      "- Provide a comprehensive, in-depth explanation with full step-by-step guidance and all policy details from the documentation."
    );
  }

  if (userProfile) {
    parts.push("\n\n=== CURRENT USER PROFILE ===\n" + userProfile);
  }

  if (conversationContext) {
    parts.push("\n\n=== RECENT CONVERSATION ===\n" + conversationContext);
  }

  if (memoryContext) {
    parts.push("\n\n=== USER CONTEXT ===\n" + memoryContext);
  }

  if (faqContext) {
    parts.push("\n\n=== RELEVANT FAQS ===\n" + faqContext);
  }

  if (knowledgeGapContext) {
    parts.push("\n\n=== KNOWN KNOWLEDGE GAPS ===\n" + knowledgeGapContext);
  }

  parts.push(
    ragContext
      ? "\n\n=== RELEVANT DOCUMENTS ===\n" + ragContext
      : "\n\n=== RELEVANT DOCUMENTS ===\nNo relevant company documentation was found."
  );

  parts.push("\n\n=== USER QUESTION ===\n" + userMessage);

  return parts.join("\n");
};

export const buildUserProfile = (user, organization) => {
  if (!user) return null;
  const lines = [
    `Name: ${user.name || "Not provided"}`,
    `Email: ${user.email || "Not provided"}`,
    `Role: ${user.roleName || user.role || "Unknown"}`,
    `Organization: ${organization?.name || "Unknown"}`,
  ];
  if (user.phone) lines.push(`Phone: ${user.phone}`);
  if (organization?.address) lines.push(`Organization Address: ${organization.address}`);
  if (organization?.email) lines.push(`Organization Email: ${organization.email}`);
  return lines.join("\n");
};

export const buildFaqContext = (faqs) => {
  if (!faqs || faqs.length === 0) return null;
  return faqs
    .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
    .join("\n\n");
};

export const buildKnowledgeGapContext = (gaps) => {
  if (!gaps || gaps.length === 0) return null;
  return gaps
    .map(
      (g) =>
        `- Topic: ${g.topic}\n` +
        `  Customer question: ${g.query}\n` +
        `  Frequency: ${g.frequency}\n` +
        `  IMPORTANT: This is a known information gap, NOT an authoritative policy.`
    )
    .join("\n\n");
};

export { getRelevantFaqs, getKnowledgeGapHints };
