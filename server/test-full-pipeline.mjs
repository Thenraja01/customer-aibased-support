import mongoose from "mongoose";
import env from "./config/env.js";
import { verifyAccess, searchWithScope, extractKeywords } from "./modules/rag/rag.service.js";
import { computeConfidence, determineResponseMode } from "./modules/chat/confidence.service.js";
import Document from "./modules/document/document.schema.js";
import Organization from "./modules/organization/organization.schema.js";
import { chromaService } from "./config/chroma.js";

const STOP_WORDS = new Set(["the", "a", "an", "is", "are", "was", "were", "in", "on", "at", "to", "for", "of", "and", "or", "but", "i", "my", "me", "we", "you", "he", "she", "it", "they", "do", "does", "did", "have", "has", "had", "am", "be", "been", "being", "this", "that", "these", "those", "with", "from", "by", "as", "so", "no", "not", "if", "can", "what", "how", "when", "where", "why", "please", "thank", "thanks"]);
const tokenize = (text) => text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));

const REFERENTIAL_WORDS = new Set(["it", "that", "this", "those", "these", "they", "them", "its", "my", "our", "your", "their", "the", "so", "then", "what about", "how about", "and", "also"]);
const isFollowUpQuery = (query) => {
  const lower = query.toLowerCase().trim();
  if (!lower) return false;
  const contentTokens = tokenize(lower);
  if (contentTokens.length <= 1) return true;
  if (/\b(my|your|our|their|its)\b/.test(lower)) return true;
  return /^(it|that|this|these|those|they|them|so|then|what about|how about|and|also)\b/.test(lower);
};

const COMMON_SPELLING = { recieve: "receive", seperate: "separate", occurence: "occurrence", adress: "address", billingg: "billing", passowrd: "password", logn: "long", accout: "account", deposite: "deposit", withrdaw: "withdraw", transation: "transaction", cancle: "cancel", refrend: "refund", shiping: "shipping", ordre: "order", delivary: "delivery", purchse: "purchase", featre: "feature", technicall: "technical" };
const SYNONYM_MAP = { refund: ["return", "money back", "reimbursement", "credit"], shipping: ["delivery", "track", "where is my order", "package"], password: ["login", "signin", "sign in", "access"], cancel: ["termination", "stop subscription", "discontinue"], bill: ["invoice", "payment", "charge", "subscription cost"], account: ["profile", "login", "signin", "credentials"], bug: ["error", "issue", "problem", "not working", "broken"], feature: ["capability", "function", "tool", "product"] };

const correctSpelling = (query) => { let c = query; for (const [m, co] of Object.entries(COMMON_SPELLING)) c = c.replace(new RegExp(`\\b${m}\\b`, "gi"), co); return c; };
const expandSynonyms = (query) => { const lower = query.toLowerCase(); const expansions = []; for (const [kw, syns] of Object.entries(SYNONYM_MAP)) if (lower.includes(kw)) for (const s of syns) if (!lower.includes(s)) expansions.push(s); return expansions; };

const rewriteQuery = async (query, conversationContext = "") => {
  if (!query || typeof query !== "string" || query.trim().length === 0) return query;
  let rewritten = query.trim();
  const corrected = correctSpelling(rewritten);
  if (corrected !== rewritten) rewritten = corrected;
  const tokens = tokenize(rewritten);
  const expansions = expandSynonyms(rewritten);
  if (expansions.length > 0) rewritten = `${rewritten} ${expansions.join(" ")}`;
  if (conversationContext && isFollowUpQuery(rewritten)) {
    const contextSentences = conversationContext.split("\n").filter((s) => s.trim().length > 5).slice(-3);
    const recentTokens = tokenize(contextSentences.join(" "));
    const uniqueContext = recentTokens.filter((t) => !tokens.includes(t) && t.length > 3);
    if (uniqueContext.length > 0 && uniqueContext.length <= 5) rewritten = `${rewritten} (context: ${uniqueContext.join(", ")})`;
  }
  return rewritten;
};

