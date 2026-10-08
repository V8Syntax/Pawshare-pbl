import { Router } from 'express';
import { createApplication, myApplications, incomingApplications, getApplication, updateStatus, withdraw } from '../controllers/applicationController.js';
import { protect, requireRole } from '../middleware/auth.js';

const r = Router();
r.use(protect);
r.post('/', createApplication);
r.get('/mine', myApplications);
r.get('/incoming', requireRole('shelter', 'caregiver', 'admin'), incomingApplications);
r.get('/:id', getApplication);
r.patch('/:id/status', requireRole('shelter', 'caregiver', 'admin'), updateStatus);
r.patch('/:id/withdraw', withdraw);
export default r;
