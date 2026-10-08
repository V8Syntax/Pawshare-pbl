import mongoose from 'mongoose';

export const STATUSES = ['submitted', 'under_review', 'approved', 'rejected', 'withdrawn', 'completed'];

const applicationSchema = new mongoose.Schema(
  {
    animal: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', required: true, index: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['adopt', 'foster'], required: true },
    household: {
      homeType: { type: String, enum: ['apartment', 'house'], required: true },
      hasYard: Boolean,
      hasKids: Boolean,
      hasOtherPets: Boolean,
      experience: { type: String, enum: ['none', 'some', 'experienced'], default: 'some' },
      hoursAlone: { type: Number, min: 0, max: 24, default: 4 },
    },
    message: { type: String, required: [true, 'Tell the shelter why you are a good fit'], maxlength: 2000 },
    status: { type: String, enum: STATUSES, default: 'submitted', index: true },
    history: [
      {
        status: String,
        note: String,
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Application', applicationSchema);
