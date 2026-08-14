import GraphNode from "../modules/graph/graphNode.schema.js";
import GraphRelationship from "../modules/graph/graphRelationship.schema.js";
import Topic from "../modules/topic/topic.schema.js";
import Document from "../modules/document/document.schema.js";
import DocumentChunk from "../modules/document/documentChunk.schema.js";
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
 * Build graph nodes and relationships from text chunks and detected topics
 */
export const ingestDocumentGraph = async (documentId, organizationId, branchId, chunks, topics = []) => {
  const docId = new mongoose.Types.ObjectId(documentId);
  const orgId = new mongoose.Types.ObjectId(organizationId);
  const brId = branchId ? new mongoose.Types.ObjectId(branchId) : null;

  const docRecord = await Document.findById(docId).select("title").lean();
  const docTitle = docRecord?.title || `Document ${documentId}`;

  // 1. Create Document Node
  const docNode = await GraphNode.findOneAndUpdate(
    { type: "document", ref_id: docId, organization_id: orgId },
    {
      name: docTitle,
      branch_id: brId,
    },
    { upsert: true, new: true }
  );

  // 2. Connect Document to Topic Nodes
  for (const topicId of topics) {
    const topic = await Topic.findById(topicId).lean();
    if (!topic) continue;

    // Ensure Topic Node exists
    await GraphNode.findOneAndUpdate(
      { type: "topic", ref_id: topic._id, organization_id: orgId },
      {
        name: topic.name,
        branch_id: brId,
        properties: { description: topic.description },
      },
      { upsert: true }
    );

    // Create relation Document -> HAS_TOPIC -> Topic
    await GraphRelationship.create({
      source_name: docTitle,
      source_type: "document",
      target_name: topic.name,
      target_type: "topic",
      type: "HAS_TOPIC",
      document_id: docId,
      organization_id: orgId,
      branch_id: brId,
    });
  }

  // 3. Process Chunk Nodes, Extract Entities & Relationships
  for (const chunk of chunks) {
    const chunkNodeName = `Chunk ${chunk.chunk_index} of ${docTitle}`;
    
    // Create Chunk Node
    await GraphNode.findOneAndUpdate(
      { type: "chunk", ref_id: chunk._id, organization_id: orgId },
      {
        name: chunkNodeName,
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
      organization_id: orgId,
      branch_id: brId,
    });

    // Chunk -> HAS_TOPIC -> Topic
    for (const topicId of topics) {
      const topic = await Topic.findById(topicId).lean();
      if (topic) {
        await GraphRelationship.create({
          source_name: chunkNodeName,
          source_type: "chunk",
          target_name: topic.name,
          target_type: "topic",
          type: "HAS_TOPIC",
          document_id: docId,
          organization_id: orgId,
          branch_id: brId,
        });
      }
    }

    // Call LLM to extract Entities & Relationships from this Chunk
    try {
      const extractionPrompt = `You are an information extraction system. Read the text segment and extract key entities (nouns, policies, regulations, limits, systems) and their direct relationships.

Text segment:
"${chunk.content}"

Respond ONLY with a JSON object matching this structure. Do not output markdown, backticks, or explanations.
{
  "entities": [
    { "name": "entity name", "type": "type of entity" }
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

      // Add Entities to GraphNode
      for (const ent of parsed.entities || []) {
        if (!ent.name || !ent.type) continue;
        const entName = ent.name.trim();

        // MERGE Entity Node
        await GraphNode.findOneAndUpdate(
          { type: "entity", name: { $regex: new RegExp(`^${entName}$`, "i") }, organization_id: orgId },
          {
            name: entName,
            branch_id: brId,
            properties: { entity_type: ent.type },
          },
          { upsert: true }
        );

        // Chunk -> HAS_ENTITY -> Entity
        await GraphRelationship.create({
          source_name: chunkNodeName,
          source_type: "chunk",
          target_name: entName,
          target_type: "entity",
          type: "HAS_ENTITY",
          document_id: docId,
          organization_id: orgId,
          branch_id: brId,
        });
      }

      // Add Relationships between Entities
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
        });
      }
    } catch (error) {
      console.error("[GraphExtraction] Error during LLM extraction for chunk:", error.message);
    }
  }
};

/**
 * GraphRAG - Search the graph and compile a contextual text description of connections
 */
export const retrieveGraphContext = async (queryText, organizationId, branchId = null, authorizedDocIds = null) => {
  if (!queryText || !organizationId) return "";

  const orgId = new mongoose.Types.ObjectId(organizationId);
  const brId = branchId ? new mongoose.Types.ObjectId(branchId) : null;

  // 1. Extract keywords from query
  const keywords = extractKeywords(queryText);
  if (keywords.length === 0) return "";

  // 2. Find entity nodes that match keywords (case-insensitive regex)
  const regexes = keywords.map(kw => new RegExp(`^${kw}$`, "i"));
  const matchedNodes = await GraphNode.find({
    organization_id: orgId,
    type: "entity",
    name: { $in: regexes }
  }).select("name").lean();

  const entityNames = matchedNodes.map(node => node.name);
  if (entityNames.length === 0) return "";

  // 3. Traversal Level 1: Find direct relationships
  const relQuery = {
    organization_id: orgId,
    $or: [
      { source_name: { $in: entityNames } },
      { target_name: { $in: entityNames } }
    ]
  };

  // Enforce document level scope if authorizedDocIds are provided
  if (authorizedDocIds && authorizedDocIds.length > 0) {
    const docIds = authorizedDocIds.map(id => new mongoose.Types.ObjectId(id));
    relQuery.document_id = { $in: docIds };
  }

  const level1Rels = await GraphRelationship.find(relQuery).lean();
  const graphFacts = new Set();
  const level1Entities = new Set(entityNames);

  level1Rels.forEach(r => {
    level1Entities.add(r.source_name);
    level1Entities.add(r.target_name);
    if (r.source_type === "entity" && r.target_type === "entity") {
      graphFacts.add(`Entity "${r.source_name}" is connected to "${r.target_name}" via relationship "${r.type}".`);
    } else {
      graphFacts.add(`"${r.source_name}" (${r.source_type}) links to "${r.target_name}" (${r.target_type}) via "${r.type}".`);
    }
  });

  // 4. Traversal Level 2: Expand to find secondary relationships
  const secondaryEntities = Array.from(level1Entities).filter(name => !entityNames.includes(name));
  if (secondaryEntities.length > 0) {
    const level2Query = {
      organization_id: orgId,
      $or: [
        { source_name: { $in: secondaryEntities } },
        { target_name: { $in: secondaryEntities } }
      ]
    };
    if (authorizedDocIds && authorizedDocIds.length > 0) {
      const docIds = authorizedDocIds.map(id => new mongoose.Types.ObjectId(id));
      level2Query.document_id = { $in: docIds };
    }
    const level2Rels = await GraphRelationship.find(level2Query).limit(30).lean();
    level2Rels.forEach(r => {
      if (r.source_type === "entity" && r.target_type === "entity") {
        graphFacts.add(`Related Concept: Entity "${r.source_name}" relates to "${r.target_name}" via "${r.type}".`);
      }
    });
  }

  if (graphFacts.size === 0) return "";

  return `=== KNOWLEDGE GRAPH RELATIONSHIPS ===\n${Array.from(graphFacts).join("\n")}`;
};
