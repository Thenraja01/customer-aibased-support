import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

let gridFSBucket = null;

export const getGridFSBucket = () => {
  if (!gridFSBucket) {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("MongoDB connection not established");
    }
    gridFSBucket = new GridFSBucket(db, {
      bucketName: "documents",
    });
  }
  return gridFSBucket;
};

export const uploadFileToGridFS = async (fileBuffer, filename, mimeType) => {
  const bucket = getGridFSBucket();
  const uploadStream = bucket.openUploadStream(filename, {
    contentType: mimeType,
  });

  return new Promise((resolve, reject) => {
    uploadStream.on("finish", () => {
      resolve(uploadStream.id.toString());
    });
    uploadStream.on("error", reject);
    uploadStream.end(fileBuffer);
  });
};

export const getFileFromGridFS = async (fileId) => {
  const bucket = getGridFSBucket();
  const downloadStream = bucket.openDownloadStream(
    new mongoose.Types.ObjectId(fileId)
  );

  return new Promise((resolve, reject) => {
    const chunks = [];
    downloadStream.on("data", (chunk) => chunks.push(chunk));
    downloadStream.on("end", () => resolve(Buffer.concat(chunks)));
    downloadStream.on("error", reject);
  });
};

export const deleteFileFromGridFS = async (fileId) => {
  const bucket = getGridFSBucket();
  await bucket.delete(new mongoose.Types.ObjectId(fileId));
};

export const getFileInfo = async (fileId) => {
  const bucket = getGridFSBucket();
  const file = await bucket.find({
    _id: new mongoose.Types.ObjectId(fileId),
  }).toArray();
  return file[0] || null;
};
