import mongoose from "mongoose";
const documentTypeSchema=new mongoose.Schema({
     name: { type: String, required: true, maxlength: 100 },
})

const DocumentType = mongoose.model('DocumentType', documentTypeSchema);
export default DocumentType