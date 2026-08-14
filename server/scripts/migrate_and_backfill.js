import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

import Document from "../modules/document/document.schema.js";
import DocumentChunk from "../modules/document/documentChunk.schema.js";
import DocumentVersion from "../modules/document-version/documentVersion.schema.js";
import GraphEntity from "../modules/chat/graphEntity.schema.js";
import { chromaService } from "../config/chroma.js";
import { normalizeRoleName } from "../utils/constants.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/supportai";

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    const docId = "6a7a198dec6fa1139dac9731";
    console.log(`\n1. Locating target Document: ${docId}`);
    const doc = await Document.findById(docId);
    if (!doc) {
      console.error("Document not found!");
      process.exit(1);
    }

    console.log("Document found:", doc.title);

    // Ensure allowed roles includes customer
    doc.allowed_roles = ["admin", "branch_admin", "support", "customer"];
    doc.status = "published";

    // Check or create DocumentVersion
    let version = await DocumentVersion.findOne({ document_id: docId });
    if (!version) {
      console.log("Creating missing DocumentVersion...");
      version = await DocumentVersion.create({
        document_id: doc._id,
        organization_id: doc.organization_id,
        branch_id: doc.branch_id || null, // branch_id is now optional
        version_number: 1,
        file_name: doc.file_name,
        file_mimetype: doc.file_mimetype,
        file_size: doc.file_size,
        uploadedBy: doc.user_id,
        status: "published",
        allowed_roles: doc.allowed_roles,
        cloudinary_public_id: doc.cloudinary_public_id,
        cloudinary_resource_type: doc.cloudinary_resource_type,
        changelog: "Backfilled version info",
      });
      console.log("DocumentVersion created with ID:", version._id);
    } else {
      console.log("DocumentVersion already exists. Updating status and roles...");
      version.status = "published";
      version.allowed_roles = doc.allowed_roles;
      await version.save();
    }

    doc.currentVersionId = version._id;
    await doc.save();
    console.log("Document updated successfully.");

    // Update DocumentChunks
    console.log("\n2. Updating DocumentChunks...");
    const chunks = await DocumentChunk.find({ document_id: docId });
    console.log(`Found ${chunks.length} chunks to update.`);

    for (const chunk of chunks) {
      chunk.status = "published";
      chunk.allowedRoles = doc.allowed_roles;
      chunk.documentVersionId = version._id;
      await chunk.save();
    }
    console.log("DocumentChunks updated successfully.");

    // Seed Graph Entities
    console.log("\n3. Seeding Graph concept nodes...");
    const concepts = ["Shipping", "Shipment", "Delivery", "Shipping Policy"];
    for (const concept of concepts) {
      await GraphEntity.findOneAndUpdate(
        { document_id: doc._id, entity_name: concept },
        {
          entity_name: concept,
          document_id: doc._id,
          organization_id: doc.organization_id,
          branch_id: doc.branch_id || null,
        },
        { upsert: true, new: true }
      );
      console.log(`  Seeded Graph node: ${concept} -> ${doc.title}`);
    }

    // Chroma DB Backfill
    console.log("\n4. Re-indexing Chroma Vector DB...");
    try {
      await chromaService.init();
      const chromaCollection = chromaService.getCollection();

      // Retrieve all published chunks to re-index
      const publishedChunks = await DocumentChunk.find({ status: "published" });
      console.log(`Found ${publishedChunks.length} published chunks to backfill in Chroma.`);

      for (const chunk of publishedChunks) {
        console.log(`Re-indexing chunk: ${chunk._id}`);
        // Delete from Chroma first
        try {
          await chromaCollection.delete({ ids: [chunk._id.toString()] });
        } catch (e) {
          // Chunk might not exist yet
        }

        // Build metadata
        const metadata = {
          document_id: chunk.document_id.toString(),
          organization_id: chunk.organization_id.toString(),
          branch_id: chunk.branch_id ? chunk.branch_id.toString() : "",
          assigned_role: chunk.assigned_role,
          status: chunk.status,
          visibility: chunk.visibility || "branch",
          customerVisible: chunk.customerVisible || false
        };

        const rolesList = chunk.allowedRoles || ["admin", "branch_admin", "support"];
        ["super_admin", "admin", "branch_admin", "support", "customer"].forEach(r => {
          metadata[`role_${r}`] = false;
        });
        rolesList.forEach(r => {
          const norm = normalizeRoleName(r);
          if (norm) metadata[`role_${norm}`] = true;
        });
        metadata["role_admin"] = true;
        metadata["role_super_admin"] = true;

        await chromaCollection.add({
          ids: [chunk._id.toString()],
          embeddings: [chunk.embedding],
          metadatas: [metadata],
          documents: [chunk.content]
        });
      }
      console.log("Chroma DB backfill completed successfully.");
    } catch (chromaErr) {
      console.error("Chroma DB re-indexing failed:", chromaErr.message);
    }

    await mongoose.disconnect();
    console.log("\nMigration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  }
}

run();
