import Notification from '../models/Notification.js';

export const list = async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30);
  res.json({ notifications, unread: notifications.filter((n) => !n.read).length });
};

export const markAllRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ ok: true });
};
