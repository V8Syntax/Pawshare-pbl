import { Router } from 'express';
import { listProviders, getProvider, createReview, verifyProvider } from '../controllers/providerController.js';
import { protect, requireRole } from '../middleware/auth.js';

const r = Router();
r.get('/', listProviders);
r.get('/:id', getProvider);
r.post('/:id/reviews', protect, createReview);
r.patch('/:id/verify', protect, requireRole('admin'), verifyProvider);
export default r;
