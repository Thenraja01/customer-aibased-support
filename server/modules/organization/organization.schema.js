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
    domain: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    address: { type: String },
    phone: { type: String, maxlength: 20 },
    email: { type: String, unique: true, lowercase: true, maxlength: 255 },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
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

    // Chatbot
    chatbot_name: { type: String, default: "Support AI" },
    default_language: { type: String, default: "en" },
    greeting_message: { type: String, default: "Hello! How can I help you today?" },

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

export default mongoose.model("Organization", organizationSchema);
