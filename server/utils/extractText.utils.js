import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

/**
 * Universal text extractor supporting PDF, Word (DOCX/DOC), Text (TXT), Markdown (MD), CSV, JSON, and XML.
 *
 * @param {Buffer} buffer - File buffer from GridFS or Cloudinary
 * @param {string} mimeType - File MIME type (e.g. application/pdf, text/markdown, etc.)
 * @param {string} fileName - File name with extension for extension-based fallback
 * @returns {Promise<string>} Extracted plain text
 */
export const extractTextFromBuffer = async (buffer, mimeType = "", fileName = "") => {
  if (!buffer || !buffer.length) return "";

  const lowerMime = (mimeType || "").toLowerCase().trim();
  const ext = (fileName || "").split(".").pop().toLowerCase().trim();

  // 1. Text, Markdown, CSV, JSON, XML, Code, Logs
  const textMimes = [
    "text/plain",
    "text/txt",
    "text/markdown",
    "text/x-markdown",
    "text/csv",
    "text/tab-separated-values",
    "application/json",
    "text/json",
    "application/xml",
    "text/xml",
    "text/html",
    "text/css",
    "text/javascript",
    "application/x-yaml",
    "text/yaml",
  ];

  const textExtensions = [
    "txt",
    "md",
    "markdown",
    "csv",
    "tsv",
    "json",
    "xml",
    "html",
    "htm",
    "log",
    "rst",
    "yaml",
    "yml",
    "ini",
    "conf",
    "env",
    "sql",
  ];

  if (textMimes.includes(lowerMime) || textExtensions.includes(ext)) {
    try {
      const rawText = buffer.toString("utf-8");
      // Clean null bytes or binary artefacts if any
      return rawText.replace(/\0/g, "").trim();
    } catch (err) {
      console.warn("[TextExtraction] Plain text decoding warning:", err.message);
    }
  }

  // 2. PDF Documents (.pdf)
  if (lowerMime === "application/pdf" || lowerMime === "application/x-pdf" || ext === "pdf") {
    try {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      if (result && result.text) {
        // Strip page delimiters like "-- 1 of 1 --" if empty
        const cleaned = result.text.replace(/--\s*\d+\s*of\s*\d+\s*--/gi, "").trim();
        if (cleaned.length > 0) {
          return cleaned;
        }
      }
    } catch (pdfErr) {
      console.warn("[PDFParse] Text extraction failed:", pdfErr.message);
    }
  }

  // 3. Word Documents (.docx / .doc)
  const wordMimes = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/docx",
    "application/msword",
    "application/vnd.ms-word",
    "application/x-msword",
  ];

  if (wordMimes.includes(lowerMime) || ["docx", "doc"].includes(ext)) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      if (result && result.value && result.value.trim().length > 0) {
        return result.value.trim();
      }
    } catch (wordErr) {
      console.warn("[Mammoth] Word extraction failed:", wordErr.message);
    }
  }

  // 4. Fallback: Check if the buffer is UTF-8 text (e.g. uploaded as application/octet-stream)
  try {
    const rawText = buffer.toString("utf-8");
    // Filter non-printable binary characters
    const printable = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");
    if (printable.length >= 20 && printable.length / rawText.length > 0.8) {
      return printable.trim();
    }
  } catch {
    // Non-decodable binary
  }

  console.warn(`[TextExtraction] Unsupported or empty content for MIME: "${mimeType}", File: "${fileName}"`);
  return "";
};
