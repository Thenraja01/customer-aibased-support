import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

export const extractTextFromFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".txt":
    case ".md":
    case ".csv":
      return fs.readFileSync(filePath, "utf-8");

    case ".html":
    case ".htm": {
      const html = fs.readFileSync(filePath, "utf-8");
      return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }

    case ".pdf": {
      const pdfParse = (await import("pdf-parse")).default;
      const buffer = fs.readFileSync(filePath);
      const result = await pdfParse(buffer);
      return result.text;
    }

    case ".docx": {
      const mammoth = await import("mammoth");
      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    case ".doc":
      throw new Error(".doc format not supported. Please convert to .docx first.");

    default:
      throw new Error(`Unsupported file format: ${ext}`);
  }
};

export const extractTextFromBuffer = async (buffer, filename) => {
  const ext = path.extname(filename).toLowerCase();

  switch (ext) {
    case ".txt":
    case ".md":
    case ".csv":
      return buffer.toString("utf-8");

    case ".html":
    case ".htm":
      return buffer.toString("utf-8").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    case ".pdf": {
      const pdfParse = (await import("pdf-parse")).default;
      const result = await pdfParse(buffer);
      return result.text;
    }

    case ".docx": {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    default:
      throw new Error(`Unsupported file format: ${ext}`);
  }
};

export const extractTextFromUrl = async (url) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          return extractTextFromUrl(response.headers.location).then(resolve).catch(reject);
        }
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", async () => {
          try {
            const buffer = Buffer.concat(chunks);
            const urlPath = new URL(url).pathname;
            const ext = path.extname(urlPath).toLowerCase() || ".txt";

            if (ext === ".pdf") {
              const pdfParse = (await import("pdf-parse")).default;
              const result = await pdfParse(buffer);
              resolve(result.text);
            } else if (ext === ".docx") {
              const mammoth = await import("mammoth");
              const result = await mammoth.extractRawText({ buffer });
              resolve(result.value);
            } else {
              resolve(buffer.toString("utf-8"));
            }
          } catch (err) {
            reject(err);
          }
        });
        response.on("error", reject);
      })
      .on("error", reject);
  });
};
