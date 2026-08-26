import { generateResponse } from "../../llm/index.js";

/**
 * Analyzes ticket subject, description, and message history to extract:
 * intent, category, subcategory, priority, severity, sentiment, entities, business impact, summary.
 */
export const analyzeTicketContent = async ({ subject, description, messages = [], organizationId }) => {
  const publicMessages = (messages || []).filter((m) => !m.is_internal);
  const conversationLines = publicMessages.map((m) => `[${m.sender_type || "USER"}]: ${m.content}`);

  const conversationText = [
    `Subject: ${subject || ""}`,
    `Description: ${description || ""}`,
    ...conversationLines,
  ].join("\n");

  const latestCustomerMsg =
    [...publicMessages].reverse().find((m) => (m.sender_type || "").toUpperCase() === "CUSTOMER")?.content ||
    description ||
    subject ||
    "";

  const prompt = `Analyze this support ticket and active ongoing conversation to extract the current active intent and details.
Latest message from customer: "${latestCustomerMsg}"

1. "summary": Short 1-sentence summary of the current active issue or question being discussed.
2. "intent": Key user intent (e.g. "Document Fetching Issue", "Password Reset", "Billing Query", "Feature Request", "System Bug", "Access Issue").
3. "category": Primary category (e.g. "bug", "feature_request", "question", "billing", "account", "complaint", "technical_issue").
4. "subcategory": Specific subcategory string.
5. "priority": Recommended priority ("low", "medium", "high", "urgent").
6. "severity": Severity level ("low", "medium", "high", "critical").
7. "sentiment": User sentiment ("frustrated", "neutral", "satisfied", "angry").
8. "entities": Array of key terms/products mentioned (e.g. ["Document Fetching", "2FA", "Login", "Invoice"]).
9. "business_impact": Business impact description ("Low", "Medium", "High", "Critical").
10. "confidence": Number between 0 and 100.

Return ONLY valid JSON.

Ticket & Conversation Context:
${conversationText}`;

  try {
    const res = await generateResponse("You are an expert AI Ticket Analyzer. Output JSON only.", prompt, {
      organizationId,
      temperature: 0.1,
    });

    const jsonMatch = res.text?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary || latestCustomerMsg || subject || "Support Ticket Request",
        intent: parsed.intent || "General Inquiry",
        category: parsed.category || "question",
        subcategory: parsed.subcategory || "General",
        priority: ["low", "medium", "high", "urgent"].includes(parsed.priority?.toLowerCase()) ? parsed.priority.toLowerCase() : "medium",
        severity: ["low", "medium", "high", "critical"].includes(parsed.severity?.toLowerCase()) ? parsed.severity.toLowerCase() : "medium",
        sentiment: ["frustrated", "neutral", "satisfied", "angry"].includes(parsed.sentiment?.toLowerCase()) ? parsed.sentiment.toLowerCase() : "neutral",
        entities: Array.isArray(parsed.entities) ? parsed.entities : [],
        business_impact: parsed.business_impact || "Low",
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 88,
      };
    }
  } catch (err) {
    console.error("[TicketAnalyzer] AI generation failed, falling back to rule heuristic:", err.message);
  }

  // Heuristic Fallback focusing on the latest customer message
  const lowerLatest = latestCustomerMsg.toLowerCase();
  const lowerAll = conversationText.toLowerCase();

  let sentiment = "neutral";
  if (lowerAll.includes("urgent") || lowerAll.includes("broken") || lowerAll.includes("can't access") || lowerAll.includes("failed") || lowerAll.includes("wain") || lowerAll.includes("issue")) {
    sentiment = "frustrated";
  }

  let intent = "General Inquiry";
  let category = "question";

  if (lowerLatest.includes("document") || lowerLatest.includes("fetch") || lowerLatest.includes("file") || lowerLatest.includes("pdf")) {
    intent = "Document Fetching Issue";
    category = "technical_issue";
  } else if (lowerLatest.includes("password") || lowerLatest.includes("login") || lowerLatest.includes("reset") || lowerLatest.includes("auth")) {
    intent = "Password Reset";
    category = "account";
  } else if (lowerLatest.includes("order") || lowerLatest.includes("course") || lowerLatest.includes("invoice") || lowerLatest.includes("billing") || lowerLatest.includes("payment")) {
    intent = "Billing & Order Inquiry";
    category = "billing";
  } else if (lowerLatest.includes("error") || lowerLatest.includes("bug") || lowerLatest.includes("crash")) {
    intent = "System Bug";
    category = "bug";
  } else if (lowerAll.includes("document") || lowerAll.includes("fetch")) {
    intent = "Document Fetching Issue";
    category = "technical_issue";
  }

  return {
    summary: latestCustomerMsg.length > 80 ? latestCustomerMsg.substring(0, 80) + "..." : (latestCustomerMsg || subject || "Support Ticket Request"),
    intent,
    category,
    subcategory: "General",
    priority: lowerAll.includes("urgent") || lowerAll.includes("critical") ? "high" : "medium",
    severity: lowerAll.includes("critical") ? "critical" : "medium",
    sentiment,
    entities: lowerLatest.includes("document") ? ["Document Fetching", "RAG"] : [],
    business_impact: lowerAll.includes("critical") ? "High" : "Low",
    confidence: 80,
  };
};
