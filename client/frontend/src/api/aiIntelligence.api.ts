import AxiosInstance from "./axiosInstance";

export const AIIntelligenceAPI = {
  getHealthDiagnostics: () => AxiosInstance.get("/agent/health-diagnostics"),
  explainRouting: (payload: { prompt: string; role?: string; slaMaxMs?: number; preferredProvider?: string }) =>
    AxiosInstance.post("/agent/explain-routing", payload),
  detectKnowledgeConflicts: () => AxiosInstance.get("/agent/knowledge-conflicts"),
  evaluateConfidence: (payload: { query: string; threshold?: number }) =>
    AxiosInstance.post("/agent/evaluate-confidence", payload),
  runWhatIfSimulation: (payload: { scenario: string; targetProvider?: string; trafficMultiplier?: number }) =>
    AxiosInstance.post("/agent/simulate-whatif", payload),
};
