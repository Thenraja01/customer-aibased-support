/**
 * In-memory HashMap indexes used by memory.service.js
 * - chunkHashMap: maps document chunks for deduplication
 * - keywordIndexMap: maps keywords to memory IDs for fast lookup
 */

export const chunkHashMap = new Map();
export const keywordIndexMap = new Map();
