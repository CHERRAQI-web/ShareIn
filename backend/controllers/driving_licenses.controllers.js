import Driving from '../models/driving_licenses.models.js';
import Client from '../models/client.models.js';

export const addDriving = async (req, res) => {
    try {
        const { client_id, license_number, issue_date, expiry_date, categorie } = req.body;
        const driving_license = await Driving.create({ 
            client_id: client_id,
            license_number,
            categorie,
            issue_date, 
            expiry_date,
        });
        res.status(200).json(driving_license);
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({ error: err.message });
        }
        res.status(400).json({ error: err.message });
    }
};

export const allDriving = async (req, res) => {
    try {
        const driving_licenses = await Driving.find();
        
        const dailyStats = await Driving.aggregate([
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            },
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    count: 1
                }
            }
        ]);
        
        const clients = await Client.find();
        res.status(200).json({ driving_licenses, dailyStats, clients });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

// CORRECTION : Fonction pour récupérer un permis par client_id
export const getDrivingByClientId = async (req, res) => {
    try {
        const { id } = req.params;
        const permis = await Driving.findOne({ client_id: id });
        if (!permis) {
            return res.status(404).json({ message: "Permis non trouvé pour ce client" });
        }
        res.status(200).json(permis);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

// Fonction existante mais avec un meilleur statut d'erreur
export const getDrivingById = async (req, res) => {
    try {
        const { id } = req.params;
        const permis = await Driving.findById(id);
        if (!permis) {
            return res.status(404).json({ message: "Ce permis n'existe pas" });
        }
        res.status(200).json(permis);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

// AJOUT : Fonction pour mettre à jour un permis par client_id
export const updateDrivingByClientId = async (req, res) => {
    try {
        const { id } = req.params;
        const { license_number, issue_date, expiry_date, categorie } = req.body;
        
        const permis = await Driving.findOneAndUpdate(
            { client_id: id },
            { license_number, issue_date, expiry_date, categorie },
            { new: true }
        );
        
        if (!permis) {
            return res.status(404).json({ message: "Permis non trouvé pour ce client" });
        }
        
        res.status(200).json(permis);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

export const deleteDriving = async (req, res) => {
    try {
        const { id } = req.params;
        const permis = await Driving.findByIdAndDelete(id);
        if (!permis) {
            return res.status(404).json({ message: "Ce permis n'existe pas" });
        }
        res.status(200).json(permis);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}