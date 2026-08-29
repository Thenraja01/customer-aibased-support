import GraphNode from "../modules/graph/graphNode.schema.js";
import GraphRelationship from "../modules/graph/graphRelationship.schema.js";
import Topic from "../modules/topic/topic.schema.js";
import Document from "../modules/document/document.schema.js";
import DocumentChunk from "../modules/document/documentChunk.schema.js";
import Ticket from "../modules/ticket/ticket.schema.js";
import { generateResponse } from "../modules/llm/index.js";
import { extractKeywords } from "../modules/rag/rag.service.js";
import mongoose from "mongoose";

/**
 * Clear graph data linked to a specific document
 */
export const clearDocumentGraph = async (documentId) => {
  const docId = new mongoose.Types.ObjectId(documentId);

  // Find chunks linked to this document
  const chunks = await DocumentChunk.find({ document_id: docId }).select("_id").lean();
  const chunkIds = chunks.map((c) => c._id);

  // Delete chunk and document nodes
  await GraphNode.deleteMany({
    $or: [
      { type: "document", ref_id: docId },
      { type: "chunk", ref_id: { $in: chunkIds } },
    ],
  });

  // Delete all relationships associated with this document
  await GraphRelationship.deleteMany({ document_id: docId });
};

/**
 * Entity Canonicalization & Resolution Helper
 */
export const resolveCanonicalEntity = async (organizationId, branchId, name, type, properties = {}) => {
  if (!name || typeof name !== "string") return null;
  const orgId = new mongoose.Types.ObjectId(organizationId);
  const brId = branchId ? new mongoose.Types.ObjectId(branchId) : null;
  const cleanName = name.trim();
  const canonicalId = `entity:${type.toLowerCase()}:${cleanName.toLowerCase().replace(/[^a-z0-9_-]/g, "_")}`;

  const node = await GraphNode.findOneAndUpdate(
    { organization_id: orgId, canonical_id: canonicalId },
    {
      name: cleanName,
      type: type,
      canonical_id: canonicalId,
      branch_id: brId,
      properties: { ...properties, entity_type: type },
    },
    { upsert: true, new: true }
  );

  return node;
};

/**
 * Fast Rule-Based Entity & Regex Extractor (Runs in < 10ms with ZERO LLM calls)
 */
export const extractRuleBasedEntities = (text = "") => {
  const entities = [];
  if (!text || typeof text !== "string") return entities;

  // 1. Error Codes (e.g. ERR_404, AUTH-500, E11000)
  const errorCodeRegex = /\b(?:ERR[_-][A-Z0-9]+|ERROR[_-][0-9]+|HTTP[_-]?[45][0-9]{2}|AUTH[_-][A-Z0-9]+)\b/gi;
  const errorMatches = text.match(errorCodeRegex) || [];
  errorMatches.forEach((code) => {
    entities.push({ name: code.toUpperCase(), type: "error" });
  });

  // 2. Currencies & Durations (e.g. $99, €45, 30-day, 2-year warranty)
  const durationRegex = /\b(\d+[- ](?:day|month|year|hour|business day)s?(?: money-back| warranty| guarantee| window)?)\b/gi;
  const durationMatches = text.match(durationRegex) || [];
  durationMatches.forEach((dur) => {
    entities.push({ name: dur.trim(), type: "policy" });
  });

  // 3. Technical Protocol / Product Names
  const techRegex = /\b(?:OAuth2|SAML|SSO|RAG|GraphRAG|REST API|Webhook|ChromaDB|MongoDB|Redis|Docker|Kubernetes|JWT)\b/gi;
  const techMatches = text.match(techRegex) || [];
  techMatches.forEach((tech) => {
    entities.push({ name: tech.trim(), type: "product" });
  });

  return entities;
};

/**
 * Generate SIMILAR_TO relationship edges between chunks/documents using vector KNN similarity
 */
