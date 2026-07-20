import env from "../config/env.js";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@supportportal.com";
const FROM_NAME = process.env.SENDGRID_FROM_NAME || "AI Support Portal";

let sendgridClient = null;

const getClient = async () => {
  if (sendgridClient) return sendgridClient;
  if (!SENDGRID_API_KEY) return null;

  try {
    const sgMail = await import("@sendgrid/mail");
    sgMail.default.setApiKey(SENDGRID_API_KEY);
    sendgridClient = sgMail.default;
    return sendgridClient;
  } catch (err) {
    console.error("[Email] Failed to initialize SendGrid:", err.message);
    return null;
  }
};

export const sendEmail = async ({ to, subject, text, html }) => {
  const client = await getClient();
  if (!client) {
    console.warn("[Email] SendGrid not configured, skipping email to:", to);
    return { sent: false, reason: "SendGrid not configured" };
  }

  try {
    const msg = {
      to,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject,
      text,
      html: html || text,
    };
    await client.send(msg);
    return { sent: true };
  } catch (err) {
    console.error("[Email] Failed to send email:", err.message);
    return { sent: false, reason: err.message };
  }
};

export const sendNotificationEmail = async ({ to, userName, notificationType, details }) => {
  const templates = {
    ticket_assigned: {
      subject: "A ticket has been assigned to you",
      text: `Hello ${userName},\n\nA new ticket has been assigned to you.\n\n${details}\n\nPlease log in to your dashboard to view it.`,
    },
    ticket_resolved: {
      subject: "Your ticket has been resolved",
      text: `Hello ${userName},\n\nYour ticket has been resolved.\n\n${details}\n\nIf you have any questions, please reply to this ticket.`,
    },
    document_verified: {
      subject: "Your document has been verified",
      text: `Hello ${userName},\n\nYour document has been verified successfully.\n\n${details}`,
    },
    message_received: {
      subject: "You have a new message",
      text: `Hello ${userName},\n\nYou have received a new message.\n\n${details}\n\nLog in to your dashboard to reply.`,
    },
    password_reset: {
      subject: "Password Reset Request",
      text: `Hello ${userName},\n\nYou have requested a password reset.\n\n${details}\n\nIf you did not request this, please ignore this email.`,
    },
    welcome: {
      subject: "Welcome to AI Support Portal",
      text: `Hello ${userName},\n\nWelcome to AI Support Portal! Your account has been created successfully.\n\n${details}`,
    },
  };

  const template = templates[notificationType] || templates.message_received;
  return await sendEmail({
    to,
    subject: template.subject,
    text: template.text,
    html: template.text.replace(/\n/g, "<br/>"),
  });
};

export const isEmailConfigured = () => {
  return !!SENDGRID_API_KEY;
};

export default {
  sendEmail,
  sendNotificationEmail,
  isEmailConfigured,
};
