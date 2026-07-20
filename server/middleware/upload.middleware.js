import multer from "multer";
import crypto from "crypto";

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

const MAX_FILE_SIZE = 16 * 1024 * 1024;

const SIGNATURE_MAP = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]],
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "application/msword": [[0xd0, 0xcf, 0x11, 0xe0]],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    [0x50, 0x4b, 0x03, 0x04],
  ],
  "application/vnd.ms-excel": [[0xd0, 0xcf, 0x11, 0xe0]],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    [0x50, 0x4b, 0x03, 0x04],
  ],
};

const EXTENSION_MAP = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

const validateFileSignature = (buffer, mimetype) => {
  const signatures = SIGNATURE_MAP[mimetype];
  if (!signatures) return true;
  return signatures.some((sig) => {
    if (buffer.length < sig.length) return false;
    return sig.every((byte, i) => buffer[i] === byte);
  });
};

const validateExtension = (filename, mimetype) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return false;
  const expectedMime = EXTENSION_MAP[ext];
  return expectedMime === mimetype;
};

const scanBuffer = async (buffer) => {
  let scanLogger = null;
  try {
    const { NodeClam } = await import("clamscan").catch(() => ({ NodeClam: null }));
    if (NodeClam) {
      const clamscan = await new NodeClam().init({ clamdscan: { socket: "/var/run/clamav/clamd.ctl" } });
      const result = await clamscan.scanBuffer(buffer);
      if (result && result.isInfected) {
        return { isInfected: true, virusName: result.viruses?.[0] || "Unknown" };
      }
    }
  } catch {
    // ClamAV not available, skip
  }
  return { isInfected: false };
};

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Allowed: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG`
      ),
      false
    );
  }

  if (!validateExtension(file.originalname, file.mimetype)) {
    return cb(new Error(`File extension does not match content type for: ${file.originalname}`), false);
  }

  cb(null, true);
};

const memoryStorage = multer.memoryStorage();

const getOrgLimits = async (req) => {
  const orgLimitMb = req.organization?.limits?.max_file_size_mb || 10;
  return orgLimitMb * 1024 * 1024;
};

export const uploadToMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).single("file");

export const uploadMultiple = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).array("files", 5);

export const handleUpload = (uploadFn) => async (req, res, next) => {
  const orgLimit = await getOrgLimits(req);

  const scopedUpload = multer({
    storage: memoryStorage,
    limits: { fileSize: orgLimit },
    fileFilter,
  });

  const handler = req.files ? scopedUpload.array("files", 5) : scopedUpload.single("file");

  handler(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: `File too large. Maximum allowed size is ${orgLimit / 1024 / 1024} MB`,
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    const files = req.files || (req.file ? [req.file] : []);

    for (const file of files) {
      if (!validateFileSignature(file.buffer, file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `File signature validation failed for: ${file.originalname}. The file may be corrupted or has incorrect type.`,
        });
      }

      const scanResult = await scanBuffer(file.buffer);
      if (scanResult.isInfected) {
        return res.status(400).json({
          success: false,
          message: `Security scan failed for: ${file.originalname}. Detected: ${scanResult.virusName}`,
        });
      }
    }

    next();
  });
};
