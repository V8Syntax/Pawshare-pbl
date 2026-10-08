import { Router } from 'express';
import { listConversations, getMessages, sendMessage, startConversation } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const r = Router();
r.use(protect);
r.get('/conversations', listConversations);
r.post('/start', startConversation);
r.get('/conversations/:id', getMessages);
r.post('/conversations/:id', sendMessage);
export default r;
