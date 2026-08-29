import { extractKeywords } from "../rag/rag.service.js";

const DEFAULT_THRESHOLDS = {
  high: 0.7,
  medium: 0.3,
  low: 0.15,
};

export const computeConfidence = (ragResults, faqs, query) => {
  let bestRagScore = 0;
  let avgRagScore = 0;
  let matchCount = 0;

  if (ragResults?.document_results && ragResults.document_results.length > 0) {
    const scores = ragResults.document_results.map((r) => r.score || 0);
    bestRagScore = Math.max(...scores);
    avgRagScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    matchCount = ragResults.document_results.length;
  }

  let faqScore = 0;
  if (faqs && faqs.length > 0) {
    faqScore = Math.max(...faqs.map((f) => f.score || 0));
  }

  const hasMatches = matchCount > 0;
  const queryKeywords = extractKeywords(query || "");
  const coverageRatio = queryKeywords.length > 0 ? matchCount / queryKeywords.length : 0;

  let confidence = 0;
  if (hasMatches) {
    confidence = Math.max(bestRagScore, faqScore, bestRagScore * 0.7 + Math.min(coverageRatio, 1) * 0.3);
  } else if (faqScore > 0) {
    confidence = faqScore;
  }
  confidence = Math.min(confidence, 1.0);

  return {
    confidence,
    bestRagScore,
    avgRagScore,
    faqScore,
    matchCount,
    hasMatches,
    level: confidence >= 0.7 ? "high" : confidence >= 0.4 ? "medium" : "low",
  };
};

export const determineResponseMode = (confidenceResult, orgSettings = {}) => {
  const thresholds = {
    high: Math.min(orgSettings?.confidence_threshold?.high ?? DEFAULT_THRESHOLDS.high, DEFAULT_THRESHOLDS.high),
    medium: Math.min(orgSettings?.confidence_threshold?.medium ?? DEFAULT_THRESHOLDS.medium, DEFAULT_THRESHOLDS.medium),
  };

  const { confidence } = confidenceResult;

  if (confidence >= thresholds.high) {
    return { mode: "auto_respond", label: "High confidence — auto respond" };
  }

  if (confidence >= thresholds.medium) {
    return {
      mode: "suggest_and_offer_human",
      label: "Medium confidence — respond with disclaimer and offer human agent",
    };
  }

  return {
    mode: "no_confidence",
    label: "Low confidence — state uncertainty and ask for clarification",
  };
};

export const rerankResults = (
  vectorResults,
  keywordResults,
  graphResults = [],
  limit = 5,
  weights = { vector: 0.45, bm25: 0.35, graph: 0.20 }
) => {
  const scoreMap = new Map();

  vectorResults.forEach((r) => {
    const vScore = r.score || 0;
    scoreMap.set(r._id.toString(), {
      ...r,
      vectorScore: vScore,
      keywordScore: 0,
      graphScore: 0,
      score: vScore * weights.vector,
    });
  });

  keywordResults.forEach((r) => {
    const id = r._id.toString();
    const kScore = r.score || 0;
    const existing = scoreMap.get(id);
    if (existing) {
      existing.keywordScore = kScore;
      existing.score += kScore * weights.bm25;
    } else {
      scoreMap.set(id, {
        ...r,
        vectorScore: 0,
        keywordScore: kScore,
        graphScore: 0,
        score: kScore * weights.bm25,
      });
    }
  });

  if (Array.isArray(graphResults)) {
    graphResults.forEach((r) => {
      const id = r._id.toString();
      const gScore = r.score || 0;
      const existing = scoreMap.get(id);
      if (existing) {
        existing.graphScore = gScore;
        existing.score += gScore * weights.graph;
      } else {
        scoreMap.set(id, {
          ...r,
          vectorScore: 0,
          keywordScore: 0,
          graphScore: gScore,
          score: gScore * weights.graph,
        });
      }
    });
  }

  let reranked = Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const maxScore = reranked.length > 0 ? Math.max(...reranked.map((r) => r.score)) : 0;
  const minScore = reranked.length > 0 ? Math.min(...reranked.map((r) => r.score)) : 0;
  const scoreRange = maxScore - minScore;

  if (scoreRange > 0) {
    reranked = reranked.map((r) => ({
      ...r,
      normalizedScore: (r.score - minScore) / scoreRange,
    }));
  } else {
    reranked = reranked.map((r) => ({ ...r, normalizedScore: 0.5 }));
  }

  return reranked;
};

export default {
  computeConfidence,
  determineResponseMode,
  rerankResults,
};
