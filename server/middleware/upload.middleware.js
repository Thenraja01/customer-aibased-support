import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import path from "path";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
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

// ── Cloudinary Storage ──────────────────────────────────────────────
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).replace(".", "");
    return {
      folder: "customer-support/documents",
      allowed_formats: ["pdf", "doc", "docx", "xls", "xlsx", "txt", "jpg", "png"],
      resource_type: "raw", // for non-image files
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`,
      format: ext,
    };
  },
});

// ── Memory Storage ────────────────────────────────────────────────────
const memoryStorage = multer.memoryStorage();

// ── Upload instances ────────────────────────────────────────────────

// Single file → Cloudinary (production)
export const uploadToCloud = multer({
  storage: cloudinaryStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).single("file");


// Multiple files → memory
export const uploadMultiple = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).array("files", 5);

// ── Middleware wrapper (handles multer errors cleanly) ───────────────
export const handleUpload = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File too large. Maximum allowed size is 10 MB",
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
