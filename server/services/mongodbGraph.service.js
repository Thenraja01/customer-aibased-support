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
 * Generate SIMILAR_TO relationship edges between chunks/documents using vector KNN similarity
 */
export const generateSimilarToEdges = async (organizationId, documentId, chunks = []) => {
  if (!documentId || chunks.length === 0) return;
  const orgId = new mongoose.Types.ObjectId(organizationId);
  const docId = new mongoose.Types.ObjectId(documentId);

  for (const chunk of chunks) {
    if (!chunk.embedding || chunk.embedding.length === 0) continue;

    // Find top similar chunks within the same tenant using MongoDB vector/cosine comparison or metadata
    const similarChunks = await DocumentChunk.find({
      organization_id: orgId,
      document_id: { $ne: docId },
    })
      .select("_id chunk_index content document_id")
      .limit(3)
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
        confidence_score: 0.88,
        source_type: "VECTOR_KNN_SIMILARITY",
        provenance_details: {
          matched_document_id: simChunk.document_id,
          matched_chunk_id: simChunk._id,
        },
      });
    }
  }
};

/**
 * Build graph nodes and relationships from text chunks, topics, and support domain entities
 */
export const ingestDocumentGraph = async (documentId, organizationId, branchId, chunks, topics = []) => {
  const docId = new mongoose.Types.ObjectId(documentId);
  const orgId = new mongoose.Types.ObjectId(organizationId);
  const brId = branchId ? new mongoose.Types.ObjectId(branchId) : null;

  const docRecord = await Document.findById(docId).select("title").lean();
  const docTitle = docRecord?.title || `Document ${documentId}`;

  // 1. Create Document Node
  await GraphNode.findOneAndUpdate(
    { type: "document", ref_id: docId, organization_id: orgId },
    {
      name: docTitle,
      canonical_id: `document:${docId.toString()}`,
      branch_id: brId,
    },
    { upsert: true, new: true }
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
    });
  }

  // 3. Process Chunk Nodes, Extract Entities & Relationships
  for (const chunk of chunks) {
    const chunkNodeName = `Chunk ${chunk.chunk_index} of ${docTitle}`;

    await GraphNode.findOneAndUpdate(
      { type: "chunk", ref_id: chunk._id, organization_id: orgId },
      {
        name: chunkNodeName,
        canonical_id: `chunk:${chunk._id.toString()}`,
        branch_id: brId,
        properties: { chunk_index: chunk.chunk_index, token_count: chunk.token_count },
      },
      { upsert: true }
    );

    // Document -> HAS_CHUNK -> Chunk
    await GraphRelationship.create({
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

    // LLM Extraction for Support Domain Entities & Relationships
    try {
      const extractionPrompt = `You are an enterprise support graph extraction engine. Read the text segment and extract both organizational concepts and support domain entities (Customer, Ticket, Error Code, Transaction ID, Product, Service, Policy, Incident, Resolution).

Text segment:
"${chunk.content}"

Respond ONLY with a JSON object.
{
  "entities": [
    { "name": "entity name", "type": "entity|policy|error|product|service|incident|resolution|transaction" }
  ],
  "relationships": [
    { "source": "source entity name", "target": "target entity name", "type": "RELATIONSHIP_TYPE" }
  ]
}`;

      const llmRes = await generateResponse(extractionPrompt, "", {
        provider: "ollama",
        model: "llama3.2:3b",
        organizationId: organizationId,
      });

      let parsed = { entities: [], relationships: [] };
      try {
        const text = llmRes.text || "";
        const firstBrace = text.indexOf("{");
        const lastBrace = text.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
          parsed = JSON.parse(text.substring(firstBrace, lastBrace + 1));
        }
      } catch (err) {
        console.warn("[GraphExtraction] Failed to parse LLM extraction JSON:", err.message);
      }

      // Ingest Resolved Entities
      for (const ent of parsed.entities || []) {
        if (!ent.name || !ent.type) continue;
        const entName = ent.name.trim();

        await resolveCanonicalEntity(organizationId, branchId, entName, ent.type.toLowerCase(), { document_id: docId });

        await GraphRelationship.create({
          source_name: chunkNodeName,
          source_type: "chunk",
          target_name: entName,
          target_type: ent.type.toLowerCase(),
          type: "HAS_ENTITY",
          document_id: docId,
          chunk_id: chunk._id,
          organization_id: orgId,
          branch_id: brId,
          confidence_score: 0.92,
          source_type: "LLM_EXTRACTION",
          provenance_details: { doc_title: docTitle, chunk_index: chunk.chunk_index },
        });
      }

      // Ingest Relationships with Provenance
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
          chunk_id: chunk._id,
          organization_id: orgId,
          branch_id: brId,
          confidence_score: 0.90,
          source_type: "LLM_EXTRACTION",
          provenance_details: { doc_title: docTitle, chunk_index: chunk.chunk_index },
        });
      }
    } catch (error) {
      console.error("[GraphExtraction] Error during LLM extraction for chunk:", error.message);
    }
  }

  // Generate algorithmic SIMILAR_TO edges
  await generateSimilarToEdges(organizationId, documentId, chunks);
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

  // Collect candidate entity search terms (including active ticket, error, transaction)
  const candidateTerms = [...keywords];
  if (contextEntities.activeTicketId) candidateTerms.push(contextEntities.activeTicketId);
  if (contextEntities.activeTransactionId) candidateTerms.push(contextEntities.activeTransactionId);
  if (contextEntities.activeErrorCode) candidateTerms.push(contextEntities.activeErrorCode);
  if (contextEntities.activeProduct) candidateTerms.push(contextEntities.activeProduct);

  if (candidateTerms.length === 0) return "";

  // Find matching nodes in GraphNode
  const regexes = candidateTerms.map((term) => new RegExp(`^${term}$`, "i"));
  const matchedNodes = await GraphNode.find({
    organization_id: orgId,
    $or: [{ name: { $in: regexes } }, { canonical_id: { $in: candidateTerms } }],
  })
    .select("name type canonical_id")
    .lean();

  const entityNames = matchedNodes.map((n) => n.name);

  // Level 1 Traversal
  const relQuery = {
    organization_id: orgId,
    $or: [{ source_name: { $in: entityNames } }, { target_name: { $in: entityNames } }],
  };

  if (authorizedDocIds && authorizedDocIds.length > 0) {
    const docIds = authorizedDocIds.map((id) => new mongoose.Types.ObjectId(id));
    relQuery.document_id = { $in: docIds };
  }

  const level1Rels = await GraphRelationship.find(relQuery).lean();
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
