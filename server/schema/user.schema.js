import mongoose,{Schema} from 'mongoose'
import Organization from "./Organizations.schema.js"
import Role from "./role.schema.js"
const userSchema = new mongoose.Schema(
  {
    organization_id: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    role_id:         { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    name:            { type: String, required: true, maxlength: 100 },
    email:           { type: String, required: true, maxlength: 100, unique: true },
    phone:           { type: String, maxlength: 20 },
    password_hash:   { type: String, required: true, maxlength: 255 },
    dob:             { type: Date },
    auth_type:       { type: String, maxlength: 30, default: 'local' },
    status:          { type: String, maxlength: 20, default: 'active' },
  },
  { timestamps: { createdAt: 'created_At', updatedAt: false } }
);
 
userSchema.index({ email: 1 }, { unique: true });

export default mongoose.model('User', userSchema);
