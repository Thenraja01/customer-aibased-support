import { ChromaClient } from "chromadb";
import env from "./env.js";

class ChromaService {
  constructor() {
    this.client = null;
    this.collection = null;
    this.collectionName = "document_chunks";
  }

  async init() {
    try {
      this.client = new ChromaClient({
        path: env.CHROMA_URL || "http://localhost:8000",
      });

      // Check if collection exists, create if not
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        metadata: { "hnsw:space": "cosine" },
      });

      console.log(`[ChromaDB] Connected and collection '${this.collectionName}' is ready.`);
    } catch (error) {
      console.error("[ChromaDB] Initialization failed:", error.message);
    }
  }

  getCollection() {
    if (!this.collection) {
      throw new Error("Chroma collection not initialized");
    }
    return this.collection;
  }
}

export const chromaService = new ChromaService();
