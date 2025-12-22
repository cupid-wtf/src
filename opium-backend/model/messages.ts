import mongoose, { Schema } from "mongoose";
export interface ChatMessage extends Document {
    user_id: string;
    message: string;
  }
const chatSchema = new Schema<ChatMessage>(
    {
      user_id: { type: String },
      message: { type: String }
    },
    { timestamps: true }
  );
  const ChatModel = mongoose.models.Chat || mongoose.model<ChatMessage>("Chat", chatSchema);
  
  export default ChatModel;
  