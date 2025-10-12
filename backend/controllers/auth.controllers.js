import users from "./user.controllers.js";
import { generateToken } from "../utils/generateToken.js";
import { comparePassword, hashPassword } from "../utils/hashPassword.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

// Fonction pour supprimer le mot de passe avant de renvoyer l'user
const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérification des champs
    if (!email || !password) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    // Chercher l'utilisateur par email
    const user = await users.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Email incorrect" });
    }
    const passwordReceived = password.trim();
    const hashedPassword = user.password.trim();
    console.log("Mot de passe entré :", passwordReceived);
    const hashePassword = await hashPassword(password);

    console.log("le hash de mot de passe entree", hashePassword);

    console.log("Mot de passe haché :", hashedPassword);
    // Vérification du mot de passe
    const validPassword = await comparePassword(
      passwordReceived,
      hashedPassword
    );
    if (!validPassword) {
      return res.status(400).json({ message: "Mot de passe incorrect" });
    }

    // Génération du token
    const token = generateToken(user);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000, // 1 heure
    });
    res
      .status(200)
      .json({ message: "Connexion réussie", user: sanitizeUser(user), token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // même config que login
      sameSite: "strict",
      path: "/", // obligatoire si tu veux être sûr
    });
    res.status(200).json({ message: "Déconnexion réussie" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const register = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: "Tous les champs sont requis" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Les mots de passe ne correspondent pas" });
  }

  const emailDomain = email.split('@')[1];
  if (emailDomain !== 'gmail.com') {
    return res.status(400).json({ message: "L'email doit être un email Gmail." });
  }

  try {
    // Vérification de l'email avec Abstract API
    const response = await axios.get(`https://emailreputation.abstractapi.com/v1/`, {
      params: {
        api_key: process.env.EMAIL_VERIFIER_API_KEY,
        email: email,
      },
    });

    const is_smtp_valid = response.data.email_deliverability.is_smtp_valid;
      console.log(is_smtp_valid);

      if (!is_smtp_valid) {
        return res.status(400).json({ message: "L'email n'existe pas ou est invalide." });
      }
   

    const existingUser = await users.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await users.addUser({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: "Utilisateur créé avec succès", user: newUser });
  } catch (error) {
    console.error("Erreur lors de la vérification de l'email :", error);

    if (error.response && error.response.status === 401) {
      res.status(500).json({ message: "Clé API invalide ou non autorisée." });
    } else {
      res.status(500).json({ message: "Erreur interne du serveur." });
    }
  }
};