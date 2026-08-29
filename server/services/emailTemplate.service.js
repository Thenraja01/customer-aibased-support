import Organization from "../modules/organization/organization.schema.js";
import Branch from "../modules/branch/branch.schema.js";
import { sendEmail } from "../utils/email.js";
import { generateResponse } from "../modules/llm/index.js";

/**
 * Standard default templates for all 6 lifecycle events
 */
export const DEFAULT_EMAIL_TEMPLATES = {
  ticket_created: {
    subject: "Ticket #{{ticket_id}} Created: {{subject}}",
    body: "Hello {{customer_name}},\n\nThank you for reaching out. We have received your support ticket #{{ticket_id}} regarding \"{{subject}}\".\n\nPriority: {{priority}}\nBranch: {{branch_name}}\n\nOur support team is reviewing your request and will get back to you shortly.\n\nBest regards,\n{{org_name}} Support Team",
    recipient_role: "customer",
    description: "Sent to the customer immediately when a new support ticket is submitted.",
  },
  ticket_assigned: {
    subject: "Ticket Assigned: #{{ticket_id}} - {{subject}}",
    body: "Hello {{agent_name}},\n\nTicket #{{ticket_id}} has been assigned to you.\n\nSubject: {{subject}}\nCustomer: {{customer_name}}\nPriority: {{priority}}\nBranch: {{branch_name}}\n\nPlease review and respond within the SLA deadline.\n\nPortal: {{portal_url}}",
    recipient_role: "agent",
    description: "Sent to the support agent or branch staff when a ticket is assigned or routed.",
  },
  ticket_resolved: {
    subject: "Ticket #{{ticket_id}} Resolved: {{subject}}",
    body: "Hello {{customer_name}},\n\nYour support ticket #{{ticket_id}} has been marked as resolved.\n\nResolution Summary:\n{{ai_summary}}\n\nIf you have any further questions or if your issue persists, please reply to this email or visit our portal.\n\nBest regards,\n{{org_name}} Customer Care",
    recipient_role: "customer",
    description: "Sent to the customer when their ticket has been resolved.",
  },
  ai_escalation: {
    subject: "⚠️ AI Escalation Alert: Ticket #{{ticket_id}} requires human assistance",
    body: "Hello Support Team,\n\nA customer chat session has been escalated by the AI assistant and requires human agent takeover.\n\nTicket: #{{ticket_id}}\nCustomer: {{customer_name}}\nTopic: {{subject}}\nBranch: {{branch_name}}\n\nPlease open the ticket immediately to assist the customer.\n\nPortal: {{portal_url}}",
    recipient_role: "agent",
    description: "Sent to agents/managers when the AI bot encounters a complex inquiry and escalates.",
  },
  sla_warning: {
    subject: "⏰ SLA Deadline Warning: Ticket #{{ticket_id}} is approaching breach",
    body: "Attention {{agent_name}},\n\nSupport Ticket #{{ticket_id}} (Priority: {{priority}}) is approaching its SLA response/resolution deadline.\n\nSubject: {{subject}}\nCustomer: {{customer_name}}\nBranch: {{branch_name}}\n\nPlease take immediate action to avoid an SLA breach.",
    recipient_role: "agent",
    description: "Sent to assigned agents and branch managers when a ticket is at risk of SLA breach.",
  },
  announcement_update: {
    subject: "📢 Announcement from {{org_name}}: {{subject}}",
    body: "Dear {{customer_name}},\n\nWe would like to share an important update regarding {{org_name}}:\n\n{{subject}}\n\nIf you have any questions or need assistance, our support team is always here to help.\n\nBest regards,\n{{org_name}} Team",
    recipient_role: "all",
    description: "Sent to users when a platform or tenant announcement is broadcasted.",
  },
};

/**
 * Replace placeholders like {{ticket_id}}, {{customer_name}}, etc.
 */
export const interpolateTemplate = (templateStr, data = {}) => {
  if (!templateStr || typeof templateStr !== "string") return "";
  return templateStr.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return data[key] !== undefined && data[key] !== null ? String(data[key]) : `{{${key}}}`;
  });
};

/**
 * Wrap plain text body in a modern, responsive HTML container
 * with tenant branding (logo & primary color)
 */
