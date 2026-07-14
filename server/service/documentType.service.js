import DocumentType from "../schema/DocumentsTypeSchema.schema.js";

// Create a new document type (e.g., "ID Proof", "Invoice")
export const createDocumentType = async (name) => {
  const existing = await DocumentType.findOne({ name });
  if (existing) throw new Error("Document type already exists");
  return await DocumentType.create({ name });
};

// Get all document types
export const getAllDocumentTypes = async () => {
  return await DocumentType.find().sort({ name: 1 });
};

// Get a document type by ID
export const getDocumentTypeById = async (id) => {
  const type = await DocumentType.findById(id);
  if (!type) throw new Error("Document type not found");
  return type;
};

// Update a document type name
export const updateDocumentType = async (id, name) => {
  const type = await DocumentType.findByIdAndUpdate(
    id,
    { name },
    { new: true, runValidators: true }
  );
  if (!type) throw new Error("Document type not found");
  return type;
};

// Delete a document type
export const deleteDocumentType = async (id) => {
  const type = await DocumentType.findByIdAndDelete(id);
  if (!type) throw new Error("Document type not found");
  return { message: "Document type deleted successfully" };
};
