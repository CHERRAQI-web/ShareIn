import {allClient,addClient,getClientById,deleteClient, updateClient} from '../controllers/client.controllers.js';
import express from 'express';
const router = express.Router();


router.get('/',allClient);
router.post('/',addClient);
router.get('/:id',getClientById);
router.delete('/:id',deleteClient)
router.put('/:id',updateClient)
export default router;