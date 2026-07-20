import { Worker, Queue } from "bullmq";
import Document from "../modules/document/document.schema.js";
import DocumentChunk from "../modules/document/documentChunk.model.js";
import Organization from "../modules/organization/organization.schema.js";
import { extractTextFromBuffer } from "../utils/textExtractor.js";
import { generateBatchEmbeddings, isLLMConfigured } from "../utils/llm.utils.js";
import { computeEmbedding } from "../utils/ai.utils.js";
import { generateChunkHash } from "../utils/hash.utils.js";
import { getQueueConnection } from "../services/redis.service.js";

const RAG_QUEUE_NAME = "rag-pipeline";

let queueInstance = null;

export const getQueue = () => {
  if (!queueInstance) {
    const connection = getQueueConnection();
    queueInstance = new Queue(RAG_QUEUE_NAME, { connection });
    queueInstance.on("error", (err) => {
      console.warn("[RAG Queue] Redis connection error:", err.message);
    });
  }
  return queueInstance;
};

export const enqueueDocument = async (documentId, organizationId, fileBuffer, mimetype) => {
  const queue = getQueue();
  await Document.findByIdAndUpdate(documentId, {
    rag_status: "pending",
    rag_queued_at: new Date(),
    rag_error: null,
  });
  await queue.add("ingest-document", {
    document_id: documentId.toString(),
    organization_id: organizationId.toString(),
    file_buffer: fileBuffer.toString("base64"),
    mimetype,
  }, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  });
};

const startWorker = () => {
  let connection;
  try {
    connection = getQueueConnection();
    connection.on("error", () => {});
  } catch {
    console.warn("[RAG Worker] Redis unavailable, RAG worker disabled");
    return null;
  }

  const worker = new Worker(
    RAG_QUEUE_NAME,
    async (job) => {
      const { document_id, organization_id, file_buffer, mimetype } = job.data;

      await Document.findByIdAndUpdate(document_id, {
        rag_status: "processing",
        rag_queued_at: new Date(),
      });

      try {
        const buffer = Buffer.from(file_buffer, "base64");
        const text = await extractTextFromBuffer(buffer, `file.${mimetype.split("/")[1] || "txt"}`);

        const orgConfig = await Organization.findById(organization_id).lean();
        const chunkSize = orgConfig?.ai_config?.chunk_size || 500;
        const chunkOverlap = orgConfig?.ai_config?.chunk_overlap || 100;

        const chunks = chunkText(text, chunkSize, chunkOverlap);
        const chunkContents = chunks.map((c) => c.content);

        let embeddings;
        if (isLLMConfigured()) {
          try {
            embeddings = await generateBatchEmbeddings(chunkContents);
          } catch {
            embeddings = chunkContents.map((c) => computeEmbedding(c));
          }
        } else {
          embeddings = chunkContents.map((c) => computeEmbedding(c));
        }

        const savedChunks = [];
        const chromaVectors = [];
        for (let i = 0; i < chunks.length; i++) {
          const existing = await DocumentChunk.findOne({
            document_id,
            content_hash: chunks[i].content_hash,
          });
          if (!existing) {
            const doc = await DocumentChunk.create({
              document_id,
              organization_id,
              chunk_index: i,
              content: chunks[i].content,
              content_hash: chunks[i].content_hash,
              token_count: chunks[i].token_count,
              embedding: embeddings[i],
            });
            savedChunks.push(doc);
            // Prepare ChromaDB vector record
            chromaVectors.push({
              id: doc._id.toString(),
              embedding: embeddings[i],
              metadata: {
                document_id,
                organization_id,
                chunk_index: i,
                content_hash: chunks[i].content_hash,
              },
              document: chunks[i].content,
            });
          }
        }
        if (chromaVectors.length > 0) {
          try {
            const { upsertVectors } = await import('../services/chroma.service.js');
            await upsertVectors(organization_id, chromaVectors);
          } catch (chromaErr) {
            console.warn('[RAG Worker] ChromaDB upsert failed, MongoDB-only search active:', chromaErr.message);
          }
        }

        await Document.findByIdAndUpdate(document_id, {
          rag_status: 'completed',
          total_chunks: savedChunks.length,
          processed_at: new Date(),
          rag_error: null,
        });

        return { chunks_created: savedChunks.length };
      } catch (err) {
        await Document.findByIdAndUpdate(document_id, {
          rag_status: "failed",
          rag_error: err.message,
        });
        throw err;
      }
    },
    {
      connection,
      concurrency: 5,
      autorun: false,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[RAG Worker] Job ${job.id} completed:`, job.returnvalue);
  });

  worker.on("failed", (job, err) => {
    console.error(`[RAG Worker] Job ${job.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.warn("[RAG Worker] Redis connection error — worker paused:", err.message);
  });

  worker.run();

  console.log("[RAG Worker] Started listening for jobs");
  return worker;
};

function chunkText(text, chunkSize, overlap) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const content = text.slice(start, end);
    chunks.push({
      content,
      chunk_index: chunks.length,
      content_hash: generateChunkHash(content),
      token_count: Math.ceil(content.length / 4),
    });
    start = end - overlap;
    if (start + overlap >= text.length || start >= text.length) break;
    if (start < 0) start = 0;
  }
  return chunks;
}

let workerInstance = null;

export const startRAGWorker = () => {
  if (!workerInstance) {
    workerInstance = startWorker();
  }
  return workerInstance;
};

export const stopRAGWorker = async () => {
  if (workerInstance) {
    await workerInstance.close();
    workerInstance = null;
  }
};
