import mongoose from 'mongoose';

const healthRecordSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['vaccination', 'treatment', 'checkup', 'surgery', 'post-adoption', 'other'], default: 'checkup' },
    description: { type: String, required: true },
    vet: String,
  },
  { _id: true }
);

const animalSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Name is required'], trim: true },
    species: { type: String, enum: ['dog', 'cat', 'rabbit', 'bird', 'other'], required: true },
    breed: { type: String, trim: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    ageMonths: { type: Number, min: 0, required: true },
    size: { type: String, enum: ['small', 'medium', 'large'], required: true },
    energy: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    description: { type: String, maxlength: 2000 },
    photos: [String],
    temperament: [String],
    goodWith: { kids: Boolean, dogs: Boolean, cats: Boolean },
    health: { vaccinated: Boolean, neutered: Boolean, microchipped: Boolean, notes: String },
    healthRecords: [healthRecordSchema],
    listingType: { type: String, enum: ['adopt', 'foster', 'both'], default: 'adopt' },
    status: { type: String, enum: ['available', 'pending', 'adopted', 'fostered', 'unavailable'], default: 'available', index: true },
    city: String,
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number], default: undefined },
    },
  },
  { timestamps: true }
);

animalSchema.index({ location: '2dsphere' });
animalSchema.index({ name: 'text', breed: 'text', description: 'text' });

export default mongoose.model('Animal', animalSchema);
