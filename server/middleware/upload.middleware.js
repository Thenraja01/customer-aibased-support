import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import path from "path";
import fs from "fs";
import env from "../config/env.js";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "image/jpeg",
  "image/png",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Allowed: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG`
      ),
      false
    );
  }
};

const isCloudinaryConfigured =
  env.CLOUDINARY?.CLOUD_NAME &&
  env.CLOUDINARY?.CLOUD_NAME !== "your_cloud_name" &&
  env.CLOUDINARY?.API_KEY &&
  env.CLOUDINARY?.API_KEY !== "your_api_key";

let storage;

if (isCloudinaryConfigured) {
  storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const ext = path.extname(file.originalname).replace(".", "");
      return {
        folder: "customer-support/documents",
        allowed_formats: ["pdf", "doc", "docx", "xls", "xlsx", "txt", "jpg", "png"],
        resource_type: "raw",
        public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`,
        format: ext,
      };
    },
  });
} else {
  const uploadsDir = path.resolve("uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  });
}

const memoryStorage = multer.memoryStorage();

export const uploadToCloud = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).single("file");

export const uploadMultiple = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).array("files", 5);

export const handleUpload = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File too large. Maximum allowed size is 50 MB",
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};
