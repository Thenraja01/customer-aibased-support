import Document from "../schema/Document.schema.js";

/**
 * Create a new document
 */
export const createDocument = async (documentData) => {
  return await Document.create(documentData);
};

/**
 * Get all documents
 */
export const getAllDocuments = async () => {
  return await Document.find()
    .populate("user_id")
    .populate("document_type_id")
    .populate("uploaded_by")
    .sort({ uploaded_at: -1 });
};

/**
 * Get document by ID
 */
export const getDocumentById = async (documentId) => {
  return await Document.findById(documentId)
    .populate("user_id")
    .populate("document_type_id")
    .populate("uploaded_by");
};

/**
 * Get documents of a user
 */
export const getDocumentsByUser = async (userId) => {
  return await Document.find({ user_id: userId })
    .populate("document_type_id")
    .sort({ uploaded_at: -1 });
};

/**
 * Get documents uploaded by an admin/user
 */
export const getDocumentsUploadedBy = async (uploadedBy) => {
  return await Document.find({ uploaded_by: uploadedBy })
    .populate("user_id")
    .populate("document_type_id");
};

/**
 * Get documents by document type
 */
export const getDocumentsByType = async (documentTypeId) => {
  return await Document.find({
    document_type_id: documentTypeId,
  }).populate("user_id");
};

/**
 * Update document details
 */
export const updateDocument = async (documentId, updateData) => {
  return await Document.findByIdAndUpdate(
    documentId,
    updateData,
    { new: true, runValidators: true }
  );
};

/**
 * Rename document
 */
export const renameDocument = async (documentId, fileName) => {
  return await Document.findByIdAndUpdate(
    documentId,
    { file_name: fileName },
    { new: true }
  );
};

/**
 * Update verification status
 */
export const updateDocumentStatus = async (documentId, status) => {
  return await Document.findByIdAndUpdate(
    documentId,
    { status },
    { new: true }
  );
};

/**
 * Update RAG status
 */
export const updateRagStatus = async (documentId, ragStatus) => {
  return await Document.findByIdAndUpdate(
    documentId,
    { rag_status: ragStatus },
    { new: true }
  );
};

/**
 * Documents waiting for verification
 */
export const getPendingDocuments = async () => {
  return await Document.find({
    status: "pending",
  });
};

/**
 * Approved documents
 */
export const getApprovedDocuments = async () => {
  return await Document.find({
    status: "approved",
  })
    .populate("document_type_id")
    .populate("user_id");
};

/**
 * Rejected documents
 */
export const getRejectedDocuments = async () => {
  return await Document.find({
    status: "rejected",
  });
};

/**
 * Documents waiting for RAG processing
 */
export const getPendingRagDocuments = async () => {
  return await Document.find({
    rag_status: "not_processed",
  });
};

/**
 * Documents currently processing
 */
export const getProcessingDocuments = async () => {
  return await Document.find({
    rag_status: "processing",
  });
};

/**
 * Documents indexed and ready for chatbot
 */
export const getIndexedDocuments = async () => {
  return await Document.find({
    status: "approved",
    rag_status: "indexed",
  }).populate("document_type_id");
};

/**
 * Failed indexing documents
 */
export const getFailedIndexedDocuments = async () => {
  return await Document.find({
    rag_status: "failed",
  });
};

/**
 * Search documents by filename
 */
export const searchDocuments = async (keyword) => {
  return await Document.find({
    file_name: {
      $regex: keyword,
      $options: "i",
    },
  })
    .populate("user_id")
    .populate("document_type_id");
};

/**
 * Count documents of a user
 */
export const countUserDocuments = async (userId) => {
  return await Document.countDocuments({
    user_id: userId,
  });
};

/**
 * Total documents
 */
export const countDocuments = async () => {
  return await Document.countDocuments();
};

/**
 * Delete document
 */
export const deleteDocument = async (documentId) => {
  return await Document.findByIdAndDelete(documentId);
};