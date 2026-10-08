import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { notify } from '../utils/notify.js';

export const listConversations = async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .sort({ lastAt: -1 })
    .populate('participants', 'name organization role verified')
    .populate('animal', 'name photos');
  res.json({ conversations });
};

async function loadConversation(req, res) {
  const convo = await Conversation.findById(req.params.id);
  if (!convo) { res.status(404).json({ message: 'Conversation not found' }); return null; }
  if (!convo.participants.some((p) => String(p) === req.user.id)) { res.status(403).json({ message: 'Not allowed' }); return null; }
  return convo;
}

export const getMessages = async (req, res) => {
  const convo = await loadConversation(req, res);
  if (!convo) return;
  const messages = await Message.find({ conversation: convo._id }).sort({ createdAt: 1 }).limit(500);
  res.json({ messages });
};

async function push(convo, sender, text) {
  const message = await Message.create({ conversation: convo._id, sender: sender._id, text });
  convo.lastMessage = text.slice(0, 120);
  convo.lastAt = new Date();
  await convo.save();
  const other = convo.participants.find((p) => String(p) !== String(sender._id));
  await notify(other, `New message from ${sender.name}`, `/messages?c=${convo.id}`);
  return message;
}

export const sendMessage = async (req, res) => {
  const convo = await loadConversation(req, res);
  if (!convo) return;
  if (!req.body.text?.trim()) return res.status(400).json({ message: 'Message cannot be empty' });
  res.status(201).json({ message: await push(convo, req.user, req.body.text.trim()) });
};

/** Starts (or reuses) a conversation about an animal and sends the first message. */
export const startConversation = async (req, res) => {
  const { to, animalId, text } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: 'Message cannot be empty' });
  if (!to || to === req.user.id) return res.status(400).json({ message: 'Invalid recipient' });
  let convo = await Conversation.findOne({ participants: { $all: [req.user._id, to], $size: 2 }, animal: animalId || null });
  if (!convo) convo = await Conversation.create({ participants: [req.user._id, to], animal: animalId || null });
  await push(convo, req.user, text.trim());
  res.status(201).json({ conversationId: convo.id });
};
