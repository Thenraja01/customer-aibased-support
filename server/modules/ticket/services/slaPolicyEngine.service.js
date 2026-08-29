import mongoose from "mongoose";
import { evaluateSlaStatus, getSlaTargets } from "../sla.service.js";

/**
 * Deterministic SLA Policy Engine. Calculates SLA remaining time, status,
 * and breach risk. AI never overwrites SLA deadlines or rules.
 */
export const evaluateSlaPolicy = async (ticket) => {
  const orgId = ticket.organization_id;
  let targets = { responseHours: 4, resolutionHours: 24 };

  if (mongoose.connection.readyState === 1) {
    try {
      targets = await getSlaTargets(orgId);
    } catch {
      /* fallback */
    }
  }

  const status = evaluateSlaStatus(ticket, targets, new Date());

  let remainingMinutes = null;
  let slaRisk = "low";

  if (ticket.sla_due_at) {
    const dueMs = new Date(ticket.sla_due_at).getTime();
    const nowMs = Date.now();
    const diffMs = dueMs - nowMs;
    remainingMinutes = Math.round(diffMs / (60 * 1000));

    if (diffMs <= 0) {
      slaRisk = "breached";
    } else if (remainingMinutes < 60) {
      slaRisk = "at_risk";
    } else if (remainingMinutes < 180) {
      slaRisk = "medium";
    } else {
      slaRisk = "low";
    }
  }

  return {
    sla_status: status === "warning" ? "at_risk" : status,
    sla_risk: slaRisk,
    remaining_sla_minutes: remainingMinutes,
  };
};
