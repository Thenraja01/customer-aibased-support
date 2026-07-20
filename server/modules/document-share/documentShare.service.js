import DocumentShare from "./documentShare.schema.js";

export const createShare = async (data) => {
  return await DocumentShare.create(data);
};

export const getSharesForDocument = async (documentId) => {
  return await DocumentShare.find({ document_id: documentId })
    .populate("shared_by", "name email")
    .populate("shared_with", "name email")
    .sort({ created_at: -1 });
};

export const getSharesForUser = async (userId) => {
  return await DocumentShare.find({ shared_with: userId, $or: [{ expires_at: null }, { expires_at: { $gt: new Date() } }] })
    .populate("document_id", "name")
    .populate("shared_by", "name email")
    .sort({ created_at: -1 });
};

export const getAll = async (query = {}) => {
  return await DocumentShare.find(query)
    .populate("document_id", "name")
    .populate("shared_by", "name email")
    .populate("shared_with", "name email")
    .sort({ created_at: -1 });
};

export const updateShare = async (id, data) => {
  const share = await DocumentShare.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!share) throw new Error("Share not found");
  return share;
};

export const deleteShare = async (id) => {
  const share = await DocumentShare.findByIdAndDelete(id);
  if (!share) throw new Error("Share not found");
  return { message: "Share deleted" };
};