export const wrapInHtmlEmail = ({ title, bodyText, org, actionUrl = "", actionLabel = "View in Portal" }) => {
  const primaryColor = org?.brand_colors?.primary || "#2563eb";
  const orgName = org?.name || "SupportAI";
  const logoUrl = org?.logo?.url || (typeof org?.logo === "string" ? org.logo : null) || org?.logoUrl || "";

  const formattedBody = (bodyText || "")
    .split("\n")
    .map((line) => line.trim())
    .map((line) => (line ? `<p style="margin: 0 0 12px 0; line-height: 1.6; color: #334155;">${line}</p>` : "<br />"))
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <!-- Header Bar -->
          <tr>
            <td style="padding: 24px 32px; background: linear-gradient(135deg, ${primaryColor} 0%, #1e1b4b 100%);">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    ${
                      logoUrl
                        ? `<img src="${logoUrl}" alt="${orgName}" style="max-height: 36px; max-width: 160px; object-fit: contain; margin-bottom: 8px;" />`
                        : ""
                    }
                    <h1 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 700; letter-spacing: -0.02em;">
                      ${orgName}
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px; color: #1e293b; font-size: 15px;">
              <h2 style="margin: 0 0 18px 0; color: #0f172a; font-size: 20px; font-weight: 600;">
                ${title}
              </h2>
              
              <div style="font-size: 14px; color: #334155;">
                ${formattedBody}
              </div>

              ${
                actionUrl
                  ? `
                <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: left;">
                  <a href="${actionUrl}" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    ${actionLabel} &rarr;
                  </a>
                </div>
              `
                  : ""
              }
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px;">
              <p style="margin: 0 0 4px 0;">This email was sent by <strong>${orgName}</strong> automated support system.</p>
              <p style="margin: 0; color: #94a3b8;">&copy; ${new Date().getFullYear()} ${orgName}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Dispatch an email for any lifecycle event using tenant templates & hierarchy
 */
export const sendLifecycleEmail = async ({
  templateKey,
  recipientEmail,
  data = {},
  organizationId,
  branchId = null,
  actionUrl = "",
}) => {
  if (!recipientEmail) return { success: false, message: "Recipient email is required" };

  try {
    let org = null;
    if (organizationId) {
      org = await Organization.findById(organizationId).lean();
    }

    let branch = null;
    if (branchId) {
      branch = await Branch.findById(branchId).lean();
    }

    const orgTemplates = org?.email_templates || {};
    const configuredTemplate = orgTemplates[templateKey] || DEFAULT_EMAIL_TEMPLATES[templateKey] || DEFAULT_EMAIL_TEMPLATES.ticket_assigned;

    const mergedData = {
      org_name: org?.name || "SupportAI",
      branch_name: branch?.name || "Main Branch",
      portal_url: actionUrl || `${process.env.FRONTEND_URL || "http://localhost:5173"}/tickets/${data.ticket_id || ""}`,
      customer_name: data.customer_name || "Customer",
      agent_name: data.agent_name || "Support Agent",
      ticket_id: data.ticket_id || "N/A",
      subject: data.subject || "Support Inquiry",
      priority: data.priority ? data.priority.toUpperCase() : "MEDIUM",
      ai_summary: data.ai_summary || "Issue investigated and resolved as per support guidelines.",
      ...data,
    };

    const interpolatedSubject = interpolateTemplate(configuredTemplate.subject, mergedData);
    const interpolatedBody = interpolateTemplate(configuredTemplate.body, mergedData);

    const htmlContent = wrapInHtmlEmail({
      title: interpolatedSubject,
      bodyText: interpolatedBody,
      org,
      actionUrl: mergedData.portal_url,
    });

    const result = await sendEmail({
      to: recipientEmail,
      subject: interpolatedSubject,
      html: htmlContent,
      organizationId,
      branchId,
    });

    return { success: true, result, subject: interpolatedSubject };
  } catch (err) {
    console.error(`[LifecycleEmail] Failed to send ${templateKey} to ${recipientEmail}:`, err.message);
    return { success: false, message: err.message };
  }
};

/**
 * AI-assisted tone polishing for template copy
 */
export const polishTemplateWithAI = async ({ subject, body, tone = "professional", organizationId = null }) => {
  const tonesMap = {
    empathetic: "Warm, deeply empathetic, customer-centric, and understanding",
    professional: "Polite, crisp, formal, enterprise-ready, and clear",
    concise: "Ultra-concise, direct, bulleted if needed, minimal fluff",
    friendly: "Approachable, energetic, positive, and conversational",
  };

  const toneInstruction = tonesMap[tone] || tonesMap.professional;

  const prompt = `You are an expert copywriter for customer support communications.
Refine the following support email template subject line and body text according to this desired tone: "${toneInstruction}".

CRITICAL INSTRUCTIONS:
1. Preserve all template variables intact (e.g. {{customer_name}}, {{ticket_id}}, {{subject}}, {{agent_name}}, {{priority}}, {{branch_name}}, {{org_name}}, {{portal_url}}, {{ai_summary}}).
2. Do not remove or change any variable syntax.
3. Return ONLY a valid JSON object matching this structure:
{
  "subject": "Refined subject line",
  "body": "Refined body copy"
}

ORIGINAL SUBJECT:
${subject}

ORIGINAL BODY:
${body}`;

  try {
    const responseText = await generateResponse(prompt, "", { organizationId, temperature: 0.4, maxTokens: 800 });
    
    // Extract JSON
    const match = responseText.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        success: true,
        subject: parsed.subject || subject,
        body: parsed.body || body,
      };
    }

    return { success: true, subject, body: responseText.trim() };
  } catch (err) {
    console.error("[PolishAI] AI generation error:", err.message);
    // Graceful fallback: return original text
    return { success: true, subject, body };
  }
};
