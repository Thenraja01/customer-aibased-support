/**
 * AI Escalation Engine: Checks multi-factor triggers for recommending ticket escalation.
 */
export const checkEscalationTriggers = ({ ticket, analysis, confidence, slaResult, messageCount = 0 }) => {
  const reasons = [];

  if (confidence < 70) {
    reasons.push(`Low AI Confidence (${confidence}% < 70% threshold)`);
  }

  if (analysis.sentiment === "angry" || analysis.sentiment === "frustrated") {
    reasons.push(`Negative customer sentiment detected (${analysis.sentiment})`);
  }

  if (slaResult.sla_risk === "at_risk" || slaResult.sla_risk === "breached") {
    reasons.push(`SLA Breach Risk is ${slaResult.sla_risk.toUpperCase()}`);
  }

  if (ticket.reopen_count > 0 || messageCount >= 5) {
    reasons.push("Multiple troubleshooting attempts / reopened conversation");
  }

  if (analysis.severity === "critical" || ticket.priority === "urgent") {
    reasons.push("Critical severity or urgent priority requirement");
  }

  const escalationRecommended = reasons.length > 0;
  const escalationReason = escalationRecommended
    ? `ESCALATION RECOMMENDED: ${reasons.join(". ")}.`
    : null;

  return {
    escalation_recommended: escalationRecommended,
    escalation_reason: escalationReason,
  };
};
