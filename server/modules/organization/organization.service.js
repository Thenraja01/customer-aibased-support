import Organization from "./organization.schema.js";
import { escapeRegex } from "../../utils/escapeRegex.js";

export const createOrganization = async (data) => {
  const cleanData = { ...data };

  if (cleanData.domain) {
    if (typeof cleanData.domain === "string" && cleanData.domain.trim()) {
      cleanData.domain = cleanData.domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
    } else {
      delete cleanData.domain;
    }
  } else {
    delete cleanData.domain;
  }

  if (cleanData.organization_id) {
    cleanData.organization_id = String(cleanData.organization_id).trim();
    const existingOrgId = await Organization.findOne({ organization_id: cleanData.organization_id });
    if (existingOrgId) throw new Error("Organization ID already registered");
  }

  if (cleanData.email) {
    cleanData.email = String(cleanData.email).trim().toLowerCase();
    const existingEmail = await Organization.findOne({ email: cleanData.email });
    if (existingEmail) throw new Error("Organization email already registered");
  }

  if (cleanData.domain) {
    const existingDomain = await Organization.findOne({ domain: cleanData.domain });
    if (existingDomain) throw new Error("Organization domain already registered");
  }

  if (Array.isArray(cleanData.allowed_registration_roles)) {
    cleanData.allowed_registration_roles = cleanData.allowed_registration_roles.filter(Boolean);
  } else {
    cleanData.allowed_registration_roles = ["admin", "branch_admin", "support", "customer"];
  }

  return await Organization.create(cleanData);
};

export const getAllOrganizations = async () => {
  return await Organization.find().sort({ created_at: -1 });
};

export const getOrganizationById = async (id) => {
  const org = await Organization.findById(id);
  if (!org) throw new Error("Organization not found");
  return org;
};

export const getOrganizationByOrgId = async (organizationId) => {
  const org = await Organization.findOne({ organization_id: organizationId });
  if (!org) throw new Error("Organization not found");
  return org;
};

export const updateOrganization = async (id, data) => {
  const updateData = { ...data };
  const unsetFields = {};

  if ("allowed_registration_roles" in updateData) {
    if (Array.isArray(updateData.allowed_registration_roles)) {
      updateData.allowed_registration_roles = updateData.allowed_registration_roles.filter(Boolean);
    }
  }

  if ("domain" in updateData) {
    if (!updateData.domain || typeof updateData.domain !== "string" || !updateData.domain.trim()) {
      delete updateData.domain;
      unsetFields.domain = 1;
    } else {
      updateData.domain = updateData.domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
    }
  }

  if (updateData.logo && typeof updateData.logo === "object") {
    if (updateData.logo.url !== undefined) {
      updateData["logo.url"] = updateData.logo.url;
      delete updateData.logo;
    }
  }

  if (updateData.brand_colors && typeof updateData.brand_colors === "object") {
    if (updateData.brand_colors.primary !== undefined) updateData["brand_colors.primary"] = updateData.brand_colors.primary;
    if (updateData.brand_colors.secondary !== undefined) updateData["brand_colors.secondary"] = updateData.brand_colors.secondary;
    if (updateData.brand_colors.accent !== undefined) updateData["brand_colors.accent"] = updateData.brand_colors.accent;
    delete updateData.brand_colors;
  }

  const updateOp = { $set: updateData };
  if (Object.keys(unsetFields).length > 0) {
    updateOp.$unset = unsetFields;
  }

  const org = await Organization.findByIdAndUpdate(id, updateOp, {
    new: true,
    runValidators: true,
  });
  if (!org) throw new Error("Organization not found");
  return org;
};

import mongoose from "mongoose";
import Branch from "../branch/branch.schema.js";
import User from "../user/user.schema.js";
import Ticket from "../ticket/ticket.schema.js";
import Chat from "../chat/chat.schema.js";
import Message from "../message/message.schema.js";
import Document from "../document/document.schema.js";
import DocumentChunk from "../document/documentChunk.schema.js";
import DocumentType from "../document-type/documentType.schema.js";
import AISession from "../ai-session/aiSession.schema.js";
import AuditLog from "../audit-log/auditLog.schema.js";
import FAQ from "../faq/faq.schema.js";
import KnowledgeGap from "../knowledge-gap/knowledgeGap.schema.js";
import PromptVersion from "../prompt-version/promptVersion.schema.js";
import ChatMemory from "../memory/memory.schema.js";
import RefreshSession from "../refresh-session/refreshSession.schema.js";
import Notification from "../notification/notification.schema.js";
import { deleteFromCloudinary } from "../../services/cloudinary.service.js";
import DocumentVersion from "../document-version/documentVersion.schema.js";
import DocumentVerification from "../document-verification/documentVerification.schema.js";
import DocumentApproval from "../document-approval/documentApproval.schema.js";

