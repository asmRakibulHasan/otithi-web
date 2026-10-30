import { Router } from 'express';
import { searchListings, getListing, myListings, createListing, updateListing } from '../controllers/listingController.js';
import { protect, optionalAuth, requireRole, requireApproved } from '../middleware/auth.js';
import { uploadPhoto } from '../middleware/upload.js';

const router = Router();
const hostOnly = [protect, requireRole('host'), requireApproved];

router.get('/', searchListings);
router.get('/mine', protect, requireRole('host'), myListings);
router.get('/:id', optionalAuth, getListing);
router.post('/', ...hostOnly, uploadPhoto.array('photos', 10), createListing);
router.put('/:id', ...hostOnly, uploadPhoto.array('photos', 10), updateListing);

export default router;
