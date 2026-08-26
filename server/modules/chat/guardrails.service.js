import Organization from "../organization/organization.schema.js";

const DEFAULT_BLOCKED_PATTERNS = [
  /\b(fuck|shit|damn|bitch|asshole|bastard|crap)\b/gi,
  /\b(kill yourself|suicide|blow up|nuclear weapon|terrorist attack)\b/gi,
];

const PROMPT_INJECTION_PATTERNS = [
  {
    name: "system_override",
    pattern: /system prompt|system instruction|override your (instructions|settings|rules)|ignore previous instructions|disregard all previous commands/i,
    description: "Attempt to override system-level instructions",
  },
  {
    name: "dan_jailbreak",
    pattern: /DAN|jailbreak|act as if you don't have any restrictions|pretend you are an AI without any rules/i,
    description: "Known jailbreak pattern (DAN-style)",
  },
  {
    name: "role_injection",
    pattern: /you are now (a |an )?(evil|unrestricted|malicious|dangerous|hacked)/i,
    description: "Attempt to inject a conflicting role",
  },
  {
    name: "prompt_leak",
    pattern: /show me your system prompt|reveal your instructions|what are your rules|tell me your prompt/i,
    description: "Attempt to extract internal prompt/config",
  },
  {
    name: "delimiter_injection",
    pattern: /<system>|<\/system>|<prompt>|<\/prompt>|<<<|>>><>>/i,
    description: "Delimiter-based injection attempt",
  },
  {
    name: "base64_encoded_prompt",
    pattern: /[A-Za-z0-9+/]{100,}={0,2}$/,
    description: "Possible base64-encoded hidden instructions",
  },
];

