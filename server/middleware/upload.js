import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import multer from 'multer';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');

const storage = multer.diskStorage({
  destination: dir,
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (_req, file, cb) =>
    /^image\/(jpe?g|png|webp)$/.test(file.mimetype) ? cb(null, true) : cb(new Error('Only JPG, PNG or WebP images are allowed')),
});

export default upload;
