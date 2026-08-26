import mongoose, { Schema } from "mongoose";

const userSchema = new mongoose.Schema(
  {
     organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    branch_id: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    role: { 
      type: String, 
      enum: ["super_admin", "admin", "branch_admin", "support", "customer"], 
      default: "customer",
      required: true 
    },
    name: { type: String, required: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      maxlength: 100,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/,
    },
    phone: { type: String, maxlength: 20 },
    password: {
      type: String,
      required: function () {
        return !this.auth_type || this.auth_type === "local";
      },
      maxlength: 255,
    },
    dob: { type: Date },
    auth_type: {
      type: String,
      enum: ["local", "google", "github", "facebook"],
      maxlength: 30,
      default: "local",
    },
    status: {
      type: String,
      // pending   = awaiting admin review
      // approved  = admin approved, OTP not yet verified
      // active    = fully verified, can login
      // inactive  = disabled by admin
      // blocked   = rejected / blocked
      enum: ["pending", "approved", "active", "inactive", "blocked"],
      maxlength: 20,
      default: "active",
    },
    // Admin approval tracking
    approved_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    approved_at: { type: Date, default: null },
    rejection_reason: { type: String, maxlength: 500, default: null },

    // Who created this user (for audit trail)
    created_by: { type: Schema.Types.ObjectId, ref: "User", default: null },

    fcm_token: { type: String, default: null },
    otp: { type: String, default: null },
    otp_expiry: { type: Date, default: null },
    profileImage: { type: String, default: null },
    two_factor_enabled: { type: Boolean, default: false },
    // Support-agent operational profile (skills + capacity + availability).
    agent_profile: {
      max_active_tickets: { type: Number, default: 10, min: 1 },
      skills: [
        {
          name: { type: String, maxlength: 50 },
          proficiency: { type: Number, min: 1, max: 5, default: 1 },
        },
      ],
      status: {
        type: String,
        enum: ["ONLINE", "OFFLINE", "BUSY", "AWAY", "INACTIVE"],
        default: "OFFLINE",
      },
      last_active_at: { type: Date, default: null },
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

// Compound indexes for tenant + branch queries
userSchema.index({ organization_id: 1, branch_id: 1 });
userSchema.index({ organization_id: 1, role: 1 });
userSchema.index({ organization_id: 1, branch_id: 1, role: 1 });

// Custom validation: non-super_admin users should have a branch_id
// (enforced at the service layer rather than schema level to allow
//  org_admin users that operate across branches)

export default mongoose.model("User", userSchema);
