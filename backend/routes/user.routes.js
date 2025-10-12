import Users from '../controllers/user.controllers.js';
import express from 'express';
const router = express.Router();


router.get('/',Users.allUser);
router.post('/',Users.addUser);

export default router;