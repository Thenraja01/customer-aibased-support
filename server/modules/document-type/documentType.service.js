import DocumentType from "./documentType.schema.js";

export const createDocumentType = async (data) => {
  return await DocumentType.create(data);
};

export const getAllDocumentTypes = async () => {
  return await DocumentType.find().sort({ name: 1 });
};

export const getDocumentTypeById = async (id) => {
  const dt = await DocumentType.findById(id);
  if (!dt) throw new Error("Document type not found");
  return dt;
};

export const updateDocumentType = async (id, data) => {
  const dt = await DocumentType.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!dt) throw new Error("Document type not found");
  return dt;
};

export const deleteDocumentType = async (id) => {
  const dt = await DocumentType.findByIdAndDelete(id);
  if (!dt) throw new Error("Document type not found");
  return { message: "Document type deleted" };
};
