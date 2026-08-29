import mongoose from "mongoose";
import AssigneePolicy from "../assigneePolicy.schema.js";
import { getAgentWorkloads, selectFromWorkloads } from "../../assignment/assignment.service.js";

/**
 * Evaluates ticket metadata against Assignee Policies and agent workloads.
 * Returns assignment recommendation with clear human-readable policy reason.
 */
export const evaluateAssigneePolicy = async (ticket, analysis) => {
  const orgId = ticket.organization_id;
  const branchId = ticket.branch_id;

  // 1. Fetch matching configured policies
  let activePolicies = [];
  let workloads = [];
  if (mongoose.connection.readyState === 1) {
    try {
      activePolicies = await AssigneePolicy.find({
        organization_id: orgId,
        enabled: true,
      })
        .sort({ priority_order: 1 })
        .lean();
      workloads = await getAgentWorkloads(orgId, branchId);
    } catch {
      /* ignore DB lookup error */
    }
  }

  let matchedPolicy = null;
  for (const policy of activePolicies) {
    const c = policy.conditions || {};
    const categoryMatch = !c.category || c.category === (analysis.category || ticket.category);
    const priorityMatch = !c.priority || c.priority === (analysis.priority || ticket.priority);
    const severityMatch = !c.severity || c.severity === (analysis.severity || ticket.severity);

    if (categoryMatch && priorityMatch && severityMatch) {
      matchedPolicy = policy;
      break;
    }
  }

  // 2. Fetch active agent workloads
  const selectedAgent = selectFromWorkloads(workloads, matchedPolicy?.actions?.assignment_strategy || "hybrid");

  if (matchedPolicy) {
    return {
      recommended_team: matchedPolicy.actions.assign_team || "Specialized Support",
      recommended_agent_id: matchedPolicy.actions.assign_agent_id || selectedAgent?._id || null,
      policy_code: matchedPolicy.code || "POL-CUSTOM",
      assignment_reason: `Matched Policy '${matchedPolicy.name}' (${matchedPolicy.code}): Category=${analysis.category || ticket.category}, Priority=${analysis.priority || ticket.priority}. Selected ${selectedAgent?.name || "Team Queue"}.`,
    };
  }

  // Default fallback assignment reason
  const teamName = (analysis.category === "account" || analysis.intent?.includes("Password"))
    ? "Account & Security Support"
    : (analysis.category === "billing" ? "Billing & Finance Team" : "General Support");

  const agentName = selectedAgent?.name || "Available Agent";

  return {
    recommended_team: teamName,
    recommended_agent_id: selectedAgent?._id || null,
    policy_code: "STD-HYBRID-01",
    assignment_reason: `Assigned to ${teamName} (${agentName}) based on Workload Balance & Skill Matching (Open: ${selectedAgent?.openTickets || 0}).`,
  };
};
