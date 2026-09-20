import express from 'express';
import multer from 'multer';
import { analyzeProductImage, reanalyzeProductImage } from '../controllers/scannerController.js';

const router = express.Router();

// Configure multer memory storage (limit 15MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP) are supported for OCR scanning'));
    }
  },
});

// POST /api/scanner/analyze - Accepts multipart file 'image' or JSON { image: 'base64...' }
router.post('/analyze', upload.single('image'), analyzeProductImage);

// POST /api/scanner/reanalyze - Re-analyze with Sharp contrast & crop coordinates
router.post('/reanalyze', upload.single('image'), reanalyzeProductImage);

export default router;
