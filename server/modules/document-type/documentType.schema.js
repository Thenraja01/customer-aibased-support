import mongoose from "mongoose";

const documentTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100, unique: true },
  description: { type: String, maxlength: 500 },
});

export default mongoose.model("DocumentType", documentTypeSchema);
