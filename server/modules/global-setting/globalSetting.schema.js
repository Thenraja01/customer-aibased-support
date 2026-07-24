import mongoose, { Schema } from "mongoose";

const globalSettingSchema = new mongoose.Schema(
  {
    // Singleton document; always _id === "global"
    _id: { type: String, default: "global" },

    app_name: { type: String, default: "SupportAI" },
    logo: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },
    favicon_url: { type: String, default: "" },

    brand_colors: {
      primary: { type: String, default: "#2563eb" },
      secondary: { type: String, default: "#7c3aed" },
      accent: { type: String, default: "#f59e0b" },
    },

    marketing: {
      hero_title: { type: String, default: "AI-Powered Customer Support" },
      hero_subtitle: {
        type: String,
        default: "Transform your customer experience with intelligent automation",
      },
      hero_cta_text: { type: String, default: "Get Started" },
      features_title: { type: String, default: "Powerful Features" },
      features: [
        {
          title: { type: String },
          description: { type: String },
          icon: { type: String, default: "bot" },
        },
      ],
      footer_text: { type: String, default: "" },
    },

    login_page: {
      title: { type: String, default: "Welcome Back" },
      subtitle: { type: String, default: "Sign in to your account" },
    },

    legal: {
      about_text: { type: String, default: "" },
      privacy_policy: { type: String, default: "" },
      terms_of_service: { type: String, default: "" },
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const GlobalSetting = mongoose.model("GlobalSetting", globalSettingSchema);

export default GlobalSetting;
