import DocumentArchive from '../models/stats.models.js';
import Client from '../models/client.models.js'
export const addStats = async (req, res) => {
    try {
        const { client_id, document_type, average_ai_confidence, is_human_validated, is_corrected_by_human } = req.body;
        
        // Validation des données
        if (!client_id || !document_type) {
            return res.status(400).json({ error: "client_id et document_type sont requis" });
        }
        
        // Normalisation du document_type pour correspondre à l'énumération du modèle
        let normalizedDocumentType = document_type;
        if (document_type.toLowerCase() === 'cin') {
            normalizedDocumentType = 'CIN'; // ou 'cin' selon votre modèle
        } else if (document_type.toLowerCase() === 'permis') {
            normalizedDocumentType = 'PERMIS'; // ou 'permis' selon votre modèle
        }
         else if (document_type.toLowerCase() === 'carte grise') {
            normalizedDocumentType = 'CARTE GRISE'; // ou 'permis' selon votre modèle
        }
        
        const stat = await DocumentArchive.create({
            client_id,
            document_type: normalizedDocumentType,
            average_ai_confidence: average_ai_confidence || 0,
            is_human_validated: is_human_validated || false,
            is_corrected_by_human: is_corrected_by_human || false
        });
        
        res.status(200).json(stat);
    } catch (err) {
        console.error("Erreur lors de l'ajout des statistiques:", err);
        res.status(400).json({ error: err.message });
    }
}

export const allStats = async (req, res) => {
    try {
            const page = parseInt(req.query.page) || 1;  
            const limit = parseInt(req.query.limit) || 10;  
            const skip = (page - 1) * limit;
            const stats = await DocumentArchive.find()
                .sort({ createdAt: -1 }) 
                .skip(skip)
                .limit(limit);
            const totalStats= await DocumentArchive.countDocuments();
            const clients=await Client.find();
            res.status(200).json({stats,clients,totalPages: Math.ceil(totalStats / limit)});
    } catch (err) {
        console.error("Erreur lors de la récupération des statistiques:", err);
        res.status(400).json({ error: err.message });
    }
}

export const getGlobalStats = async (req, res) => {
    try {
        // --- Pipeline pour les statistiques globales ---
        const globalPipeline = [
            {
                $group: {
                    _id: null,
                    totalAverageConfidence: { $avg: "$average_ai_confidence" },
                    totalDocumentCount: { $sum: 1 },
                    humanCorrectedCount: {
                        $sum: {
                            $cond: { if: { $eq: ["$is_corrected_by_human", true] }, then: 1, else: 0 }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    average_confidence: { $round: ["$totalAverageConfidence", 2] },
                    document_count: "$totalDocumentCount",
                    human_corrected_count: "$humanCorrectedCount",
                    human_correction_percentage: {
                        $round: [
                            { $multiply: [{ $divide: ["$humanCorrectedCount", "$totalDocumentCount"] }, 100] },
                            2
                        ]
                    }
                }
            }
        ];

        // --- Pipeline pour les statistiques quotidiennes ---
      // --- Pipeline pour les statistiques quotidiennes (CORRIGÉ) ---
const dailyPipeline = [
    // ÉTAPE AJOUTÉE : Convertir le champ 'createdAt' en vrai type Date
    {
        $project: {
            // On essaie de convertir la date ici
            createdAt: { $toDate: "$createdAt" }
        }
    },
    // Le reste de votre pipeline reste presque identique
    {
        $group: {
            _id: {
                $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$createdAt" // On utilise le champ qui vient d'être converti
                }
            },
            count: { $sum: 1 }
        }
    },
    { $sort: { _id: 1 } },
    {
        $project: {
            _id: 0,
            date: "$_id",
            count: 1
        }
    }
];

        // 1. Exécuter la première agrégation (stats globales)
        const globalResult = await DocumentArchive.aggregate(globalPipeline);

        // 2. Exécuter la deuxième agrégation (stats quotidiennes)
        const dailyStats = await DocumentArchive.aggregate(dailyPipeline);

        // 3. Préparer les statistiques globales (avec valeurs par défaut si la collection est vide)
        const globalStats = globalResult.length > 0 ? globalResult[0] : {
            average_confidence: 0,
            document_count: 0,
            human_corrected_count: 0,
            human_correction_percentage: 0,
        };

        // 4. Combiner le tout dans un seul objet et l'envoyer
        const finalResponse = {
            ...globalStats, // Ajoute toutes les propriétés des stats globales
            dailyStats: dailyStats // Ajoute le tableau des stats quotidiennes
        };

        res.status(200).json(finalResponse);

    } catch (err) {
        console.error("Erreur lors du calcul des statistiques:", err);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

export const getStatsById = async (req, res) => {
    try {
        const { id } = req.params;
        // CORRECTION : Utiliser DocumentArchive.findById pour récupérer les statistiques
        const stats = await DocumentArchive.findById(id);
        
        if (!stats) {
            return res.status(404).json({ message: "Statistiques non trouvées pour cet ID" });
        }
        
        res.status(200).json(stats);
    } catch (err) {
        console.error("Erreur lors de la récupération des statistiques:", err);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
}

// Implémentation de la fonction updateStats qui était vide
export const updateStats = async (req, res) => {
    try {
        const { id } = req.params;
        const { average_ai_confidence, is_human_validated, is_corrected_by_human } = req.body;
        
        // Vérifier si les statistiques existent
        const existingStats = await DocumentArchive.findById(id);
        if (!existingStats) {
            return res.status(404).json({ message: "Statistiques non trouvées pour cet ID" });
        }
        
        // Mettre à jour les statistiques
        const updatedStats = await DocumentArchive.findByIdAndUpdate(
            id,
            {
                average_ai_confidence: average_ai_confidence !== undefined ? average_ai_confidence : existingStats.average_ai_confidence,
                is_human_validated: is_human_validated !== undefined ? is_human_validated : existingStats.is_human_validated,
                is_corrected_by_human: is_corrected_by_human !== undefined ? is_corrected_by_human : existingStats.is_corrected_by_human
            },
            { new: true } // Retourner le document mis à jour
        );
        
        res.status(200).json(updatedStats);
    } catch (err) {
        console.error("Erreur lors de la mise à jour des statistiques:", err);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
}