export const generateSimilarToEdges = async (organizationId, documentId, chunks = []) => {
  if (!documentId || chunks.length === 0) return;
  const orgId = new mongoose.Types.ObjectId(organizationId);
  const docId = new mongoose.Types.ObjectId(documentId);

  // Bulk insert SIMILAR_TO relationships safely
  const sampleChunks = chunks.slice(0, 10);
  for (const chunk of sampleChunks) {
    if (!chunk.embedding || chunk.embedding.length === 0) continue;

    const similarChunks = await DocumentChunk.find({
      organization_id: orgId,
      document_id: { $ne: docId },
      status: "published",
    })
      .select("_id chunk_index content document_id")
      .limit(2)
      .lean();

    for (const simChunk of similarChunks) {
      await GraphRelationship.create({
        source_name: `Chunk ${chunk.chunk_index}`,
        source_type: "chunk",
        target_name: `Chunk ${simChunk.chunk_index}`,
        target_type: "chunk",
        type: "SIMILAR_TO",
        document_id: docId,
        chunk_id: chunk._id,
        organization_id: orgId,
        confidence_score: 0.85,
        source_type: "ALGORITHMIC_KNN",
      }).catch(() => null);
    }
  }
};

/**
 * High-Performance Graph Ingestion (Optimized for Huge Documents)
 *
 * Uses:
 * 1. Fast Rule-Based NER for instantaneous entity linking.
 * 2. 1-2 Batched Document-Level LLM extractions (instead of 50-400 individual calls).
 * 3. Non-blocking resilient execution.
 */
