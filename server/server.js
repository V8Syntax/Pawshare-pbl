import 'dotenv/config';
import 'express-async-errors';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './db.js';
import { notFound, errorHandler } from './middleware/error.js';
import { startReminderJob } from './jobs/reminders.js';
import authRoutes from './routes/auth.js';
import animalRoutes from './routes/animals.js';
import applicationRoutes from './routes/applications.js';
import messageRoutes from './routes/messages.js';
import checkinRoutes from './routes/checkins.js';
import providerRoutes from './routes/providers.js';
import notificationRoutes from './routes/notifications.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  startReminderJob();
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
});
