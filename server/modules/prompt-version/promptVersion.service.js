import PromptVersion from "./promptVersion.schema.js";
import Organization from "../organization/organization.schema.js";

export const getCurrentPrompt = async (orgId) => {
  const published = await PromptVersion.findOne({
    organization_id: orgId,
    status: "published",
  })
    .sort({ version: -1 })
    .populate("published_by", "name email")
    .lean();

  const draft = await PromptVersion.findOne({
    organization_id: orgId,
    status: "draft",
  })
    .sort({ version: -1 })
    .populate("created_by", "name email")
    .lean();

  const org = await Organization.findById(orgId).select("customPrompt").lean();

  return {
    published: published || null,
    draft: draft || null,
    customPrompt: org?.customPrompt || "",
  };
};

export const saveDraft = async (orgId, systemPrompt, userId) => {
  const existingDraft = await PromptVersion.findOne({
    organization_id: orgId,
    status: "draft",
  });

  if (existingDraft) {
    existingDraft.system_prompt = systemPrompt;
    await existingDraft.save();
    return existingDraft;
  }

  return await PromptVersion.create({
    organization_id: orgId,
    version: 1,
    system_prompt: systemPrompt,
    status: "draft",
    created_by: userId,
  });
};

export const publishPrompt = async (orgId, userId) => {
  const draft = await PromptVersion.findOne({
    organization_id: orgId,
    status: "draft",
  });

  if (!draft) throw new Error("No draft found to publish");

  const currentPublished = await PromptVersion.findOne({
    organization_id: orgId,
    status: "published",
  }).sort({ version: -1 });

  const newVersion = currentPublished ? currentPublished.version + 1 : 1;

  draft.version = newVersion;
  draft.status = "published";
  draft.published_by = userId;
  draft.published_at = new Date();
  await draft.save();

  return draft;
};

export const rollbackPrompt = async (orgId, version, userId) => {
  const target = await PromptVersion.findOne({
    organization_id: orgId,
    version,
    status: "published",
  });

  if (!target) throw new Error(`Version ${version} not found`);

  const draft = await PromptVersion.findOne({
    organization_id: orgId,
    status: "draft",
  });

  if (draft) {
    draft.system_prompt = target.system_prompt;
    await draft.save();
  } else {
    await PromptVersion.create({
      organization_id: orgId,
      version: 1,
      system_prompt: target.system_prompt,
      status: "draft",
      created_by: userId,
    });
  }

  return { message: `Rolled back to version ${version}` };
};

export const getVersionHistory = async (orgId) => {
  return await PromptVersion.find({ organization_id: orgId })
    .sort({ version: -1 })
    .populate("published_by", "name email")
    .populate("created_by", "name email")
    .lean();
};
