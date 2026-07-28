import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  role_name: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true,
    unique:true
  },
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    default: null
  },
  permissions: {
    type: [String],
    default: [],
    maxlength: 100
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  description: {
    type: String,
    maxlength: 200
  }
}, {
  timestamps: true
});

roleSchema.index({ role_name: 1, organization_id: 1 }, { unique: true });

export default mongoose.model("Role", roleSchema);