import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export const extractTextFromBuffer = async (buffer, mimeType) => {
  if (!buffer || !buffer.length) return "";

  if (mimeType === "text/plain" || mimeType === "text/txt") {
    return buffer.toString("utf-8");
  }

  if (mimeType === "application/pdf") {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (
    mimeType === "image/jpeg" ||
    mimeType === "image/jpg" ||
    mimeType === "image/png"
  ) {
    return "";
  }

  console.warn(`No text extraction for MIME type: ${mimeType}`);
  return "";
};
