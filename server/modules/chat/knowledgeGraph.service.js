import GraphEntity from "./graphEntity.schema.js";

/**
 * Search nodes inside the Knowledge Graph topology
 */
export const searchGraph = async (queryText) => {
  if (!queryText) return [];
  try {
    return await GraphEntity.find({
      entity_name: { $regex: new RegExp(queryText, "i") },
    }).lean();
  } catch (err) {
    console.error("[KnowledgeGraphService] searchGraph failed:", err.message);
    return [];
  }
};

/**
 * Get stats from the Knowledge Graph
 */
export const getGraphStats = async () => {
  try {
    const distinctEntities = await GraphEntity.distinct("entity_name");
    const edgeCount = await GraphEntity.countDocuments();
    return {
      nodeCount: distinctEntities.length,
      edgeCount: edgeCount,
    };
  } catch (err) {
    console.error("[KnowledgeGraphService] getGraphStats failed:", err.message);
    return { nodeCount: 0, edgeCount: 0 };
  }
};
