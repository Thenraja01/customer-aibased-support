export const DEFAULT_RAG_CONFIG = {
  chunk_size: 500,
  chunk_overlap: 100,
  top_k: 5,
  min_score: 0.35,
  bfs_max_depth: 2,
};

export const DEFAULT_SMTP_CONFIG = {
  host: "",
  port: 587,
  secure: false,
  user: "",
  pass: "",
  from: "",
  enabled: false,
};

export const DEFAULT_AI_SETTINGS = {
  temperature: 0.7,
  top_k: 40,
  similarity_threshold: 0.75,
  max_tokens: 2048,
  response_style: "balanced",
};

export const DEFAULT_GUARDRAILS = [
  { rule: "Answer only from approved documents", enabled: true },
  { rule: "Don't answer unrelated questions", enabled: true },
  { rule: "Always cite document sources", enabled: true },
  { rule: "Escalate to a ticket if confidence is low", enabled: true },
];

export const DEFAULT_WORKING_HOURS = {
  timezone: "UTC",
  monday: { open: "09:00", close: "17:00", enabled: true },
  tuesday: { open: "09:00", close: "17:00", enabled: true },
  wednesday: { open: "09:00", close: "17:00", enabled: true },
  thursday: { open: "09:00", close: "17:00", enabled: true },
  friday: { open: "09:00", close: "17:00", enabled: true },
  saturday: { open: "09:00", close: "17:00", enabled: false },
  sunday: { open: "09:00", close: "17:00", enabled: false },
};
