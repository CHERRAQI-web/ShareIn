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

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
     origin: true,
    credentials: true,
  })
);

// Connexion à MongoDB
connectDB();

// Routes
app.use('/api/users', userRoutes);
app.use('/api/vehicule', vehiculeRoutes);
app.use('/api/driving-licenses', drivingRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/Stats', Satas);
app.use("/api/auth", authRoutes);


// Démarapp.use('/api', studentsRouter);rer le serveur
export default app;