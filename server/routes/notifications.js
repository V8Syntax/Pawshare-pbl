import { Router } from 'express';
import { list, markAllRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const r = Router();
r.use(protect);
r.get('/', list);
r.post('/read-all', markAllRead);
export default r;
