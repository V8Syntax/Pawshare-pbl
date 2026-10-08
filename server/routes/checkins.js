import { Router } from 'express';
import { myCheckIns, ownerCheckIns, completeCheckIn, logHealthUpdate } from '../controllers/checkinController.js';
import { protect } from '../middleware/auth.js';

const r = Router();
r.use(protect);
r.get('/mine', myCheckIns);
r.get('/owner', ownerCheckIns);
r.patch('/:id/complete', completeCheckIn);
r.post('/application/:applicationId/log', logHealthUpdate);
export default r;
