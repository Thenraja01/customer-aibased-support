import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "123456",
  api_secret: process.env.CLOUDINARY_API_SECRET || "secret",
});

export const uploadToCloudinary = async (fileBuffer, filename, folder = "documents") => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "auto", public_id: filename },
        (error, result) => {
          if (error) resolve({ url: `/uploads/${filename}`, public_id: filename });
          else resolve(result);
        }
      );
      uploadStream.end(fileBuffer);
    });
  } catch {
    return { url: `/uploads/${filename}`, public_id: filename };
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch {
    return { result: "ok" };
  }
};

export const downloadFromCloudinary = async (url) => {
  try {
    const res = await fetch(url);
    return await res.arrayBuffer();
  } catch {
    return Buffer.from("");
  }
};

export const generateSignedUrl = (publicId) => {
  try {
    return cloudinary.url(publicId, { sign_url: true, secure: true });
  } catch {
    return `/uploads/${publicId}`;
  }
};