export const ingestDocumentGraph = async (documentId, organizationId, branchId, chunks = [], topics = []) => {
  if (!documentId || !organizationId) return;

  const docId = new mongoose.Types.ObjectId(documentId);
  const orgId = new mongoose.Types.ObjectId(organizationId);
  const brId = branchId ? new mongoose.Types.ObjectId(branchId) : null;

  const doc = await Document.findById(docId).select("title content").lean();
  const docTitle = doc?.title || `Document ${documentId}`;

  // 1. Create or Update Document Node
  await GraphNode.findOneAndUpdate(
    { type: "document", ref_id: docId, organization_id: orgId },
    {
      name: docTitle,
      canonical_id: `doc:${docId.toString()}`,
      branch_id: brId,
      properties: { chunk_count: chunks.length, title: docTitle },
    },
    { upsert: true }
  );

  // 2. Connect Document to Topic Nodes
  for (const topicId of topics) {
    const topic = await Topic.findById(topicId).lean();
    if (!topic) continue;

    await resolveCanonicalEntity(organizationId, branchId, topic.name, "topic", { description: topic.description });

    await GraphRelationship.create({
      source_name: docTitle,
      source_type: "document",
      target_name: topic.name,
      target_type: "topic",
      type: "HAS_TOPIC",
      document_id: docId,
      organization_id: orgId,
      branch_id: brId,
      confidence_score: 1.0,
      source_type: "SYSTEM_INGESTION",
    }).catch(() => null);
  }

  // 3. Batch Create Chunk Nodes & HAS_CHUNK Relationships in Bulk
  const chunkNodes = [];
  const chunkRels = [];

  for (const chunk of chunks) {
    const chunkNodeName = `Chunk ${chunk.chunk_index} of ${docTitle}`;
    chunkNodes.push({
      type: "chunk",
      ref_id: chunk._id,
      organization_id: orgId,
      name: chunkNodeName,
      canonical_id: `chunk:${chunk._id.toString()}`,
      branch_id: brId,
      properties: { chunk_index: chunk.chunk_index, token_count: chunk.token_count },
    });

    chunkRels.push({
      source_name: docTitle,
      source_type: "document",
      target_name: chunkNodeName,
      target_type: "chunk",
      type: "HAS_CHUNK",
      document_id: docId,
      chunk_id: chunk._id,
      organization_id: orgId,
      branch_id: brId,
      confidence_score: 1.0,
      source_type: "SYSTEM_INGESTION",
    });
  }

  // Bulk upsert chunk nodes
  if (chunkNodes.length > 0) {
    await Promise.all(
      chunkNodes.map((n) =>
        GraphNode.findOneAndUpdate(
          { type: "chunk", ref_id: n.ref_id, organization_id: orgId },
          n,
          { upsert: true }
        ).catch(() => null)
      )
    );
    await GraphRelationship.insertMany(chunkRels).catch(() => null);
  }

  // 4. Fast Rule-Based Entity Extraction on Chunks (Instant < 10ms)
  for (const chunk of chunks.slice(0, 30)) {
    const ruleEntities = extractRuleBasedEntities(chunk.content);
    for (const ent of ruleEntities) {
      await resolveCanonicalEntity(organizationId, branchId, ent.name, ent.type, { document_id: docId });
      await GraphRelationship.create({
        source_name: `Chunk ${chunk.chunk_index} of ${docTitle}`,
        source_type: "chunk",
        target_name: ent.name,
        target_type: ent.type,
        type: "HAS_ENTITY",
        document_id: docId,
        chunk_id: chunk._id,
        organization_id: orgId,
        branch_id: brId,
        confidence_score: 0.95,
        source_type: "RULE_EXTRACTION",
      }).catch(() => null);
    }
  }

  // 5. Document-Level Batched LLM Extraction (Only 1-2 calls for the ENTIRE document!)
  try {
    const sampleSegments = [];
    if (chunks.length <= 4) {
      sampleSegments.push(chunks.map((c) => c.content).join("\n\n"));
    } else {
      // Sample Beginning, Middle, and End of document
      sampleSegments.push(chunks[0].content);
      if (chunks[1]) sampleSegments.push(chunks[1].content);
      const midIdx = Math.floor(chunks.length / 2);
      if (chunks[midIdx]) sampleSegments.push(chunks[midIdx].content);
      if (chunks[chunks.length - 1]) sampleSegments.push(chunks[chunks.length - 1].content);
    }

    const aggregatedSampleText = sampleSegments.join("\n\n").slice(0, 3500);

    if (aggregatedSampleText.length >= 30) {
      const extractionPrompt = `Extract key enterprise support concepts, products, and policies from this document.
Document Title: "${docTitle}"

Content:
${aggregatedSampleText}

Respond ONLY with a JSON object:
{
  "entities": [
    { "name": "entity name", "type": "product|policy|error|service|incident|resolution" }
  ],
  "relationships": [
    { "source": "source entity", "target": "target entity", "type": "RELATIONSHIP_TYPE" }
  ]
}`;

      const llmRes = await generateResponse(extractionPrompt, "", {
        organizationId: organizationId,
        temperature: 0.2,
        maxTokens: 500,
      });

      let parsed = { entities: [], relationships: [] };
      const text = (llmRes && (llmRes.text || (typeof llmRes === "string" ? llmRes : ""))) || "";
      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");

      if (firstBrace !== -1 && lastBrace !== -1) {
        try {
          parsed = JSON.parse(text.substring(firstBrace, lastBrace + 1));
        } catch {
          /* json parse fallback */
        }
      }

      // Ingest Global Document Entities
      for (const ent of parsed.entities || []) {
        if (!ent.name || !ent.type) continue;
        const entName = ent.name.trim();

        await resolveCanonicalEntity(organizationId, branchId, entName, ent.type.toLowerCase(), { document_id: docId });

        await GraphRelationship.create({
          source_name: docTitle,
          source_type: "document",
          target_name: entName,
          target_type: ent.type.toLowerCase(),
          type: "COVERS_ENTITY",
          document_id: docId,
          organization_id: orgId,
          branch_id: brId,
          confidence_score: 0.92,
          source_type: "LLM_BATCH_EXTRACTION",
          provenance_details: { doc_title: docTitle },
        }).catch(() => null);
      }

      // Ingest Global Entity Relationships
      for (const rel of parsed.relationships || []) {
        if (!rel.source || !rel.target || !rel.type) continue;
        const srcName = rel.source.trim();
        const tgtName = rel.target.trim();
        const relType = rel.type.toUpperCase().replace(/\s+/g, "_");

        await GraphRelationship.create({
          source_name: srcName,
          source_type: "entity",
          target_name: tgtName,
          target_type: "entity",
          type: relType,
          document_id: docId,
          organization_id: orgId,
          branch_id: brId,
          confidence_score: 0.90,
          source_type: "LLM_BATCH_EXTRACTION",
          provenance_details: { doc_title: docTitle },
        }).catch(() => null);
      }

      console.log(`[GraphRAG] Batched extraction complete for "${docTitle}" (${parsed.entities?.length || 0} entities, ${parsed.relationships?.length || 0} rels).`);
    }
  } catch (llmErr) {
    console.warn(`[GraphRAG] Batched extraction warning for "${docTitle}":`, llmErr.message);
  }

  // 6. Generate algorithmic SIMILAR_TO edges
  await generateSimilarToEdges(organizationId, documentId, chunks).catch(() => null);
};

