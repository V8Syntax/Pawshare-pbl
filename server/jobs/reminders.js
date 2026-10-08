import cron from 'node-cron';
import CheckIn from '../models/CheckIn.js';
import { notify } from '../utils/notify.js';

export async function sendDueReminders() {
  const soon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const due = await CheckIn.find({ status: 'pending', reminderSentAt: null, dueDate: { $lte: soon } }).populate('animal', 'name');
  for (const c of due) {
    await notify(c.adopter, `Check-in due for ${c.animal?.name || 'your pet'} on ${c.dueDate.toDateString()}`, '/dashboard?tab=checkins');
    c.reminderSentAt = new Date();
    await c.save();
  }
  if (due.length) console.log(`Sent ${due.length} check-in reminder(s)`);
}

export function startReminderJob() {
  cron.schedule('0 9 * * *', () => sendDueReminders().catch(console.error)); // daily at 09:00
  sendDueReminders().catch(console.error); // catch up on startup
}
