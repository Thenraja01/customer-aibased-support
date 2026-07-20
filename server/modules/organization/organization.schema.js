import mongoose from "mongoose";

const OrganizationSchema = new mongoose.Schema(
  {
    organization_id: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    address: {
      type: String,
    },
    phone: {
      type: String,
      maxlength: 20,
    },
    email: {
      type: String,
      maxlength: 255,
      unique: true,
      lowercase: true,
    },
    logo_url: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    approval_status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    rejectReason: {
      type: String,
    },
    registration_type: {
      type: String,
      enum: ["admin_created", "self_registered"],
      default: "admin_created",
    },
    branding: {
      primary_color: {
        type: String,
        default: "#2563EB",
      },
      secondary_color: {
        type: String,
        default: "#7C3AED",
      },
      logo_url: {
        type: String,
      },
      favicon_url: {
        type: String,
      },
      app_name: {
        type: String,
        default: "AI Support Portal",
      },
      font_family: {
        type: String,
        default: "Inter",
      },
    },
    features: {
      rag_enabled: {
        type: Boolean,
        default: true,
      },
      chat_enabled: {
        type: Boolean,
        default: true,
      },
      tickets_enabled: {
        type: Boolean,
        default: true,
      },
      knowledge_base_enabled: {
        type: Boolean,
        default: true,
      },
      document_verification_enabled: {
        type: Boolean,
        default: true,
      },
      analytics_enabled: {
        type: Boolean,
        default: true,
      },
      bulk_upload_enabled: {
        type: Boolean,
        default: false,
      },
      api_access_enabled: {
        type: Boolean,
        default: false,
      },
      sso_enabled: {
        type: Boolean,
        default: false,
      },
      two_factor_required: {
        type: Boolean,
        default: false,
      },
    },
    limits: {
      max_users: {
        type: Number,
        default: 100,
      },
      max_file_size_mb: {
        type: Number,
        default: 10,
      },
      max_uploads_per_day: {
        type: Number,
        default: 50,
      },
      max_knowledge_base_docs: {
        type: Number,
        default: 1000,
      },
      max_rag_chunks: {
        type: Number,
        default: 500,
      },
      max_chat_sessions: {
        type: Number,
        default: 10000,
      },
      max_ticket_count: {
        type: Number,
        default: 1000,
      },
    },
    ai_config: {
      provider: {
        type: String,
        enum: ["groq", "google", "openai", "huggingface", "claude"],
        default: "groq",
      },
      model: {
        type: String,
        default: "llama3-70b-8192",
      },
      embedding_model: {
        type: String,
        default: "nomic-embed-text-v1.5",
      },
      temperature: {
        type: Number,
        default: 0.7,
        min: 0,
        max: 2,
      },
      max_tokens: {
        type: Number,
        default: 4096,
      },
      system_prompt_override: {
        type: String,
      },
      fallback_message: {
        type: String,
        default: "I don't have enough information from our knowledge base to answer that question. Please contact support for assistance.",
      },
      chunk_size: {
        type: Number,
        default: 512,
      },
      chunk_overlap: {
        type: Number,
        default: 50,
      },
      top_k_retrieval: {
        type: Number,
        default: 5,
      },
      similarity_threshold: {
        type: Number,
        default: 0.75,
        min: 0,
        max: 1,
      },
      api_keys: {
        groq_api_key: String,
        google_ai_api_key: String,
        openai_api_key: String,
        huggingface_api_key: String,
      },
    },
    allowed_file_types: {
      type: [String],
      default: ["pdf", "docx", "jpg", "jpeg", "png"],
    },
    is_deleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

OrganizationSchema.pre("save", async function () {
  if (!this.slug && this.name) {
    let slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

    let counter = 1;
    let candidate = slug;
    const Model = mongoose.model("Organization");
    while (await Model.findOne({ slug: candidate, _id: { $ne: this._id } })) {
      candidate = `${slug}-${counter}`;
      counter++;
    }
    this.slug = candidate;
  }
});

export default mongoose.model("Organization", OrganizationSchema);
