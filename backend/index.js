import express from 'express';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import userRoutes from './routes/user.routes.js';
import connectDB from './db/db.js';
import cors from 'cors';
import vehiculeRoutes from './routes/vehicle_cards.routes.js';
import drivingRoutes from './routes/driving_licenses.routes.js';
import clientRoutes from './routes/client.routes.js';
import Satas from './routes/stats.routes.js';
import authRoutes from './routes/auth.routes.js';

dotenv.config();

const app = express();

// Configuration CORS améliorée
const allowedOrigins = [
  'http://localhost:5173',
  'https://share-in-1adx.vercel.app',
  // Ajoutez d'autres origines si nécessaire
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permet les requêtes sans origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`Origine non autorisée par CORS: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie']
  })
);

// La ligne suivante a été supprimée car elle cause une erreur
// app.options('*', cors()); 

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Connexion à MongoDB
connectDB();

// Routes
app.use('/api/users', userRoutes);
app.use('/api/vehicule', vehiculeRoutes);
app.use('/api/driving-licenses', drivingRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/Stats', Satas);
app.use("/api/auth", authRoutes);

// Middleware de gestion d'erreurs CORS
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS policy violation' });
  }
  next(err);
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

export default app;