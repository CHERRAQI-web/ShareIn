import mongoose from "mongoose";
import DrivingLicense from './driving_licenses.models.js';
import DocumentArchive from './stats.models.js'

const clientSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  cin: { type: String, required: true, unique: true },
  date_of_birth: { type: Date, required: true },
 


}, { timestamps: true }); // Gère automatiquement createdAt et updatedAt

clientSchema.pre('findOneAndDelete', async function() {
    console.log(">>> Middleware findOneAndDelete déclenché !");
    
    // CORRECTION : On récupère l'ID depuis le filtre de la requête
    const clientId = this.getFilter()._id; 
    console.log(">>> ID du client trouvé dans le filtre :", clientId);

    // On ajoute une vérification au cas où l'ID ne serait pas trouvé
    if (!clientId) {
        console.error(">>> ERREUR: L'ID du client n'a pas pu être récupéré depuis la requête.");
        return; // On arrête le middleware
    }

    try {
        const result1 = await DrivingLicense.deleteMany({ client_id: clientId });
         const result2 = await DocumentArchive.deleteMany({ client_id: clientId });
        console.log(`>>> Suppression en cascade : ${result1.deletedCount} permis supprimés et suppression stats ${result2.deletedCount}.`);
    } catch (error) {
        console.error(">>> Erreur lors de la suppression en cascade :", error);
    }
});

const Client = mongoose.model("Client", clientSchema);

export default Client;