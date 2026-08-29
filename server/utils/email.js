import nodemailer from "nodemailer";
import env from "../config/env.js";
import Organization from "../modules/organization/organization.schema.js";
import Branch from "../modules/branch/branch.schema.js";

const getSmtpConfig = async (organizationId, branchId) => {
  let config = null;

  if (branchId) {
    const branch = await Branch.findById(branchId).lean();
    if (branch?.smtp_config?.enabled && branch?.smtp_config?.host) {
      config = branch.smtp_config;
    }
  }

  if (!config && organizationId) {
    const org = await Organization.findById(organizationId).lean();
    if (org?.smtp_config?.enabled && org?.smtp_config?.host) {
      config = org.smtp_config;
    }
  }

  if (config) {
    return {
      host: config.host,
      port: config.port,
      secure: config.secure || config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      from: config.from,
    };
  }

  // Fallback to global env
  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    from: env.SMTP_FROM,
  };
};

export const sendEmail = async ({ to, subject, html, organizationId, branchId }) => {
  const smtpConfig = await getSmtpConfig(organizationId, branchId);

  if (!smtpConfig.auth.user) {
    console.log(`[OTP] Email disabled. Email for ${to}: ${subject}`);
    return { preview: true };
  }

  const transporter = nodemailer.createTransport(smtpConfig);

  return transporter.sendMail({
    from: smtpConfig.from,
    to,
    subject,
    html,
  });
};
