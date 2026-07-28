import nodemailer from "nodemailer";
import env from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  if (!env.SMTP_USER) {
    console.log(`[OTP] Email disabled. OTP for ${to}: ${subject}`);
    return { preview: true };
  }
  return transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
  });
};
