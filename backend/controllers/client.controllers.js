import Client from '../models/client.models.js';
// Dans votre fichier de contrôleur pour les clients (ex: clients.controller.js)
export const addClient = async (req, res) => {
    try {
        const { first_name, last_name, cin, date_of_birth } = req.body;

        // Crée un nouveau client avec les données fournies
        const newClient = await Client.create({ first_name, last_name, cin, date_of_birth });

        // Répond avec un statut 201 (Created) et les données du nouveau client
        res.status(201).json(newClient);

    } catch (err) {
        // Gérer les erreurs
        if (err.code === 11000) { // Erreur de duplication de clé unique
            // Récupère le champ qui a causé la duplication pour un message plus précis
            const field = Object.keys(err.keyValue)[0];
            res.status(409).json({ error: `Le champ '${field}' existe déjà.` });
        } else {
            // Pour les autres erreurs (ex: validation de schéma)
            res.status(400).json({ error: err.message });
        }
    }
};

// Obtenir tous les clients
export const allClient = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;  
        const limit = parseInt(req.query.limit) || 10;  
        const skip = (page - 1) * limit;

        const clients = await Client.find()
            .sort({ createdAt: -1 })   // Tri par date décroissante
            .skip(skip)
            .limit(limit);
        const totalClient=await Client.countDocuments();

         const dailyStats = await Client.aggregate([
            // Étape 1 : Définir le format de la date pour le groupement (ex: "2023-10-27")
            // On groupe par la date du champ "createdAt"
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d", // Format année-mois-jour
                            date: "$createdAt"   // Champ sur lequel on base la date
                        }
                    },
                    // Étape 2 : Pour chaque groupe (chaque jour), on compte le nombre de clients
                    count: { $sum: 1 } // $sum: 1 ajoute 1 pour chaque document trouvé dans le groupe
                }
            },
            // Étape 3 : Trier les résultats par date du plus ancien au plus récent
            {
                $sort: { _id: 1 } // 1 pour ordre croissant, -1 pour décroissant
            },
            // (Optionnel) Étape 4 : Renommer le champ "_id" en "date" pour plus de clarté
            {
                $project: {
                    _id: 0,       // Ne pas inclure le champ _id par défaut
                    date: "$_id", // Créer un nouveau champ "date" à partir de "_id"
                    count: 1      // Garder le champ "count"
                }
            }
        ]);
        res.status(200).json({clients,totalClient,totalPages: Math.ceil(totalClient / limit),dailyStats});
    } catch (err) {
        res.status(500).json({ error: err.message }); // 500 est plus approprié pour une erreur serveur inattendue
    }
};

export const getClientById=async(req,res)=>{
    try{
        const {id}=req.params;
        
        const client=await Client.findById(id);
        if(!client){
             return res.status(404).json({ error: 'client non trouvée' }); 
        }
        res.status(200).json(client)
    } catch (err) {
        res.status(500).json({ error: err.message }); // 500 est plus approprié pour une erreur serveur inattendue
    }
}

export const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;

        // La ligne ci-dessous va automatiquement déclencher le middleware
        // qui supprimera aussi les permis associés. Vous n'avez rien d'autre à faire !
        const deletedClient = await Client.findByIdAndDelete(id);

        if (!deletedClient) {
            return res.status(404).json({ message: "Client non trouvé." });
        }

        res.status(200).json({ message: "Client et ses permis associés ont été supprimés avec succès." });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, cin, date_of_birth } = req.body;

        // CORRECTION : On passe `id` directement, pas un objet.
        const updatedClient = await Client.findByIdAndUpdate(
            id, 
            { first_name, last_name, cin, date_of_birth },
            { new: true, runValidators: true } // `runValidators: true` est une bonne pratique pour s'assurer que les nouvelles données respectent le schéma
        );

        if (!updatedClient) {
            return res.status(404).json({ message: "Client non trouvé." });
        }

        res.status(200).json(updatedClient); // Il est mieux de renvoyer l'objet mis à jour

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}