const purgeTenantData = async (orgIdStr) => {
  try {
    const orgId = new mongoose.Types.ObjectId(orgIdStr);
    
    // 1. Delete Cloudinary files
    try {
      const docs = await Document.find({ organization_id: orgId }).select("cloudinary_public_id cloudinary_resource_type branch_id").lean();
      for (const doc of docs) {
        if (doc.cloudinary_public_id) {
          await deleteFromCloudinary(doc.cloudinary_public_id, doc.cloudinary_resource_type, {
            organizationId: orgId,
            branchId: doc.branch_id,
          }).catch(() => {});
        }
      }
      const versions = await DocumentVersion.find({ organization_id: orgId }).select("cloudinary_public_id cloudinary_resource_type branch_id").lean();
      for (const ver of versions) {
        if (ver.cloudinary_public_id) {
          await deleteFromCloudinary(ver.cloudinary_public_id, ver.cloudinary_resource_type, {
            organizationId: orgId,
            branchId: ver.branch_id,
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error("[Tenant Purge] Failed to delete Cloudinary files:", err.message);
    }

    // 3. Delete all related MongoDB collections
    await Promise.all([
      Branch.deleteMany({ organization_id: orgId }),
      User.deleteMany({ organization_id: orgId }),
      Ticket.deleteMany({ organization_id: orgId }),
      Chat.deleteMany({ organization_id: orgId }),
      Message.deleteMany({ organization_id: orgId }),
      Document.deleteMany({ organization_id: orgId }),
      DocumentVersion.deleteMany({ organization_id: orgId }),
      DocumentApproval.deleteMany({ organization_id: orgId }),
      DocumentVerification.deleteMany({ document_id: { $in: await Document.find({ organization_id: orgId }).select("_id").lean().then(docs => docs.map(d => d._id)) } }),
      DocumentChunk.deleteMany({ organization_id: orgId }),
      DocumentType.deleteMany({ organization_id: orgId }),
      AISession.deleteMany({ organization_id: orgId }),
      AuditLog.deleteMany({ organization_id: orgId }),
      FAQ.deleteMany({ organization_id: orgId }),
      KnowledgeGap.deleteMany({ organization_id: orgId }),
      PromptVersion.deleteMany({ organization_id: orgId }),
      ChatMemory.deleteMany({ organization_id: orgId }),
      RefreshSession.deleteMany({ organization_id: orgId }),
      Notification.deleteMany({ organization_id: orgId }),
    ]);

    // Finally delete the organization itself
    await Organization.findByIdAndDelete(orgId);
    console.log(`[Tenant Purge] Purged organization: ${orgIdStr}`);
  } catch (err) {
    console.error("[Tenant Purge] Critical error during tenant purge:", err);
  }
};

export const deleteOrganization = async (id) => {
  const org = await Organization.findById(id);
  if (!org) throw new Error("Organization not found");

  // Lock tenant
  org.status = "DELETION_PENDING";
  await org.save();

  // Run async tenant purge (do not await to avoid timeout)
  purgeTenantData(id).catch(err => console.error("Purge Error:", err));

  return { message: "Organization deletion process started" };
};

export const searchOrganizations = async (keyword) => {
  const safe = escapeRegex(keyword);
  return await Organization.find({
    name: { $regex: safe, $options: "i" },
  });
};

export const deleteAllOrganizations = async () => {
  const orgs = await Organization.find({
    email: { $nin: ["default@supportai.com", "supernova@gmail.com"] }
  }).select("_id").lean();

  const orgIds = orgs.map(o => o._id.toString());
  
  await Organization.updateMany(
    { _id: { $in: orgIds } },
    { status: "DELETION_PENDING" }
  );

  for (const id of orgIds) {
    purgeTenantData(id).catch(err => console.error("Purge Error:", err));
  }

  return { deletedCount: orgIds.length, orgIds };
};
