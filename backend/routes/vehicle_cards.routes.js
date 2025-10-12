import {addVehicleCard,allVehicleCard,getVehicleCardByClientId,updateVehicleCardByClientId,getVehiculeById} from '../controllers/vehicle_cards.controllers.js';
import express from 'express';
const router = express.Router();


router.get('/',allVehicleCard);
router.post('/',addVehicleCard);
router.get('/client/:id', getVehicleCardByClientId);
router.put('/client/:id', updateVehicleCardByClientId);
router.get('/:id', getVehiculeById);
export default router;