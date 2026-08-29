import Ticket from "../ticket.schema.js";
import TicketMessage from "../ticketMessage.schema.js";
import TicketAiIntelligence from "../ticketAiIntelligence.schema.js";
import { analyzeTicketContent } from "./ticketAnalyzer.service.js";
import { evaluateAssigneePolicy } from "./assigneePolicyEngine.service.js";
import { evaluateSlaPolicy } from "./slaPolicyEngine.service.js";
import { getKnowledgeContext } from "./knowledgeContextService.service.js";
import { generateCopilotResponse } from "./responseCopilot.service.js";
import { checkEscalationTriggers } from "./escalationEngine.service.js";

/**
 * AI Ticket Orchestrator: Main entry point for Ticket AI Pipeline.
 * Coordinates all AI services asynchronously without blocking ticket creation.
 * Emits real-time socket updates: AI_STARTED -> ANALYZING -> RAG_SEARCH -> POLICY_CHECK -> RESPONSE_GENERATION -> AI_COMPLETED
 */
export const runTicketAiPipeline = async (ticketId, io = null) => {
  const startedAt = Date.now();
  const emitSocketEvent = (stage, payload = {}) => {
    if (io) {
      try {
        io.to(`ticket:${ticketId}`).emit("ticket_ai_progress", {
          ticketId,
          stage,
          timestamp: new Date().toISOString(),
          ...payload,
        });
      } catch {
        /* socket emit safety */
      }
    }
  };

  try {
    emitSocketEvent("AI_STARTED", { message: "Initializing AI Pipeline..." });

    // 1. Fetch Ticket & Messages
    const ticket = await Ticket.findById(ticketId).lean();
    if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

    const messages = await TicketMessage.find({ ticket_id: ticketId }).sort({ created_at: 1 }).lean();

    // 2. Stage 1: Ticket Understanding & Analyzer
    emitSocketEvent("ANALYZING", { message: "Analyzing ticket intent, category, and sentiment..." });
    const analysis = await analyzeTicketContent({
      subject: ticket.subject,
      description: ticket.description,
      messages,
      organizationId: ticket.organization_id,
    });

    // 3. Stage 2: Assignee Policy Engine
    emitSocketEvent("POLICY_CHECK", { message: "Evaluating Assignee Policies & SLA Deadlines..." });
    const assignmentResult = await evaluateAssigneePolicy(ticket, analysis);

    // 4. Stage 3: SLA & Due Date Policy Engine
    const slaResult = await evaluateSlaPolicy(ticket);

    // 5. Stage 4: RAG + Knowledge Graph Search
    const publicMessages = messages.filter((m) => !m.is_internal);
    const latestCustomerMsg =
      [...publicMessages].reverse().find((m) => (m.sender_type || "").toUpperCase() === "CUSTOMER")?.content ||
      publicMessages[publicMessages.length - 1]?.content ||
      ticket.description ||
      ticket.subject;

    const ragQuery = `${analysis.intent} ${analysis.category} ${latestCustomerMsg}`.trim();
    emitSocketEvent("RAG_SEARCH", { message: "Searching Approved Knowledge Base & Knowledge Graph..." });
    const knowledgeResult = await getKnowledgeContext({
      intent: analysis.intent,
      category: analysis.category,
      query: ragQuery,
      organizationId: ticket.organization_id,
      branchId: ticket.branch_id,
    });

    // 6. Stage 5: Response Copilot Generation
    emitSocketEvent("RESPONSE_GENERATION", { message: "Generating AI Copilot Suggested Response..." });
    const copilotResult = await generateCopilotResponse({
      ticket,
      analysis,
      messages,
      knowledgeSources: knowledgeResult.knowledge_sources,
      organizationId: ticket.organization_id,
    });

    // 7. Stage 6: Escalation Engine
    const escalationResult = checkEscalationTriggers({
      ticket,
      analysis,
      confidence: copilotResult.confidence,
      slaResult,
      messageCount: messages.length,
    });

    // 8. Priority Recommendation Engine
    let recommendedPriority = null;
    const priorityReasons = [];
    if (analysis.sentiment === "angry" || analysis.sentiment === "frustrated") {
      priorityReasons.push("Customer exhibits frustrated sentiment");
    }
    if (slaResult.sla_risk === "at_risk" || slaResult.sla_risk === "breached") {
      priorityReasons.push("SLA resolution deadline is imminent");
    }
    if (analysis.severity === "critical" || analysis.priority === "urgent") {
      recommendedPriority = "urgent";
      priorityReasons.push("Critical system component affected");
    } else if (priorityReasons.length > 0 && ticket.priority === "medium") {
      recommendedPriority = "high";
    }

    // 9. Structured Summary Generation for multi-message tickets
    const structuredSummary = {
      problem: latestCustomerMsg || ticket.description || ticket.subject,
      actions_tried: messages.length > 1 ? `${messages.length} messages exchanged in conversation` : "Initial ticket intake",
      current_status: ticket.status?.toUpperCase() || "OPEN",
      important_evidence: (analysis.entities || []).join(", ") || (latestCustomerMsg ? "Live customer query" : "User reports issue"),
      knowledge_used: (knowledgeResult.knowledge_sources || []).map((s) => s.title).join(", ") || "Standard Operating Procedures",
      customer_sentiment: analysis.sentiment,
      next_step: copilotResult.recommended_action,
      escalation_reason: escalationResult.escalation_reason || "None",
    };

    // 10. Save / Update TicketAiIntelligence Document
    const intelligencePayload = {
      ticket_id: ticket._id,
      organization_id: ticket.organization_id,
      branch_id: ticket.branch_id,
      summary: analysis.summary,
      intent: analysis.intent,
      category: analysis.category,
      subcategory: analysis.subcategory,
      product_service: "Core Platform",
      priority: ticket.priority,
      severity: analysis.severity,
      sentiment: analysis.sentiment,
      entities: analysis.entities,
      business_impact: analysis.business_impact,
      recommended_team: assignmentResult.recommended_team,
      recommended_agent_id: assignmentResult.recommended_agent_id,
      assignment_reason: assignmentResult.assignment_reason,
      policy_code: assignmentResult.policy_code,
      ai_confidence: copilotResult.confidence,
      sla_risk: slaResult.sla_risk,
      remaining_sla_minutes: slaResult.remaining_sla_minutes,
      recommended_priority: recommendedPriority,
      priority_reasons: priorityReasons,
      knowledge_sources: knowledgeResult.knowledge_sources,
      knowledge_graph_path: knowledgeResult.knowledge_graph_path,
      suggested_response: copilotResult.suggested_response,
      escalation_recommended: escalationResult.escalation_recommended,
      escalation_reason: escalationResult.escalation_reason,
      structured_summary: structuredSummary,
    };

    const doc = await TicketAiIntelligence.findOneAndUpdate(
      { ticket_id: ticket._id },
      { $set: intelligencePayload },
      { upsert: true, new: true }
    );

    const durationMs = Date.now() - startedAt;
    emitSocketEvent("AI_COMPLETED", {
      message: "AI Pipeline Complete",
      durationMs,
      intelligence: doc,
    });

    return doc;
  } catch (err) {
    console.error("[TicketAiOrchestrator] Error running AI Pipeline:", err);
    emitSocketEvent("AI_ERROR", { error: err.message });
    throw err;
  }
};
