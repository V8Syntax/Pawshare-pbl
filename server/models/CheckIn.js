import mongoose from 'mongoose';

const checkInSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
    animal: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', required: true },
    adopter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    completedAt: Date,
    wellbeing: { type: Number, min: 1, max: 5 },
    weightKg: Number,
    healthUpdate: String,
    notes: String,
    reminderSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('CheckIn', checkInSchema);
