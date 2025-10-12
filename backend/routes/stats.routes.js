import { addStats,allStats,getGlobalStats,getStatsById,updateStats } from "../controllers/stats.controllers.js";
import express from "express";
const router=express.Router();

router.get('/',allStats);
router.post('/',addStats);
router.get('/global-stats', getGlobalStats); // Route mise à jour
router.get('/:id',getStatsById);
router.put('/:id', updateStats);
export default router;