import dotenv from "dotenv";
import User from "../models/user.models.js";
import jwt, { decode } from "jsonwebtoken";

dotenv.config();

export const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized token" });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      req.user = decoded;
      next();
    });
  }catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const isAdmin =async(req,res,next)=>{
      try {
            const {id}=req.user;
            const userData=await User.findById(id);
            if(!userData){
                      return res.status(404).json({ message: "Utilisateur non trouvé" });

            }
            if(userData.role !== "admin") {
                return res.status(403).json({ message: "Forbidden, seul un admin peut accéder à cette ressource" });
            }
        next()
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
}
