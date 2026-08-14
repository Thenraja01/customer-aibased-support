import { extractKeywords } from "../rag/rag.service.js";

const DEFAULT_THRESHOLDS = {
  high: 0.9,
  medium: 0.6,
  low: 0.3,
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

  const confidence = Math.min(
    bestRagScore * 0.5 +
      faqScore * 0.3 +
      Math.min(coverageRatio, 1) * 0.2,
    1.0
  );

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
    high: orgSettings?.confidence_threshold?.high ?? DEFAULT_THRESHOLDS.high,
    medium: orgSettings?.confidence_threshold?.medium ?? DEFAULT_THRESHOLDS.medium,
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

export const rerankResults = (vectorResults, keywordResults, graphResults = [], limit = 5) => {
  const scoreMap = new Map();

  vectorResults.forEach((r) => {
    scoreMap.set(r._id.toString(), {
      ...r,
      vectorScore: r.score || 0,
      keywordScore: 0,
      graphScore: 0,
      score: (r.score || 0) * 0.5,
    });
  });

  keywordResults.forEach((r) => {
    const id = r._id.toString();
    const existing = scoreMap.get(id);
    if (existing) {
      existing.keywordScore = r.score || 0;
      existing.score = existing.score + (r.score || 0) * 0.3;
    } else {
      scoreMap.set(id, {
        ...r,
        vectorScore: 0,
        keywordScore: r.score || 0,
        graphScore: 0,
        score: (r.score || 0) * 0.3,
      });
    }
  });

  if (Array.isArray(graphResults)) {
    graphResults.forEach((r) => {
      const id = r._id.toString();
      const existing = scoreMap.get(id);
      if (existing) {
        existing.graphScore = r.score || 0;
        existing.score = existing.score + (r.score || 0) * 0.2;
      } else {
        scoreMap.set(id, {
          ...r,
          vectorScore: 0,
          keywordScore: 0,
          graphScore: r.score || 0,
          score: (r.score || 0) * 0.2,
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
