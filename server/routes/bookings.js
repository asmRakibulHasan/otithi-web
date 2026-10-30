import { Router } from 'express';
import {
  createBooking, myBookings, getBooking, hostBookings,
  acceptBooking, declineBooking, cancelBooking, completeBooking,
} from '../controllers/bookingController.js';
import { protect, requireRole, requireApproved } from '../middleware/auth.js';

const router = Router();
router.use(protect);

const traveller = requireRole('traveller');
const host = requireRole('host');

router.post('/', traveller, requireApproved, createBooking);
router.get('/mine', traveller, myBookings);
router.get('/host', host, hostBookings);
router.get('/:id', getBooking);
router.put('/:id/accept', host, acceptBooking);
router.put('/:id/decline', host, declineBooking);
router.put('/:id/cancel', traveller, cancelBooking);
router.put('/:id/complete', host, completeBooking);

export default router;
