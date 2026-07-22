import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export const extractTextFromFile = async (filePath, mimeType) => {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".txt") {
    return fs.readFileSync(filePath, "utf-8");
  }

  if (ext === ".pdf") {
    const buf = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: buf });
    const result = await parser.getText();
    return result.text;
  }

  if ([".docx"].includes(ext)) {
    const buf = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer: buf });
    return result.value;
  }

  if ([".jpg", ".jpeg", ".png"].includes(ext)) {
    return path.basename(filePath, ext).replace(/[_-]/g, " ");
  }

  console.warn(`No text extraction for: ${ext}`);
  return "";
};

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
