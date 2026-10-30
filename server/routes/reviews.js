import { Router } from 'express';
import { createReview, listingReviews, guestReviews } from '../controllers/reviewController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/', protect, createReview);
router.get('/listing/:id', listingReviews);
router.get('/guest/:id', protect, requireRole('host', 'admin'), guestReviews);

export default router;
