import { sendEmail } from "../../utils/email.js";
import { sendMulticastNotification } from "../../config/firebase.js";

export const deliveryService = {
  sendInApp: async (notificationData, userIds) => {
    // Handled by existing socket.io & Notification model persistence
    return { status: "success" };
  },

  sendEmail: async (notificationData, recipients) => {
    if (!process.env.SMTP_USER) {
      return { status: "not_configured", detail: "SMTP credentials not found in env" };
    }

    const sendPromises = recipients.map(async (user) => {
      if (!user.email) return;
      try {
        await sendEmail({
          to: user.email,
          subject: notificationData.title,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #ea580c;">${notificationData.title}</h2>
              <p>${notificationData.message}</p>
              ${notificationData.link ? `
                <div style="margin-top: 20px;">
                  <a href="${notificationData.link}" style="background-color: #ea580c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    View Alert
                  </a>
                </div>
              ` : ""}
            </div>
          `,
          organizationId: user.organization_id,
          branchId: user.branch_id,
        });
      } catch (err) {
        console.error(`[Email Delivery] Failed for ${user.email}:`, err.message);
      }
    });

    await Promise.all(sendPromises);
    return { status: "success" };
  },

  sendPush: async (notificationData, recipients) => {
    const tokens = recipients.map((u) => u.fcm_token).filter(Boolean);
    if (tokens.length === 0) {
      return { status: "no_recipients_with_tokens" };
    }

    try {
      await sendMulticastNotification(tokens, {
        title: notificationData.title,
        body: notificationData.message,
        data: { type: notificationData.type || "info", link: notificationData.link || "" },
      });
      return { status: "success" };
    } catch (err) {
      console.error("[Push Delivery] Multicast failed:", err.message);
      return { status: "failed", error: err.message };
    }
  },

  sendSystemAnnouncement: async (notificationData, recipients) => {
    return { status: "success", detail: "System announcement created in database" };
  },
};
