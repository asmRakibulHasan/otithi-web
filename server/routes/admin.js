import { Router } from 'express';
import { stats, listUsers, idDocument, setUserStatus, listListings, setListingStatus } from '../controllers/adminController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(protect, requireRole('admin'));

router.get('/stats', stats);
router.get('/users', listUsers);
router.get('/users/:id/id-document', idDocument);
router.put('/users/:id/status', setUserStatus);
router.get('/listings', listListings);
router.put('/listings/:id/status', setListingStatus);

export default router;
