import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Document from "../modules/document/document.schema.js";
import DocumentChunk from "../modules/document/documentChunk.schema.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/supportai";

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const approvedDocs = await Document.find({ status: "approved" }).lean();
    console.log(`Found ${approvedDocs.length} approved documents`);

    let updatedCount = 0;
    for (const doc of approvedDocs) {
      const result = await DocumentChunk.updateMany(
        { document_id: doc._id, status: { $ne: "approved" } },
        { status: "approved", assigned_role: (doc.assigned_role || "all").toLowerCase() }
      );
      if (result.modifiedCount > 0) {
        console.log(`  Fixed ${result.modifiedCount} chunks for document ${doc._id}`);
        updatedCount += result.modifiedCount;
      }
    }

    console.log(`\nDone. ${updatedCount} chunks synced to approved.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  }
}

main();
