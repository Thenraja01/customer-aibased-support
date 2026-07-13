import mongoose from 'mongoose'
import Chat from './Chat.schema.js'
const MessageSchema = new mongoose.Schema(
    {
        chat_id: {
            type: Schema.Type.ObjectId,
            ref: "Chat",
            required: true
        },
        sender_type:{
                type:String,
                maxlength: 30
                
        },
        message:{
            type:String
        }
    },
    { timestamps: { createdAt: 'created_at', updatedAt: false } }
)
 
messageSchema.index({ chat_id: 1, created_at: 1 });
 
const Message = mongoose.model('Message', messageSchema);
export default Message