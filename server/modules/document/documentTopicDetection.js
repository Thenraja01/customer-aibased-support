import Topic from "../topic/topic.schema.js";
import { generateResponse } from "../llm/index.js";
import { findOrCreateTopic } from "../topic/topic.service.js";

// Deterministic keyword fallback so documents always get sensible topics even
// when the LLM is unavailable or returns unparseable output.
const KEYWORD_TOPICS = [
  { name: "Refund", keywords: ["refund", "reimburs", "money back", "credit back", "chargeback"] },
  { name: "Shipping", keywords: ["shipping", "shipment", "delivery", "tracking", "track", "package", "dispatch", "courier", "carrier", "warehouse"] },
  { name: "Billing", keywords: ["billing", "bill", "payment", "invoice", "charge", "subscription", "plan", "price", "cost", "credit card", "debit"] },
  { name: "Account", keywords: ["account", "login", "password", "sign in", "signin", "register", "profile", "verify", "otp", "reset password"] },
  { name: "Technical", keywords: ["error", "bug", "crash", "issue", "technical", "troubleshoot", "failed", "not working", "freeze", "loading"] },
  { name: "Product", keywords: ["product", "item", "inventory", "stock", "warranty", "specification", "specs", "dimension"] },
  { name: "Orders", keywords: ["order", "orders", "confirmation", "cancel order", "reorder", "purchase"] },
  { name: "Support", keywords: ["support", "help", "assistance", "contact", "agent", "live chat", "ticket"] },
  { name: "Returns", keywords: ["return", "returns", "exchange", "replacement"] },
];

const detectTopicsByKeywords = (text) => {
  const lower = text.toLowerCase();
  return KEYWORD_TOPICS.filter((topic) => topic.keywords.some((kw) => lower.includes(kw))).map((topic) => topic.name);
};

export const detectTopicsForText = async (text, organizationId) => {
  let detected = [];

  try {
    const existingTopics = await Topic.find({ organization_id: organizationId }).lean();
    const existingList = existingTopics.map(t => `- Name: "${t.name}" | Description: "${t.description || ''}"`).join("\n");
    const textSample = text.substring(0, 4000);

    const prompt = `Analyze this text and classify it into relevant topics.
You can match against existing topics or propose new ones if none are suitable. Do not create duplicates for similar names (e.g. plural vs singular).

Existing topics:
${existingList || "None"}

Text sample:
"${textSample}"

Respond ONLY with a JSON array of objects in this exact format. Do not use markdown, backticks, or any explanation:
[
  { "name": "Refund", "matched": true },
  { "name": "Technical Issues", "matched": false, "description": "Troubleshooting system errors." }
]`;

    const llmRes = await generateResponse(prompt, "", {
      provider: "ollama",
      model: "llama3.2:3b",
      organizationId
    });

    const responseText = llmRes?.text || "";
    const firstBracket = responseText.indexOf("[");
    const lastBracket = responseText.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1) {
      const parsed = JSON.parse(responseText.substring(firstBracket, lastBracket + 1));
      if (Array.isArray(parsed)) detected = parsed;
    }
  } catch (error) {
    console.error("[TopicDetection] LLM failed, using keyword fallback:", error.message);
  }

  // Deterministic fallback when the LLM returned nothing usable.
  if (detected.length === 0) {
    detected = detectTopicsByKeywords(text).map((name) => ({ name, matched: false, description: "" }));
  }

  const topicIds = [];
  for (const item of detected) {
    if (!item.name) continue;
    const topic = await findOrCreateTopic(item.name.trim(), item.description || "", organizationId);
    topicIds.push(topic._id);
  }
  return topicIds;
};
