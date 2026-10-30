import { Router } from 'express';
import {
  stats, listUsers, idDocument, setUserStatus, listListings, setListingStatus,
  listReports, resolveReport, listLocations, createDistrict, deleteDistrict, createVillage, deleteVillage,
} from '../controllers/adminController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(protect, requireRole('admin'));

router.get('/stats', stats);
router.get('/users', listUsers);
router.get('/users/:id/id-document', idDocument);
router.put('/users/:id/status', setUserStatus);
router.get('/listings', listListings);
router.put('/listings/:id/status', setListingStatus);
router.get('/reports', listReports);
router.put('/reports/:id/resolve', resolveReport);
router.get('/locations', listLocations);
router.post('/districts', createDistrict);
router.delete('/districts/:id', deleteDistrict);
router.post('/villages', createVillage);
router.delete('/villages/:id', deleteVillage);

export default router;