const buildConversationContext = (recentMessages) => {
  if (!recentMessages || recentMessages.length === 0) return "";
  const MAX_CONV_CHARS = 3000;
  let result = "";
  for (const m of recentMessages) {
    const line = `${m.is_ai ? "Assistant" : "User"}: ${m.content}`;
    if ((result + "\n" + line).length > MAX_CONV_CHARS) break;
    result += (result ? "\n" : "") + line;
  }
  return result;
};

const formatRAGContext = (documentResults, docTitles) => {
  if (!documentResults || documentResults.length === 0) return null;
  const MIN_RAG_SCORE = 0.35;
  const sorted = [...documentResults].sort((a, b) => b.score - a.score);
  const bestScore = sorted[0].score;
  const minScore = bestScore * 0.6;
  const effectiveMin = Math.max(MIN_RAG_SCORE, minScore);
  let relevant = sorted.filter((r) => r.score >= effectiveMin).slice(0, 5);
  if (relevant.length === 0) relevant = sorted.slice(0, 1);
  return relevant.map((r) => { const docId = r.document_id?.toString(); const title = docTitles[docId] || "Untitled"; return `[Source: ${title}] ${r.content}`; }).join("\n\n");
};

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  try {
    await chromaService.init();
  } catch (err) {
    console.log("Chroma DB init failed/skipped:", err.message);
  }

  const orgId = "6a76dc1ac5cf8ff9f45ee94f";
  console.log(`Using Org ID: ${orgId}`);
  
  const recentMessages = [
    { is_ai: false, content: "What are your shipment times?" },
    { is_ai: true, content: "Frequently Asked Questions (FAQ)\n1. What are your shipment times?" },
  ];
  
  const convCtx = buildConversationContext(recentMessages);
  console.log("=== Conversation Context ===");
  console.log(convCtx);
  console.log();
  
  const userMessage = "What are your shipment times?";
  const rewritten = await rewriteQuery(userMessage, convCtx);
  console.log("=== Rewritten Query ===");
  console.log(rewritten);
  console.log();
  
  const access = await verifyAccess(orgId, "customer", "customer");
  console.log("=== Verify Access (customer) ===");
  console.log(JSON.stringify(access, null, 2));
  console.log();

  if (!access.authorized || !access.accessScope) {
    console.log("Access blocked: Skipping search");
    await mongoose.disconnect();
    return;
  }

  try {
    const res = await searchWithScope(rewritten, orgId, access.accessScope, 5, null, null);
    console.log("=== Search Results ===");
    console.log("total chunks:", res.document_results.length);
    for (const r of res.document_results.slice(0, 5)) {
      console.log(`  score=${r.score.toFixed(4)} chunk=${r.chunk_index} doc=${r.document_id} content=${String(r.content).slice(0,60)}`);
    }
    console.log();
    
    const faqs = [];
    const confidenceResult = computeConfidence(res, faqs, userMessage);
    console.log("=== Confidence ===");
    console.log(JSON.stringify(confidenceResult, null, 2));
    console.log();
    
    const orgSettings = {};
    const responseMode = determineResponseMode(confidenceResult, orgSettings);
    console.log("=== Response Mode ===");
    console.log(JSON.stringify(responseMode, null, 2));
    console.log();
    
    const docIds = new Set();
    res.document_results.forEach(r => { if (r.document_id) docIds.add(r.document_id.toString()); });
    const docTitles = {};
    if (docIds.size > 0) {
      const docs = await Document.find({ _id: { $in: [...docIds] } }).select("_id title").lean();
      docs.forEach(d => { docTitles[d._id.toString()] = d.title; });
    }
    const ragCtx = formatRAGContext(res.document_results, docTitles);
    console.log("=== RAG Context (sent to LLM) ===");
    console.log(ragCtx || "(empty)");
    console.log();
  } catch (err) {
    console.log("Search execution error (Chroma is likely offline):", err.message);
  }
  
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });