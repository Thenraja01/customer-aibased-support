/**
 * ChromaDB Service
 *
 * Provides org-scoped vector storage using ChromaDB as the dedicated vector DB.
 * Falls back to MongoDB-only search if ChromaDB is unavailable.
 *
 * Collection naming: org_{org_id}
 */

const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000';
const CHROMA_TENANT = process.env.CHROMA_TENANT || 'default_tenant';
const CHROMA_DATABASE = process.env.CHROMA_DATABASE || 'default_database';

let chromaClient = null;

/**
 * Lazily initialise the ChromaDB client
 */
const getClient = async () => {
  if (chromaClient) return chromaClient;
  try {
    const { ChromaClient } = await import('chromadb');
    chromaClient = new ChromaClient({
      path: CHROMA_URL,
      tenant: CHROMA_TENANT,
      database: CHROMA_DATABASE,
    });
    // Heartbeat to confirm connectivity
    await chromaClient.heartbeat();
    console.log('[ChromaDB] Client connected at', CHROMA_URL);
    return chromaClient;
  } catch (err) {
    console.warn('[ChromaDB] Not available — falling back to MongoDB search:', err.message);
    return null;
  }
};

/** Collection name per organisation */
export const getCollectionName = (organizationId) => `org_${organizationId}`;

/**
 * Get-or-create a collection for the given organisation.
 * Uses cosine distance to match embedding cosine similarity.
 */
const getOrCreateCollection = async (client, organizationId) => {
  const name = getCollectionName(organizationId);
  return client.getOrCreateCollection({
    name,
    metadata: { 'hnsw:space': 'cosine' },
  });
};

/**
 * Upsert a batch of vectors into ChromaDB.
 *
 * @param {string} organizationId
 * @param {Array<{id: string, embedding: number[], metadata: object, document: string}>} vectors
 */
export const upsertVectors = async (organizationId, vectors) => {
  const client = await getClient();
  if (!client) {
    console.warn('[ChromaDB] Not configured, skipping upsert');
    return { upserted: 0 };
  }

  try {
    const collection = await getOrCreateCollection(client, organizationId);
    await collection.upsert({
      ids: vectors.map((v) => v.id),
      embeddings: vectors.map((v) => v.embedding),
      metadatas: vectors.map((v) => v.metadata || {}),
      documents: vectors.map((v) => v.document || ''),
    });
    return { upserted: vectors.length };
  } catch (err) {
    console.error('[ChromaDB] Upsert failed:', err.message);
    throw err;
  }
};

/**
 * Query the org's collection for the nearest neighbours.
 *
 * @param {string}   organizationId
 * @param {number[]} queryEmbedding
 * @param {number}   topK
 * @param {object}   whereFilter  - ChromaDB "where" metadata filter
 * @returns {Promise<{ids, distances, metadatas, documents}>}
 */
export const queryVectors = async (organizationId, queryEmbedding, topK = 5, whereFilter = {}) => {
  const client = await getClient();
  if (!client) {
    console.warn('[ChromaDB] Not configured, returning empty results');
    return { ids: [[]], distances: [[]], metadatas: [[]], documents: [[]] };
  }

  try {
    const collection = await getOrCreateCollection(client, organizationId);
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      ...(Object.keys(whereFilter).length > 0 && { where: whereFilter }),
      include: ['metadatas', 'documents', 'distances'],
    });
    return results;
  } catch (err) {
    console.error('[ChromaDB] Query failed:', err.message);
    return { ids: [[]], distances: [[]], metadatas: [[]], documents: [[]] };
  }
};

/**
 * Delete all vectors for a specific document within an org's collection.
 *
 * @param {string} organizationId
 * @param {string} documentId
 */
export const deleteVectorsByDocument = async (organizationId, documentId) => {
  const client = await getClient();
  if (!client) return { deleted: 0 };

  try {
    const collection = await getOrCreateCollection(client, organizationId);
    await collection.delete({ where: { document_id: documentId } });
    return { deleted: true };
  } catch (err) {
    console.error('[ChromaDB] Delete by document failed:', err.message);
    return { deleted: false };
  }
};

/**
 * Drop the entire org collection (used when org is deleted).
 *
 * @param {string} organizationId
 */
export const deleteOrgCollection = async (organizationId) => {
  const client = await getClient();
  if (!client) return { deleted: false };

  try {
    const name = getCollectionName(organizationId);
    await client.deleteCollection({ name });
    return { deleted: true };
  } catch (err) {
    console.error('[ChromaDB] Delete collection failed:', err.message);
    return { deleted: false };
  }
};

/** Check if ChromaDB is reachable */
export const isChromaConfigured = async () => {
  const client = await getClient();
  return !!client;
};

export default {
  upsertVectors,
  queryVectors,
  deleteVectorsByDocument,
  deleteOrgCollection,
  getCollectionName,
  isChromaConfigured,
};
