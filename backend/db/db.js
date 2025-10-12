import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connecté à MongoDB Atlas');
    } catch (err) {
        console.error('❌ Erreur MongoDB :', err);
        process.exit(1);
    }
};

export default connectDB;
