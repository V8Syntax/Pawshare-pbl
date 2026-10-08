import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const pointSchema = new mongoose.Schema(
  { type: { type: String, enum: ['Point'] }, coordinates: { type: [Number], default: undefined } },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['adopter', 'shelter', 'caregiver', 'admin'], default: 'adopter' },
    organization: { type: String, trim: true },
    bio: { type: String, maxlength: 1000 },
    phone: String,
    city: String,
    location: pointSchema,
    // Provider verification (set by an admin)
    verified: { type: Boolean, default: false },
    // Rating summary for shelters / caregivers
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    // Lifestyle preferences used for matching
    preferences: {
      species: [String],
      sizes: [String],
      homeType: { type: String, enum: ['apartment', 'house', ''], default: '' },
      hasYard: Boolean,
      hasKids: Boolean,
      hasOtherPets: Boolean,
      activity: { type: String, enum: ['low', 'medium', 'high', ''], default: '' },
      maxDistanceKm: { type: Number, default: 50 },
    },
  },
  { timestamps: true }
);

userSchema.index({ location: '2dsphere' });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model('User', userSchema);
