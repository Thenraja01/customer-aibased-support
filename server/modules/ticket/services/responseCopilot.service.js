import { generateResponse } from "../../llm/index.js";

/**
 * AI Response Copilot Engine: Generates grounded copilot suggested responses
 * and recommended next actions based on RAG knowledge & live conversation context.
 */
export const generateCopilotResponse = async ({ ticket, analysis, messages = [], knowledgeSources, organizationId }) => {
  const ragContext = (knowledgeSources || [])
    .map((s) => `[Source: ${s.title} (${s.score}% relevance)]\n${s.snippet || ""}`)
    .join("\n\n");

  // Format real conversation transcript
  const publicMessages = (messages || []).filter((m) => !m.is_internal);
  const conversationTranscript = publicMessages.length > 0
    ? publicMessages.map((m) => `[${m.sender_type || "USER"}]: ${m.content}`).join("\n")
    : `[CUSTOMER]: ${ticket.description || ticket.subject}`;

  // Find the latest message from customer (or last message in the thread)
  const lastCustomerMessage =
    [...publicMessages].reverse().find((m) => (m.sender_type || "").toUpperCase() === "CUSTOMER")?.content ||
    publicMessages[publicMessages.length - 1]?.content ||
    ticket.description ||
    ticket.subject;

  const prompt = `You are a Customer Support AI Copilot assisting a support agent in an active conversation with a customer.
Generate a grounded, helpful, and professional suggested response for the agent to send to the customer.

Ticket Subject: ${ticket.subject}
Original Ticket Description: ${ticket.description}
Current Intent: ${analysis?.intent || "Support Request"}
Category: ${analysis?.category || "general"}
Sentiment: ${analysis?.sentiment || "neutral"}

Full Conversation History:
${conversationTranscript}

Latest Message from Customer:
"${lastCustomerMessage}"

Approved Knowledge Base Context:
${ragContext || "Standard support procedures and account verification apply."}

Instructions:
1. Carefully review the FULL Conversation History.
2. Specifically address the LATEST message from the customer ("${lastCustomerMessage}").
3. If the customer is reporting an issue (such as document fetching, account error, billing, or access), provide direct assistance and troubleshooting steps for that issue.
4. Do not repeat previous generic ticket opening messages if the conversation is already in progress.
5. Format your output ONLY as a JSON object:
{
  "suggested_response": "Hello! I understand you are experiencing...",
  "recommended_action": "Check document permissions and verify system logs.",
  "confidence": 92
}

Return ONLY JSON.`;

  try {
    const res = await generateResponse("You are an expert Support Copilot. Output valid JSON only.", prompt, {
      organizationId,
      temperature: 0.2,
    });

    const jsonMatch = res.text?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        suggested_response: parsed.suggested_response || "Hello! Thank you for reaching out. We are investigating your issue and will update you shortly.",
        recommended_action: parsed.recommended_action || "Verify customer identity and check account status.",
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 90,
      };
    }
  } catch (err) {
    console.error("[ResponseCopilot] LLM generation error:", err.message);
  }

  // Dynamic context-aware fallback based on the latest customer message
  const lowerMsg = (lastCustomerMessage || "").toLowerCase();
  let fallbackResponse = "";
  let fallbackAction = "Review customer account status and verify security identity.";

  if (lowerMsg.includes("document") || lowerMsg.includes("fetch") || lowerMsg.includes("file") || lowerMsg.includes("download") || lowerMsg.includes("pdf")) {
    fallbackResponse = `Hello,\n\nI understand you are encountering an issue with document fetching. Let me look into this for you right away. Could you please confirm which document you are trying to fetch and whether you are seeing any specific error code?\n\nBest regards,\nCustomer Support Team`;
    fallbackAction = "Check document indexing status, RAG pipeline, and customer access permissions.";
  } else if (lowerMsg.includes("order") || lowerMsg.includes("course") || lowerMsg.includes("payment") || lowerMsg.includes("buy")) {
    fallbackResponse = `Hello,\n\nThank you for reaching out regarding your course order. We are reviewing your payment and enrollment records now to ensure full access is granted.\n\nBest regards,\nCustomer Support Team`;
    fallbackAction = "Verify order transaction and course enrollment in billing portal.";
  } else if (lowerMsg.includes("login") || lowerMsg.includes("password") || lowerMsg.includes("auth") || lowerMsg.includes("2fa")) {
    fallbackResponse = `Hello,\n\nI can help you resolve your login access issue. Please let us know if you require a password reset link or if you are having trouble with two-factor authentication.\n\nBest regards,\nCustomer Support Team`;
    fallbackAction = "Send password reset email or verify MFA authentication status.";
  } else if (publicMessages.length > 1) {
    const cleanSnippet = lastCustomerMessage.length > 70 ? lastCustomerMessage.substring(0, 70) + "..." : lastCustomerMessage;
    fallbackResponse = `Hello,\n\nThank you for following up. Regarding your message ("${cleanSnippet}"), our support team is on it and assisting you with this immediately.\n\nBest regards,\nCustomer Support Team`;
    fallbackAction = "Follow up with customer on latest inquiry and investigate logs.";
  } else {
    fallbackResponse = `Hello,\n\nThank you for bringing this to our attention regarding "${ticket.subject}". Our team is actively reviewing the issue and we will provide a complete update as soon as possible.\n\nBest regards,\nCustomer Support Team`;
    fallbackAction = "Review customer account status and verify security identity.";
  }

  return {
    suggested_response: fallbackResponse,
    recommended_action: fallbackAction,
    confidence: 88,
  };
};
