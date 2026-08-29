import crypto from "crypto";
import env from "../config/env.js";

const ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(env.JWT_SECRET || "fallback-secret-for-encryption-key-generation-only")
  .digest();

export const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
};

export const decrypt = (cipherText) => {
  if (!cipherText) return null;
  try {
    const parts = cipherText.split(":");
    if (parts.length !== 2) return null;
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = Buffer.from(parts[1], "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("[Crypto Decrypt Error]:", error.message);
    return null;
  }
};

export default {
  encrypt,
  decrypt,
};
