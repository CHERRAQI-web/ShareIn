import {addDriving,allDriving,getDrivingByClientId,updateDrivingByClientId,getDrivingById} from '../controllers/driving_licenses.controllers.js';
import express from 'express';
const router = express.Router();


router.get('/',allDriving);
router.post('/',addDriving);

router.get('/client/:id', getDrivingByClientId);
router.put('/client/:id', updateDrivingByClientId);
router.get('/:id', getDrivingById);
export default router;