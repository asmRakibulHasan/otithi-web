import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export const ID_DIR = path.join(__dirname, '..', 'private', 'ids');
export const PHOTO_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(ID_DIR, { recursive: true });
fs.mkdirSync(PHOTO_DIR, { recursive: true });

function makeUpload(dir) {
  const storage = multer.diskStorage({
    destination: dir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: MAX_SIZE },
    fileFilter: (req, file, cb) => {
      if (IMAGE_TYPES.includes(file.mimetype)) return cb(null, true);
      const err = new Error('Only JPG, PNG or WEBP images are allowed');
      err.status = 400;
      cb(err);
    },
  });
}

// Identity documents: private folder, not served by express.static
export const uploadId = makeUpload(ID_DIR);
// Room photos: public /uploads folder
export const uploadPhoto = makeUpload(PHOTO_DIR);
