import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    animal: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', default: null },
    lastMessage: String,
    lastAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, lastAt: -1 });

export default mongoose.model('Conversation', conversationSchema);
