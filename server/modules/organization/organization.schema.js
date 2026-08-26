import mongoose, { Schema } from "mongoose";

const workingDaySchema = new mongoose.Schema(
  {
    open: { type: String, default: "09:00" },
    close: { type: String, default: "17:00" },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const organizationSchema = new mongoose.Schema(
  {
    organization_id: { type: String, unique: true, required: true },
    name: { type: String, trim: true },
    domain: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      set: (v) => (v === null || v === undefined || !String(v).trim() ? undefined : String(v).trim().toLowerCase()),
    },
    address: { type: String },
    phone: { type: String, maxlength: 20 },
    email: { type: String, unique: true, lowercase: true, maxlength: 255 },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "DELETION_PENDING"],
      default: "active",
    },
    plan: {
      type: String,
      enum: ["free", "starter", "business", "enterprise"],
      default: "free",
    },
    customPrompt: { type: String, default: "" },

    // Branding
    logo: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },
    brand_colors: {
      primary: { type: String, default: "#2563eb" },
      secondary: { type: String, default: "#7c3aed" },
      accent: { type: String, default: "#f59e0b" },
    },

    // Chart Colors
    chart_colors: {
      primary: { type: String, default: "#2563eb" },
      secondary: { type: String, default: "#7c3aed" },
      tertiary: { type: String, default: "#059669" },
      quaternary: { type: String, default: "#f59e0b" },
      grid: { type: String, default: "#e2e8f0" },
      text: { type: String, default: "#64748b" },
      background: { type: String, default: "#ffffff" },
    },
    show_charts: { type: Boolean, default: true },
    ai_session_logging: { type: Boolean, default: true },

    // Chatbot & Embedded Widget Settings
    chatbot_name: { type: String, default: "Support AI" },
    default_language: { type: String, default: "en" },
    greeting_message: { type: String, default: "Hello! How can I help you today?" },
    widget_position: { type: String, enum: ["right", "left"], default: "right" },
    widget_theme: { type: String, enum: ["dark", "light", "custom"], default: "dark" },
    widget_enabled: { type: Boolean, default: true },

    // AI Settings
    ai_settings: {
      temperature: { type: Number, default: 0.7, min: 0, max: 2 },
      top_k: { type: Number, default: 40 },
      similarity_threshold: { type: Number, default: 0.75, min: 0, max: 1 },
      max_tokens: { type: Number, default: 2048 },
      system_prompt: { type: String, default: "You are a helpful AI customer support assistant. Always be polite and try to resolve the customer's issue." },
      confidence_threshold: {
        high: { type: Number, default: 0.9, min: 0, max: 1, description: "Above this: auto-respond" },
        medium: { type: Number, default: 0.6, min: 0, max: 1, description: "Between medium-high: suggest + offer human" },
      },
      response_style: {
        type: String,
        enum: ["concise", "balanced", "detailed"],
        default: "balanced",
      },
    },

    // Tenant-Level Configurations (Overrides Global .env)
    smtp_config: {
      host: { type: String, default: "" },
      port: { type: Number, default: 587 },
      secure: { type: Boolean, default: false },
      user: { type: String, default: "" },
      pass: { type: String, default: "" },
      from: { type: String, default: "" },
      enabled: { type: Boolean, default: false },
    },
    llm_config: {
      provider: { type: String, default: "" },
      api_key: { type: String, default: "" },
      model: { type: String, default: "" },
      model_name: { type: String, default: "" },
      base_url: { type: String, default: "" },
      groq_api_key: { type: String, default: "" },
      gemini_api_key: { type: String, default: "" },
      openai_api_key: { type: String, default: "" },
      grok_api_key: { type: String, default: "" },
      claude_api_key: { type: String, default: "" },
      timeout_ms: { type: Number, default: 5000 },
      max_retries: { type: Number, default: 2 },
      temperature: { type: Number, default: 0.7 },
      max_tokens: { type: Number, default: 2048 },
    },
    cloudinary_config: {
      cloud_name: { type: String, default: "" },
      api_key: { type: String, default: "" },
      api_secret: { type: String, default: "" },
      url: { type: String, default: "" },
    },
    rag_config: {
      chunk_size: { type: Number, default: 500 },
      chunk_overlap: { type: Number, default: 100 },
      top_k: { type: Number, default: 5 },
      min_score: { type: Number, default: 0.35 },
      bfs_max_depth: { type: Number, default: 2 },
    },

    // Guardrails
    guardrails: [
      {
        rule: { type: String },
        enabled: { type: Boolean, default: true },
      },
    ],

    // Working Hours
    working_hours: {
      timezone: { type: String, default: "UTC" },
      monday: { type: workingDaySchema, default: () => ({}) },
      tuesday: { type: workingDaySchema, default: () => ({}) },
      wednesday: { type: workingDaySchema, default: () => ({}) },
      thursday: { type: workingDaySchema, default: () => ({}) },
      friday: { type: workingDaySchema, default: () => ({}) },
      saturday: { type: workingDaySchema, default: () => ({ open: "10:00", close: "14:00", enabled: false }) },
      sunday: { type: workingDaySchema, default: () => ({ open: "10:00", close: "14:00", enabled: false }) },
    },

    // Per-priority SLA overrides (in minutes). Structure:
    // { urgent: { first_response_minutes, resolution_minutes }, high: {...}, ... }
    sla_settings: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // Ticket Auto-close settings after resolution
    auto_close_settings: {
      enabled: { type: Boolean, default: true },
      closing_period_hours: { type: Number, default: 48, min: 1, max: 720 },
    },

    // Ticket Form Customization Config
    ticket_form_config: [
      {
        field_key: { type: String, required: true },
        label: { type: String, required: true },
        enabled: { type: Boolean, default: true },
        required: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
      },
    ],

    // Email Templates
    email_templates: {
      ticket_assigned: {
        subject: { type: String, default: "New ticket assigned: {{ticket_id}}" },
        body: { type: String, default: "Hello {{agent_name}},\n\nTicket {{ticket_id}} has been assigned to you.\n\nSubject: {{subject}}\nPriority: {{priority}}\n\nPlease respond within the SLA period." },
      },
      ticket_resolved: {
        subject: { type: String, default: "Ticket resolved: {{ticket_id}}" },
        body: { type: String, default: "Hello {{customer_name}},\n\nYour ticket {{ticket_id}} has been resolved.\n\nPlease confirm if you're satisfied with the resolution." },
      },
    },

    storage_used: { type: Number, default: 0 },
    storage_limit: { type: Number, default: 524288000 },
    ai_requests_month: { type: Number, default: 0 },
    ai_requests_limit: { type: Number, default: 1000 },
    ai_requests_reset_at: { type: Date },
    subscription_start: { type: Date },
    subscription_end: { type: Date },
    api_keys: [
      {
        key: { type: String, required: true },
        key_hash: { type: String, default: null },
        name: { type: String, required: true },
        created_at: { type: Date, default: Date.now },
        last_used: { type: Date },
        is_active: { type: Boolean, default: true },
      },
    ],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

organizationSchema.pre("save", function (next) {
  if (this.domain === "" || (typeof this.domain === "string" && !this.domain.trim())) {
    this.domain = undefined;
  }
  next();
});

organizationSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update) {
    if (update.domain === "" || (typeof update.domain === "string" && !update.domain.trim())) {
      delete update.domain;
    }
    if (update.$set && (update.$set.domain === "" || (typeof update.$set.domain === "string" && !update.$set.domain.trim()))) {
      delete update.$set.domain;
    }
  }
  if (typeof next === "function") next();
});

export default mongoose.model("Organization", organizationSchema);
