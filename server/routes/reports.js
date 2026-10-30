import { Router } from 'express';
import { createReport } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/', protect, createReport);

export default router;
