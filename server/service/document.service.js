import Document from "../schema/Document.schema.js";

// Upload / create a document record
export const createDocument = async ({
  user_id,
  document_type_id,
  file_name,
  file_path,
  uploaded_by,
}) => {
  return await Document.create({
    user_id,
    document_type_id,
    file_name,
    file_path,
    uploaded_by,
    status: "pending",
  });
};

// Get all documents (admin)
export const getAllDocuments = async () => {
  return await Document.find()
    .populate("user_id", "name email")
    .populate("document_type_id", "name")
    .populate("uploaded_by", "name email")
    .sort({ uploaded_at: -1 });
};

// Get a single document by ID
export const getDocumentById = async (documentId) => {
  const doc = await Document.findById(documentId)
    .populate("user_id", "name email")
    .populate("document_type_id", "name")
    .populate("uploaded_by", "name email");

  if (!doc) throw new Error("Document not found");
  return doc;
};

// Get all documents uploaded by a user
export const getDocumentsByUser = async (userId) => {
  return await Document.find({ user_id: userId })
    .populate("document_type_id", "name")
    .sort({ uploaded_at: -1 });
};

// Get documents by approval status
export const getDocumentsByStatus = async (status) => {
  const allowed = ["pending", "approved", "rejected"];
  if (!allowed.includes(status)) throw new Error("Invalid document status");

  return await Document.find({ status })
    .populate("user_id", "name email")
    .populate("document_type_id", "name")
    .sort({ uploaded_at: -1 });
};

// Update document approval status
export const updateDocumentStatus = async (documentId, status) => {
  const allowed = ["pending", "approved", "rejected"];
  if (!allowed.includes(status)) throw new Error("Invalid status value");

  const doc = await Document.findByIdAndUpdate(
    documentId,
    { status },
    { new: true }
  );
  if (!doc) throw new Error("Document not found");
  return doc;
};


// Delete a document
export const deleteDocument = async (documentId) => {
  const doc = await Document.findByIdAndDelete(documentId);
  if (!doc) throw new Error("Document not found");
  return { message: "Document deleted successfully" };
};