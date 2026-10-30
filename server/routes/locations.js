import { Router } from 'express';
import { listDistricts, listVillages, getVillage } from '../controllers/locationController.js';

const router = Router();

router.get('/districts', listDistricts);
router.get('/villages', listVillages);
router.get('/villages/:id', getVillage);

export default router;
