// role.schema.js
import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  role_name: { 
    type: String, 
    required: true, 
    maxlength: 50, 
    unique: true,
    trim: true 
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

export default mongoose.model("Role", roleSchema);