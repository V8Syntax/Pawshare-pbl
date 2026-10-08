import Notification from '../models/Notification.js';
export const notify = (user, text, link = '') => Notification.create({ user, text, link });
