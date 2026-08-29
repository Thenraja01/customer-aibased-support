import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";
import env from "../config/env.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY?.CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: env.CLOUDINARY?.API_KEY || process.env.CLOUDINARY_API_KEY || "123456",
  api_secret: env.CLOUDINARY?.API_SECRET || process.env.CLOUDINARY_API_SECRET || "secret",
});

export const uploadToCloudinary = async (fileBuffer, filename, folder = "documents", options = {}) => {
  const sanitizedName = path.basename(filename || "document.bin");
  
  // Cache to local uploads folder as fallback
  try {
    const uploadsDir = path.resolve("uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    fs.writeFileSync(path.join(uploadsDir, sanitizedName), fileBuffer);
  } catch (fsErr) {
    console.warn("[Cloudinary] Local cache warning:", fsErr.message);
  }

  try {
    return new Promise((resolve) => {
      const resourceType = options.resourceType || "auto";
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType, public_id: filename },
        (error, result) => {
          if (error) {
            console.warn("[Cloudinary] Cloud upload fallback:", error.message);
            resolve({
              url: `/uploads/${sanitizedName}`,
              public_id: filename,
              bytes: fileBuffer?.length || 0,
            });
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(fileBuffer);
    });
  } catch {
    return {
      url: `/uploads/${sanitizedName}`,
      public_id: filename,
      bytes: fileBuffer?.length || 0,
    };
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch {
    return { result: "ok" };
  }
};

export const downloadFromCloudinary = async (publicIdOrUrl, resourceType = "raw") => {
  try {
    if (!publicIdOrUrl) return Buffer.from("");

    const baseName = typeof publicIdOrUrl === "string" ? path.basename(publicIdOrUrl) : "";
    const localCandidates = [
      path.resolve("uploads", baseName),
      path.resolve("../uploads", baseName),
      path.resolve("docs", baseName),
      path.resolve("../docs", baseName),
      path.resolve("docs/knowledge_base", baseName),
      path.resolve("../docs/knowledge_base", baseName),
    ];

    for (const cand of localCandidates) {
      if (fs.existsSync(cand)) {
        return fs.readFileSync(cand);
      }
    }

    let downloadUrl = publicIdOrUrl;
    if (typeof downloadUrl === "string" && !downloadUrl.startsWith("http://") && !downloadUrl.startsWith("https://")) {
      downloadUrl = cloudinary.url(publicIdOrUrl, {
        resource_type: resourceType || "auto",
        secure: true,
        sign_url: true,
      });
    }

    if (downloadUrl && (downloadUrl.startsWith("http://") || downloadUrl.startsWith("https://"))) {
      const res = await fetch(downloadUrl);
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        return Buffer.from(arrayBuf);
      }
    }
  } catch (err) {
    console.warn("[Cloudinary] download error:", err.message);
  }
  return Buffer.from("");
};

export const generateSignedUrl = (publicId, resourceType = "auto") => {
  try {
    return cloudinary.url(publicId, { sign_url: true, secure: true, resource_type: resourceType });
  } catch {
    return `/uploads/${path.basename(publicId)}`;
  }
};
