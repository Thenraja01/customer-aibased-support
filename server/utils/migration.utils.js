import Document from "../modules/document/document.schema.js";
import DocumentVersion from "../modules/document-version/documentVersion.schema.js";
import DocumentChunk from "../modules/document/documentChunk.schema.js";
import { normalizeRoleName } from "./constants.js";

export const runDocumentStatusMigration = async () => {
  try {
    console.log("[Migration] Running document and role access migration...");

    // 1. Migrate statuses
    const docDraftResult = await Document.updateMany({ status: "draft" }, { status: "uploaded" });
    const docPendingResult = await Document.updateMany({ status: "pending" }, { status: "pending_approval" });
    
    const verDraftResult = await DocumentVersion.updateMany({ status: "draft" }, { status: "uploaded" });
    const verPendingResult = await DocumentVersion.updateMany({ status: "pending" }, { status: "pending_approval" });

    console.log(`[Migration] Migrated ${docDraftResult.modifiedCount} draft documents, ${docPendingResult.modifiedCount} pending documents.`);
    console.log(`[Migration] Migrated ${verDraftResult.modifiedCount} draft versions, ${verPendingResult.modifiedCount} pending versions.`);

    // 2. Migrate allowed_roles and update document chunks
    const docs = await Document.find({ allowed_roles: { $exists: false } });
    let migratedDocsCount = 0;
    
    for (const doc of docs) {
      let allowed = [];
      if (doc.accessPolicy?.audience && doc.accessPolicy.audience.length > 0) {
        allowed = doc.accessPolicy.audience;
      } else {
        const assigned = (doc.assigned_role || "all").toLowerCase().trim();
        if (assigned === "all" || assigned === "public") {
          allowed = ["admin", "branch_admin", "support", "customer"];
        } else if (assigned === "customer") {
          allowed = ["admin", "branch_admin", "customer"];
        } else if (assigned === "support") {
          allowed = ["admin", "branch_admin", "support"];
        } else {
          allowed = ["admin", "branch_admin", "support"];
        }
      }
      
      // Map audience names to standard roles just in case
      allowed = allowed.map(normalizeRoleName).filter(Boolean);
      
      doc.allowed_roles = allowed;
      await doc.save();
      
      // Update chunks
      await DocumentChunk.updateMany({ document_id: doc._id }, { allowedRoles: allowed });
      
      migratedDocsCount++;
    }

    if (migratedDocsCount > 0) {
      console.log(`[Migration] Initialized allowed_roles for ${migratedDocsCount} documents.`);
    }

    console.log("[Migration] Migration completed successfully.");
  } catch (error) {
    console.error("[Migration] Error during migration:", error.message);
  }
};