const PII_PATTERNS = [
  { name: "ssn", pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
  { name: "credit_card", pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\b/g },
  // BUG FIX: More precise phone pattern — requires separators or strict 10-digit with leading space/start-of-string
  // Prevents matching inside longer numeric strings (order IDs, card numbers)
  { name: "phone", pattern: /(?<![\d])(?:\+?1[-. ]?)?\(?([2-9][0-9]{2})\)?[-. ]([2-9][0-9]{2})[-. ]([0-9]{4})(?![\d])/g },
  { name: "email", pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
];

const BLOCKED_SENSITIVE_TOPICS = [
  "suicide", "self harm", "kill myself",
  "bomb", "explosive", "terrorist",
  "how to make a weapon", "how to hack",
  "generate fake id", "forge document",
];

const MAX_MESSAGE_LENGTH = 4000;
const MAX_OUTPUT_LENGTH = 8000;

export const checkInputGuardrails = async (message, organizationId) => {
  const violations = [];
  const orgGuardrails = [];

  if (organizationId) {
    try {
      const org = await Organization.findById(organizationId)
        .select("guardrails")
        .lean();
      if (org?.guardrails && Array.isArray(org.guardrails)) {
        orgGuardrails.push(...org.guardrails.filter((g) => g.enabled !== false).map((g) => g.rule));
      }
    } catch {
      // Continue with defaults
    }
  }

  if (!message || typeof message !== "string") {
    return {
      passed: false,
      violations: [{ rule: "empty_message", message: "Message is empty or invalid." }],
      sanitizedContent: "",
    };
  }

  let workingMessage = message;

  if (workingMessage.length > MAX_MESSAGE_LENGTH) {
    violations.push({
      rule: "max_length",
      message: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters.`,
    });
    workingMessage = workingMessage.substring(0, MAX_MESSAGE_LENGTH);
  }

  const patterns = [...DEFAULT_BLOCKED_PATTERNS];

  for (const rule of orgGuardrails) {
    if (rule && rule.trim()) {
      patterns.push(new RegExp(rule, "gi"));
    }
  }

  for (const pattern of patterns) {
    if (pattern.test(workingMessage)) {
      violations.push({
        rule: "profanity_or_blocked_content",
        message: "Message contains blocked content.",
      });
      workingMessage = workingMessage.replace(pattern, "***");
    }
  }

  for (const topic of BLOCKED_SENSITIVE_TOPICS) {
    if (workingMessage.toLowerCase().includes(topic)) {
      violations.push({
        rule: "sensitive_topic",
        message: `Message references restricted topic: ${topic}.`,
      });
      workingMessage = workingMessage.replace(new RegExp(topic, "gi"), "[restricted]");
    }
  }

  const passed = violations.length === 0;

  return {
    passed,
    violations,
    sanitizedContent: workingMessage,
  };
};

export const detectPromptInjection = (message) => {
  if (!message || typeof message !== "string") {
    return { isInjected: false, confidence: 0, matchedPatterns: [] };
  }

  const matchedPatterns = [];
  let maxConfidence = 0;

  for (const entry of PROMPT_INJECTION_PATTERNS) {
    const matches = message.match(entry.pattern);
    if (matches && matches.length > 0) {
      matchedPatterns.push({
        name: entry.name,
        description: entry.description,
        match: matches[0],
      });
      maxConfidence = Math.max(maxConfidence, 0.7 + matches.length * 0.1);
    }
  }

  const hasUnusualFormatting = (message.match(/[^\x20-\x7E]/g) || []).length > message.length * 0.3;
  if (hasUnusualFormatting) {
    matchedPatterns.push({
      name: "unusual_encoding",
      description: "Message contains unusual non-printable characters",
      match: "(non-ASCII characters)",
    });
    maxConfidence = Math.max(maxConfidence, 0.4);
  }

  const isInjected = maxConfidence >= 0.5;

  return {
    isInjected,
    confidence: Math.min(maxConfidence, 1.0),
    matchedPatterns,
  };
};

export const checkOutputGuardrails = async (response, organizationId) => {
  const violations = [];
  let sanitized = response;

  if (!sanitized || typeof sanitized !== "string") {
    return {
      passed: false,
      violations: [{ rule: "empty_response", message: "Response is empty or invalid." }],
      sanitized: "",
    };
  }

  if (sanitized.length > MAX_OUTPUT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_OUTPUT_LENGTH);
    violations.push({
      rule: "max_output_length",
      message: `Response truncated to ${MAX_OUTPUT_LENGTH} characters.`,
    });
  }

  const internalKeywords = [
    "rag", "vector search", "embedding", "cosine similarity",
    "chunk", "token", "prompt injection", "system prompt",
    "knowledge base document", "retrieved documents",
    "retrieved context", "relevance scores",
    "DocumentChunk", "DocumentRoleAccess", "AISession",
  ];

  const lowerResponse = sanitized.toLowerCase();
  for (const keyword of internalKeywords) {
    if (lowerResponse.includes(keyword.toLowerCase())) {
      violations.push({
        rule: "internal_info_leak",
        message: `Response references internal term: "${keyword}".`,
      });
    }
  }

  for (const { name, pattern } of PII_PATTERNS) {
    if (pattern.test(sanitized)) {
      violations.push({
        rule: "pii_detected",
        message: `Response may contain PII: ${name}.`,
      });
      sanitized = sanitized.replace(pattern, "[REDACTED]");
    }
  }

  for (const pattern of DEFAULT_BLOCKED_PATTERNS) {
    if (pattern.test(sanitized)) {
      violations.push({
        rule: "profanity_in_output",
        message: "Response contains inappropriate language.",
      });
      sanitized = sanitized.replace(pattern, "***");
    }
  }

  const promptLeakIndicators = [
    /=== RECENT CONVERSATION ===/i,
    /=== USER CONTEXT ===/i,
    /=== RELEVANT DOCUMENTS ===/i,
    /=== RELEVANT FAQS ===/i,
    /=== KNOWN KNOWLEDGE GAPS ===/i,
    /=== INTERNAL RESPONSE GUIDANCE ===/i,
    /\[Confidence:\s*(LOW|MEDIUM|HIGH)\]/i,
    /SYSTEM_PROMPT/i,
    /buildPrompt/i,
  ];

  for (const indicator of promptLeakIndicators) {
    if (indicator.test(sanitized)) {
      violations.push({
        rule: "prompt_leak",
        message: "Response leaks internal prompt structure.",
      });
      sanitized = sanitized.replace(indicator, "[filtered]");
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    sanitized,
  };
};

/**
 * Interactive Diagnostic Simulator:
 * Runs input checks, prompt injection scanners, and PII/leak guardrails on test text.
 */
export const simulateGuardrailsTest = async (testText, organizationId = null) => {
  const [inputResult, injectionResult, outputResult] = await Promise.all([
    checkInputGuardrails(testText, organizationId),
    Promise.resolve(detectPromptInjection(testText)),
    checkOutputGuardrails(testText, organizationId),
  ]);

  const piiDetected = [];
  for (const { name, pattern } of PII_PATTERNS) {
    if (pattern.test(testText)) {
      piiDetected.push(name);
    }
  }

  const overallSafe = inputResult.passed && !injectionResult.isInjected && outputResult.violations.filter(v => v.rule !== "internal_info_leak").length === 0;

  return {
    sampleText: testText,
    overallSafe,
    riskScore: injectionResult.isInjected ? 85 : (!inputResult.passed ? 65 : (piiDetected.length > 0 ? 45 : 5)),
    inputAnalysis: inputResult,
    injectionAnalysis: injectionResult,
    outputAnalysis: outputResult,
    piiDetected,
    builtInPatterns: {
      blockedTopicsCount: BLOCKED_SENSITIVE_TOPICS.length,
      injectionRulesCount: PROMPT_INJECTION_PATTERNS.length,
      piiFiltersCount: PII_PATTERNS.length,
    },
  };
};

export default {
  checkInputGuardrails,
  detectPromptInjection,
  checkOutputGuardrails,
  simulateGuardrailsTest,
};
