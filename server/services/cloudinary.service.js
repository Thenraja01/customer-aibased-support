import cloudinary from "../config/cloudinary.js";

/**
 * Uploads a file buffer directly to Cloudinary using upload_stream.
 * Sets the delivery type to 'authenticated' to ensure the asset is secure.
 */
export const uploadToCloudinary = (fileBuffer, publicId, resourceType) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: resourceType || "raw",
        type: "authenticated",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Deletes an authenticated asset from Cloudinary.
 */
export const deleteFromCloudinary = async (publicId, resourceType) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: resourceType || "raw",
        type: "authenticated",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
};

/**
 * Generates a signed secure delivery URL for an authenticated resource.
 */
export const generateSignedUrl = (publicId, resourceType, expiresSeconds = 3600) => {
  const options = {
    resource_type: resourceType || "raw",
    type: "authenticated",
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + expiresSeconds,
  };
  return cloudinary.url(publicId, options);
};

/**
 * Downloads a secure resource from Cloudinary into a memory Buffer.
 */
export const downloadFromCloudinary = async (publicId, resourceType) => {
  // Extract format if available (e.g. from publicId) or default to empty string
  let format = "";
  if (resourceType === "raw" && publicId.includes(".")) {
    format = publicId.split('.').pop();
  }
  
  const downloadUrl = cloudinary.utils.private_download_url(publicId, format, {
    type: "authenticated",
    resource_type: resourceType || "raw"
  });

  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error(`Failed to download secure asset from Cloudinary: ${response.statusText} (${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

export default {
  uploadToCloudinary,
  deleteFromCloudinary,
  generateSignedUrl,
  downloadFromCloudinary,
};
