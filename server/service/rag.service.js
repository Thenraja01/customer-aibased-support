
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { ChatOpenAI } from "@langchain/openai";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import env from "../config/env.js";
import { updateRagStatus } from "./document.service.js";
import { saveChunks } from "./documentChunk.service.js";
import fs from "fs";
import path from "path";

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: env.OPENAI_API_KEY,
  modelName: "text-embedding-3-small",
});

export const extractText = async (buffer, mimeType) => {
  if (mimeType === "application/pdf") {
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (mimeType === "text/plain") {
    return buffer.toString("utf-8");
  }

  throw new Error(
    `Text extraction not supported for MIME type: ${mimeType}. Supported: PDF, DOC, DOCX, TXT`
  );
};

export const splitIntoChunks = async (text) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,       // characters per chunk
    chunkOverlap: 200,     // overlap to preserve context across chunks
    separators: ["\n\n", "\n", ".", " ", ""],
  });

  const docs = await splitter.createDocuments([text]);
  return docs.map((doc) => doc.pageContent);
};

export const indexDocument = async ({ documentId, buffer, mimeType }) => {
  // Update status to processing
  await updateRagStatus(documentId, "processing");

  try {
    // Step 1: Extract text
    const text = await extractText(buffer, mimeType);

    if (!text || text.trim().length === 0) {
      throw new Error("No text content could be extracted from this document");
    }

    // Step 2: Split into chunks
    const chunks = await splitIntoChunks(text);

    // Step 3: Store in ChromaDB (with document_id as metadata filter key)
    const vectorStore = await Chroma.fromTexts(
      chunks,
      chunks.map((_, i) => ({ document_id: documentId, chunk_index: i })),
      embeddings,
      {
        collectionName: env.CHROMA_COLLECTION,
        url: env.CHROMA_URL,
      }
    );

    // Step 4: Save chunk metadata to MongoDB (without embeddings for storage efficiency)
    await saveChunks(
      documentId,
      chunks.map((text_content, chunk_index) => ({
        chunk_index,
        text_content,
        embedding: [], // embeddings are stored in ChromaDB, not MongoDB
      }))
    );

    // Step 5: Mark document as indexed
    await updateRagStatus(documentId, "indexed");

    return {
      message: "Document indexed successfully",
      chunks: chunks.length,
    };
  } catch (error) {
    await updateRagStatus(documentId, "failed");
    throw new Error(`RAG indexing failed: ${error.message}`);
  }
};

/**
 * Fetch a file from a URL (Cloudinary) or local path, then trigger indexDocument.
 * This is called asynchronously after a document is approved.
 * @param {string} documentId 
 * @param {string} filePath - Cloudinary URL or local file path
 */
export const fetchAndIndexDocument = async (documentId, filePath) => {
  try {
    let buffer;
    let mimeType;

    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      const response = await fetch(filePath);
      if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
      
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      
      mimeType = response.headers.get("content-type");
      
      // Fallback if content-type is missing or octet-stream
      if (!mimeType || mimeType === "application/octet-stream") {
        const ext = filePath.split(".").pop().toLowerCase();
        if (ext === "pdf") mimeType = "application/pdf";
        else if (ext === "docx") mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        else if (ext === "txt") mimeType = "text/plain";
      }
    } else {
      buffer = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      if (ext === ".pdf") mimeType = "application/pdf";
      else if (ext === ".docx") mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      else if (ext === ".txt") mimeType = "text/plain";
      else throw new Error("Unsupported local file extension");
    }

    // Call the core indexer
    await indexDocument({ documentId, buffer, mimeType });
  } catch (error) {
    console.error(`fetchAndIndexDocument failed for ${documentId}:`, error.message);
    await updateRagStatus(documentId, "failed");
  }
};

// ── Retrieval & Answer Generation ───────────────────────────────────

const SYSTEM_PROMPT = `You are an AI assistant for a customer support system.
Use ONLY the following context from the knowledge base to answer the user's question.
If the answer is not in the context, say "I don't have enough information to answer that."
Be concise, helpful, and professional.

Context:
{context}`;

/**
 * Answer a user query using RAG:
 *  1. Embed the query
 *  2. Retrieve top-K relevant chunks from ChromaDB
 *  3. Pass chunks + query to LLM for answer generation
 *
 * @param {string} query - User's question
 * @param {object} options
 * @param {number} [options.topK=4] - Number of chunks to retrieve
 * @param {string} [options.documentId] - Optional: restrict search to one document
 * @returns {Promise<{answer: string, tokensUsed: number, responseTimeMs: number}>}
 */
export const answerQuery = async (query, { topK = 4, documentId } = {}) => {
  const start = Date.now();

  // Connect to ChromaDB vector store
  const vectorStore = await Chroma.fromExistingCollection(embeddings, {
    collectionName: env.CHROMA_COLLECTION,
    url: env.CHROMA_URL,
  });

  // Build retriever — optionally filter by document_id
  const retriever = vectorStore.asRetriever({
    k: topK,
    filter: documentId ? { document_id: documentId } : undefined,
  });

  // LLM
  const llm = new ChatOpenAI({
    openAIApiKey: env.OPENAI_API_KEY,
    modelName: "gpt-3.5-turbo",
    temperature: 0.2,
    maxTokens: env.MAX_AI_TOKENS,
    timeout: env.AI_REQUEST_TIMEOUT_MS,
  });

  // Build prompt
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    ["human", "{input}"],
  ]);

  // Build chain
  const documentChain = await createStuffDocumentsChain({ llm, prompt });
  const retrievalChain = await createRetrievalChain({
    combineDocsChain: documentChain,
    retriever,
  });

  // Invoke
  const result = await retrievalChain.invoke({ input: query });

  const responseTimeMs = Date.now() - start;

  return {
    answer: result.answer,
    tokensUsed: result.usage?.totalTokens ?? 0,
    responseTimeMs,
  };
};

// ── Delete document vectors from ChromaDB ───────────────────────────

/**
 * Remove all vectors for a document from ChromaDB
 * @param {string} documentId
 */
export const deleteDocumentVectors = async (documentId) => {
  const vectorStore = await Chroma.fromExistingCollection(embeddings, {
    collectionName: env.CHROMA_COLLECTION,
    url: env.CHROMA_URL,
  });

  await vectorStore.delete({ filter: { document_id: documentId } });
  return { message: "Document vectors removed from ChromaDB" };
};
