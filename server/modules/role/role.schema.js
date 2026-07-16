import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  role_name: { type: String, required: true, maxlength: 50, unique: true },
  permissions: [{ type: String, maxlength: 100 }],
});

export default mongoose.model("Role", roleSchema);
