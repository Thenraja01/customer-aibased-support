import DocumentComment from "./documentComment.schema.js";

export const createComment = async (data) => {
  return await DocumentComment.create(data);
};

export const getByDocument = async (documentId) => {
  return await DocumentComment.find({ document_id: documentId, parent_id: null })
    .populate("user_id", "name email")
    .populate("parent_id")
    .sort({ created_at: 1 });
};

export const getReplies = async (commentId) => {
  return await DocumentComment.find({ parent_id: commentId })
    .populate("user_id", "name email")
    .sort({ created_at: 1 });
};

export const getAll = async (query = {}) => {
  return await DocumentComment.find(query)
    .populate("document_id", "name")
    .populate("user_id", "name email")
    .populate("parent_id")
    .sort({ created_at: -1 });
};

export const updateComment = async (id, data) => {
  const comment = await DocumentComment.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!comment) throw new Error("Comment not found");
  return comment;
};

export const deleteComment = async (id) => {
  const comment = await DocumentComment.findByIdAndDelete(id);
  if (!comment) throw new Error("Comment not found");
  await DocumentComment.deleteMany({ parent_id: id });
  return { message: "Comment deleted" };
};
