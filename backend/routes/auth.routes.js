import { login, register, logout  } from "../controllers/auth.controllers.js";
import express from 'express';
import User from "../models/user.models.js";
import { verifyToken } from "../middleware/auth.middleware.js";
const router=express.Router();

router.post('/login',login);
router.post("/register", register);
router.post('/logout', logout);    

router.get('/me', verifyToken, async (req, res) => {
  try {
    // req.user contient les informations décodées du token (ajoutées par le middleware verifyToken)
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// router.post("/send-confirmation-email", sendConfirmationEmailRoute);





export default router;