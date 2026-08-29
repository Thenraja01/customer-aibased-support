// AI module — central aggregator for all AI-related schemas.
//
// Originally these collections were scattered across `document`,
// `ai-session`, `knowledge-gap`, `memory`, and `prompt-version` modules.
// This index re-exports them under one roof and adds new ones:
//
//   AISession           ← existing (token/model stats per chat)
//   DocumentChunk       ← existing (vector index / embeddings)
//   KnowledgeGap        ← existing (questions with low retrieval scores)
//   ChatMemory          ← existing (user fact / preference memory)
//   PromptVersion       ← existing (prompt template versioning)
//   ConversationSummary ← NEW (auto TL;DR + sentiment)
//   AIFeedback          ← NEW (explicit thumbs-up/down on AI responses)
//   AIUsage             ← NEW (per-org / per-model cost & latency analytics)
//   BackgroundJob       ← NEW (async job queue for AI ingestion)
//   softDeletePlugin    ← NEW (reusable soft-delete plugin)

export { default as AISession } from "../ai-session/aiSession.schema.js";
export { default as DocumentChunk } from "../document/documentChunk.schema.js";
export { default as KnowledgeGap } from "../knowledge-gap/knowledgeGap.schema.js";
export { default as ChatMemory } from "../memory/memory.schema.js";
export { default as PromptVersion } from "../prompt-version/promptVersion.schema.js";

export { default as ConversationSummary } from "./schemas/conversationSummary.schema.js";
export { default as AIFeedback } from "./schemas/aiFeedback.schema.js";
export { default as AIUsage } from "./schemas/aiUsage.schema.js";
export { default as BackgroundJob } from "./schemas/backgroundJob.schema.js";
export { default as softDeletePlugin } from "./schemas/softDelete.plugin.js";
export { default as AIConfig } from "./schemas/aiConfig.schema.js";

export { aiRouter } from "./ai.route.js";
