import { Router } from 'express';
import { register, login, me, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const r = Router();
r.post('/register', register);
r.post('/login', login);
r.get('/me', protect, me);
r.put('/me', protect, updateProfile);
export default r;
