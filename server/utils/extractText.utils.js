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