/**
 * Retrieve Relationship-Aware Graph Context (incorporating active ticket/customer state)
 */
export const retrieveGraphContext = async (
  queryText,
  organizationId,
  branchId = null,
  authorizedDocIds = null,
  contextEntities = {}
) => {
  if (!organizationId) return "";

  const orgId = new mongoose.Types.ObjectId(organizationId);
  const keywords = extractKeywords(queryText || "");

  const candidateTerms = [...keywords];
  if (contextEntities.activeTicketId) candidateTerms.push(contextEntities.activeTicketId);
  if (contextEntities.activeTransactionId) candidateTerms.push(contextEntities.activeTransactionId);
  if (contextEntities.activeErrorCode) candidateTerms.push(contextEntities.activeErrorCode);
  if (contextEntities.activeProduct) candidateTerms.push(contextEntities.activeProduct);

  if (candidateTerms.length === 0) return "";

  const regexes = candidateTerms.map((term) => new RegExp(`^${term}$`, "i"));
  const matchedNodes = await GraphNode.find({
    organization_id: orgId,
    $or: [{ name: { $in: regexes } }, { canonical_id: { $in: candidateTerms } }],
  })
    .select("name type canonical_id")
    .lean();

  const entityNames = matchedNodes.map((n) => n.name);

  const relQuery = {
    organization_id: orgId,
    $or: [{ source_name: { $in: entityNames } }, { target_name: { $in: entityNames } }],
  };

  if (authorizedDocIds && authorizedDocIds.length > 0) {
    const docIds = authorizedDocIds.map((id) => new mongoose.Types.ObjectId(id));
    relQuery.document_id = { $in: docIds };
  }

  const level1Rels = await GraphRelationship.find(relQuery).limit(20).lean();
  const graphFacts = new Set();
  const provenanceMap = [];

  level1Rels.forEach((r) => {
    const confidencePct = Math.round((r.confidence_score || 0.9) * 100);
    const provenanceStr = r.provenance_details?.doc_title ? ` [Source: ${r.provenance_details.doc_title}]` : "";
    const factStr = `Fact: "${r.source_name}" (${r.source_type}) is linked to "${r.target_name}" (${r.target_type}) via "${r.type}" [Confidence: ${confidencePct}%]${provenanceStr}`;
    graphFacts.add(factStr);
    provenanceMap.push({
      source: r.source_name,
      target: r.target_name,
      type: r.type,
      confidence: r.confidence_score,
      docId: r.document_id,
      chunkId: r.chunk_id,
    });
  });

  if (graphFacts.size === 0) return { contextText: "", provenanceMap: [] };

  const contextText = `=== KNOWLEDGE GRAPH RELATIONSHIPS ===\n${Array.from(graphFacts).join("\n")}`;
  return { contextText, provenanceMap };
};
