import DocumentVerification from "./documentVerification.schema.js";
import { updateDocumentStatus, getDocumentById } from "../document/document.service.js";
import * as ragService from "../rag/rag.service.js";
import * as docService from "../document/document.service.js";
import { extractTextFromUrl } from "../../utils/textExtractor.js";

export const createVerification = async (data) => {
  return await DocumentVerification.create(data);
};

export const getVerificationByDocument = async (documentId) => {
  return await DocumentVerification.findOne({ document_id: documentId })
    .populate("verified_by", "name email");
};

export const getAllVerifications = async () => {
  return await DocumentVerification.find()
    .populate("document_id", "title file_url organization_id")
    .populate("verified_by", "name email")
    .sort({ created_at: -1 });
};

export const getVerificationsByStatus = async (status) => {
  return await DocumentVerification.find({ status })
    .populate("document_id", "title file_url organization_id")
    .populate("verified_by", "name email");
};

export const approveVerification = async (id) => {
  const verification = await DocumentVerification.findByIdAndUpdate(
    id,
    { status: "approved" },
    { new: true }
  );
  if (!verification) throw new Error("Verification not found");
  await updateDocumentStatus(verification.document_id, "approved");

  processRAGPipelineAsync(verification.document_id).catch((err) =>
    console.error("[RAG Pipeline] Error:", err.message)
  );

  return verification;
};

export const rejectVerification = async (id, remarks) => {
  const verification = await DocumentVerification.findByIdAndUpdate(
    id,
    { status: "rejected", remarks },
    { new: true }
  );
  if (!verification) throw new Error("Verification not found");
  await updateDocumentStatus(verification.document_id, "rejected");
  return verification;
};

export const deleteVerification = async (id) => {
  const v = await DocumentVerification.findByIdAndDelete(id);
  if (!v) throw new Error("Verification not found");
  return { message: "Verification deleted" };
};

async function processRAGPipelineAsync(documentId) {
  console.log(`[RAG Pipeline] Starting for document ${documentId}`);

  try {
    const doc = await docService.getDocumentById(documentId);
    if (!doc) {
      console.error(`[RAG Pipeline] Document ${documentId} not found`);
      return;
    }

    let text = "";

    if (doc.file_url) {
      try {
        text = await extractTextFromUrl(doc.file_url);
      } catch (err) {
        console.error(`[RAG Pipeline] Failed to extract text from URL: ${err.message}`);
      }
    }

    if (!text) {
      console.error(`[RAG Pipeline] No text extracted for document ${documentId}`);
      return;
    }

    console.log(`[RAG Pipeline] Extracted ${text.length} chars from document ${documentId}`);

    const result = await ragService.fullPipeline(documentId, text);

    console.log(`[RAG Pipeline] Completed for document ${documentId}: ${result.chunksCreated} chunks, graph: ${result.graphBuilt}`);
  } catch (err) {
    console.error(`[RAG Pipeline] Failed for document ${documentId}:`, err.message);
  }
}
