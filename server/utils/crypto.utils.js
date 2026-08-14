import crypto from "crypto";
import env from "../config/env.js";

const ALGORITHM = "aes-256-cbc";
// Derive a 32-byte key from JWT_SECRET by hashing it
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(env.JWT_SECRET || "fallback-secret-for-encryption-key-generation-only")
  .digest();

/**
 * Encrypts plaintext string using AES-256-CBC
 * @param {string} text - The plaintext to encrypt
 * @returns {string} - The encrypted string format "iv:ciphertext"
 */
export const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
};

/**
 * Decrypts encrypted string format "iv:ciphertext" using AES-256-CBC
 * @param {string} cipherText - The text to decrypt
 * @returns {string} - The decrypted plaintext
 */
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
