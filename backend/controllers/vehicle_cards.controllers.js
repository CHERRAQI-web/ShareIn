import VehicleCard from '../models/vehicle_cards.models.js';

export const addVehicleCard = async (req, res) => {
    try {
        const { client_id, numero_immatriculation, type, type_carburant, marque, numero_chassis } = req.body;
        const VehicleC = await VehicleCard.create({ client_id, numero_immatriculation, type, type_carburant, marque, numero_chassis });
        res.status(200).json(VehicleC);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

export const allVehicleCard = async (req, res) => {
    try {
        const VehicleCards = await VehicleCard.find();
        res.status(200).json(VehicleCards);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

// CORRECTION : Fonction pour récupérer une carte grise par client_id
export const getVehicleCardByClientId = async (req, res) => {
    try {
        const { id } = req.params;
        const vehicule = await VehicleCard.findOne({ client_id: id });
        if (!vehicule) {
            return res.status(404).json({ message: "Carte grise non trouvée pour ce client" });
        }
        res.status(200).json(vehicule);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

// Fonction existante mais avec un meilleur statut d'erreur
export const getVehiculeById = async (req, res) => {
    try {
        const { id } = req.params;
        const vehicule = await VehicleCard.findById(id);
        if (!vehicule) {
            return res.status(404).json({ message: "Ce véhicule n'existe pas" });
        }
        res.status(200).json(vehicule);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

// AJOUT : Fonction pour mettre à jour une carte grise par client_id
export const updateVehicleCardByClientId = async (req, res) => {
    try {
        const { id } = req.params;
        const { numero_immatriculation, type, type_carburant, marque, numero_chassis } = req.body;
        
        const vehicule = await VehicleCard.findOneAndUpdate(
            { client_id: id },
            { numero_immatriculation, type, type_carburant, marque, numero_chassis },
            { new: true }
        );
        
        if (!vehicule) {
            return res.status(404).json({ message: "Carte grise non trouvée pour ce client" });
        }
        
        res.status(200).json(vehicule);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}