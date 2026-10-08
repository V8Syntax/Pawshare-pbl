import { Router } from 'express';
import { listAnimals, getAnimal, createAnimal, updateAnimal, deleteAnimal, addHealthRecord, getMatches } from '../controllers/animalController.js';
import { protect, requireRole } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const r = Router();
const provider = requireRole('shelter', 'caregiver', 'admin');

r.get('/', listAnimals);
r.get('/matches', protect, getMatches);
r.get('/:id', getAnimal);
r.post('/', protect, provider, upload.array('photos', 6), createAnimal);
r.put('/:id', protect, provider, upload.array('photos', 6), updateAnimal);
r.delete('/:id', protect, provider, deleteAnimal);
r.post('/:id/health', protect, provider, addHealthRecord);
export default r;
