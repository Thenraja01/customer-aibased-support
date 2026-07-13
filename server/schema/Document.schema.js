import mongoose, { model } from 'mongoose'
import User from './user.schema.js'
import DocumentType from './DocumentsTypeSchema.schema.js'
const documentSchema = new moongoose.Schema(
  {
    user_id:          { type: Schema.Types.ObjectId, ref: 'User', required: true },
    document_type_id: { type: Schema.Types.ObjectId, ref: 'DocumentType', required: true },
    file_name:        { type: String, required: true, maxlength: 255 },
    file_path:        { type: String, required: true, maxlength: 500 },
    status:           { type: String, maxlength: 30, default: 'pending' },
    uploaded_by:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: 'uploaded_at', updatedAt: false } }
);
 
const Document = mongoose.model('Document', documentSchema);
 export default Document