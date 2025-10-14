import React, { useState, useEffect } from "react";
import { Search, UserPlus, Download, Trash2, FileText, Calendar, MapPin, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import ConfirmationModal from "../components/confirmation.jsx";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

const ClientsListDarkTheme = () => {
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null); 
  const [licensesData, setLicensesData] = useState({ driving_licenses: [], clients: [],   vehicle_registrations: []  });
  const [mergedLicenses, setMergedLicenses] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  // Détecter la taille de l'écran
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Récupérer les permis et les clients
        const licensesResponse = await axios.get("https://sharein-production.up.railway.app/api/driving-licenses");
        
        // Récupérer les cartes grises
        const vehiclesResponse = await axios.get("https://sharein-production.up.railway.app/api/vehicule");
        
        // --- DIAGNOSTIC 1 : Affichez la réponse brute de l'API véhicules ---
        console.log("Réponse brute de l'API véhicules:", vehiclesResponse.data);

        // Gestion robuste des données des véhicules
        let vehicleData = [];
        if (Array.isArray(vehiclesResponse.data)) {
            vehicleData = vehiclesResponse.data;
        } else if (vehiclesResponse.data && Array.isArray(vehiclesResponse.data.vehicules)) {
            vehicleData = vehiclesResponse.data.vehicules;
        } else if (vehiclesResponse.data && Array.isArray(vehiclesResponse.data.vehicles)) {
            vehicleData = vehiclesResponse.data.vehicles;
        } else {
            console.warn("Format de réponse de l'API véhicules inattendu :", vehiclesResponse.data);
        }
        
        // --- DIAGNOSTIC 2 : Affichez les données des véhicules après traitement ---
        console.log("Données des véhicules traitées:", vehicleData);

        const dataToSet = {
          driving_licenses: Array.isArray(licensesResponse.data.driving_licenses) ? licensesResponse.data.driving_licenses : [],
          clients: Array.isArray(licensesResponse.data.clients) ? licensesResponse.data.clients : [],
          vehicle_registrations: vehicleData,
        };
        setLicensesData(dataToSet);

      } catch (err) {
        setMessage("Erreur lors de la récupération des données.");
        console.error("Erreur API:", err);
      }
    };
    fetchAllData();
  }, []);
  
useEffect(() => {
    // Si les données ne sont pas encore chargées, ne rien faire
    if (!licensesData.driving_licenses.length && !licensesData.vehicle_registrations.length) {
        return;
    }

    // --- DÉBUT DU DIAGNOSTIC INTÉGRÉ ---
    console.log("========== DÉBUT DU DIAGNOSTIC DE LIAISON ==========");
    
    // 1. Afficher les clients
    console.log("1. Liste des CLIENTS disponibles :");
    licensesData.clients.forEach(c => {
        console.log(`   - Nom: ${c.first_name} ${c.last_name}, _id: ${c._id}, CIN: ${c.cin}`);
    });

    // 2. Afficher les véhicules
    console.log("\n2. Liste des VÉHICULES disponibles :");
    licensesData.vehicle_registrations.forEach(v => {
        console.log(`   - Immatriculation: ${v.numero_immatriculation}, client_id: ${v.client_id}`);
    });
    console.log("========== FIN DU DIAGNOSTIC ==========");
    // --- FIN DU DIAGNOSTIC INTÉGRÉ ---

    // --- LOGIQUE DE FUSION (inchangée) ---
    const clientMap = licensesData.clients.reduce((map, client) => {
      map[client._id] = client;
      return map;
    }, {});

    const vehicleMap = {};
    licensesData.vehicle_registrations.forEach(vehicle => {
      if (!vehicle.client_id) {
          console.warn("Un véhicule n'a pas de client_id:", vehicle);
          return;
      }
      if (!vehicleMap[vehicle.client_id]) {
        vehicleMap[vehicle.client_id] = [];
      }
      vehicleMap[vehicle.client_id].push(vehicle);
    });

    const merged = licensesData.driving_licenses.map(license => {
      return {
        ...license,
        clientInfo: clientMap[license.client_id] || null,
        vehicles: vehicleMap[license.client_id] || []
      };
    });

    setMergedLicenses(merged);
  }, [licensesData]);

  // Filtrer les permis fusionnés
  
  const filteredLicenses = Array.isArray(mergedLicenses)
    ? mergedLicenses.filter(
        (license) => {
          const client = license.clientInfo;
          return (
            client?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client?.cin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            license.license_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            license.categorie?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
      )
    : [];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLicenses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLicenses.length / itemsPerPage);

  // Fonction pour exporter les données en CSV


const exportClientToWord = async (clientId) => {
    try {
      // On filtre pour trouver les licences du client
      const clientLicenses = mergedLicenses.filter(
        (license) => license.client_id === clientId
      );

      if (!clientLicenses || clientLicenses.length === 0) {
        setMessage("Aucune information trouvée pour ce client.");
        setTimeout(() => setMessage(""), 3000);
        return;
      }
      
      const clientInfo = clientLicenses[0].clientInfo;
      const clientVehicles = clientLicenses[0].vehicles || [];

      // Création des paragraphes pour les permis
      const licenseParagraphs = clientLicenses.flatMap((license) => [
        new Paragraph({
          children: [new TextRun({ text: `Permis N°: ${license.license_number || "N/A"}`, bold: true, size: 22, color: "FF9900" })],
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({ children: [new TextRun({ text: "Catégorie: ", bold: true, size: 22 }), new TextRun({ text: license.categorie || "N/A", size: 22 })], spacing: { after: 150 } }),
        new Paragraph({ children: [new TextRun({ text: "Date de délivrance: ", bold: true, size: 22 }), new TextRun({ text: license.issue_date ? new Date(license.issue_date).toLocaleDateString("fr-FR") : "N/A", size: 22 })], spacing: { after: 150 } }),
        new Paragraph({ children: [new TextRun({ text: "Date d'expiration: ", bold: true, size: 22 }), new TextRun({ text: license.expiry_date ? new Date(license.expiry_date).toLocaleDateString("fr-FR") : "N/A", size: 22 })], spacing: { after: 400 } }),
      ]);

      // Création des paragraphes pour les véhicules
      let vehicleParagraphs = [];
      if (Array.isArray(clientVehicles) && clientVehicles.length > 0) {
        vehicleParagraphs = clientVehicles.flatMap((vehicle, index) => [
          new Paragraph({
            children: [new TextRun({ text: `Véhicule ${index + 1}`, bold: true, size: 22, color: "FF9900" })],
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({ children: [new TextRun({ text: "Numéro d'immatriculation: ", bold: true, size: 22 }), new TextRun({ text: vehicle.numero_immatriculation || "N/A", size: 22 })], spacing: { after: 150 } }),
          new Paragraph({ children: [new TextRun({ text: "Marque: ", bold: true, size: 22 }), new TextRun({ text: vehicle.marque || "N/A", size: 22 })], spacing: { after: 150 } }),
          new Paragraph({ children: [new TextRun({ text: "Type: ", bold: true, size: 22 }), new TextRun({ text: vehicle.type || "N/A", size: 22 })], spacing: { after: 150 } }),
          new Paragraph({ children: [new TextRun({ text: "Type de carburant: ", bold: true, size: 22 }), new TextRun({ text: vehicle.type_carburant || "N/A", size: 22 })], spacing: { after: 150 } }),
          // CORRECTION : L'accolade en trop a été retirée et la parenthèse est bien placée.
          new Paragraph({ 
            children: [new TextRun({ text: "Numéro de chassis: ", bold: true, size: 22 }), new TextRun({ text: vehicle.numero_chassis || "N/A", size: 22 })], 
            spacing: { after: 400 } 
          }),
        ]);
      } else {
        vehicleParagraphs.push(new Paragraph({ 
          children: [new TextRun({ text: "Aucun véhicule enregistré pour ce client.", italics: true, size: 22 })], 
          spacing: { before: 300 } 
        }));
      }

      const doc = new Document({
        sections: [{ properties: {}, children: [
          new Paragraph({ children: [new TextRun({ text: "FICHE CLIENT, PERMIS ET CARTES GRISES", bold: true, size: 32, color: "FF9900" })], heading: HeadingLevel.TITLE, alignment: "center", spacing: { after: 400 } }),
          new Paragraph({ children: [new TextRun({ text: "Nom et prénom: ", bold: true, size: 24 }), new TextRun({ text: `${clientInfo.first_name || ""} ${clientInfo.last_name || ""}`, size: 24 })], spacing: { after: 200 } }),
          new Paragraph({ children: [new TextRun({ text: "Date de naissance: ", bold: true, size: 24 }), new TextRun({ text: clientInfo.date_of_birth ? new Date(clientInfo.date_of_birth).toLocaleDateString("fr-FR") : "Non spécifiée", size: 24 })], spacing: { after: 200 } }),
          new Paragraph({ children: [new TextRun({ text: "Numéro CIN: ", bold: true, size: 24 }), new TextRun({ text: clientInfo.cin || "Non spécifié", size: 24 })], spacing: { after: 200 } }),
          new Paragraph({ children: [new TextRun({ text: "Liste des permis de conduire", bold: true, size: 28, underline: {} })], heading: HeadingLevel.HEADING_2, spacing: { after: 300 } }),
          ...licenseParagraphs,
          new Paragraph({ children: [new TextRun({ text: "Liste des véhicules (Cartes Grises)", bold: true, size: 28, underline: {} })], heading: HeadingLevel.HEADING_2, spacing: { after: 300 } }),
          ...vehicleParagraphs,
          new Paragraph({ children: [new TextRun({ text: `Document généré le ${new Date().toLocaleDateString("fr-FR")}`, italics: true, size: 20, color: "999999" })], alignment: "center", spacing: { before: 800 } }),
        ]}],
      });

      const blob = await Packer.toBlob(doc);
      const fileName = `fiche_complete_${clientInfo.first_name}_${clientInfo.last_name}_${new Date().toISOString().slice(0, 10)}.docx`;
      saveAs(blob, fileName);

      setMessage("Fiche client complète exportée avec succès.");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Erreur détaillée lors de l'exportation Word:", error);
      setMessage(`Erreur lors de l'exportation: ${error.message || "Erreur inconnue."}`);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  // Fonctions de suppression
  const confirmDelete = async () => {
    try {
      console.log("ID du client à supprimer:", clientToDelete);
      await axios.delete(`sharein-production.up.railway.app/api/clients/${clientToDelete}`);
      
      setMergedLicenses(prevLicenses => 
        prevLicenses.filter(license => license.client_id !== clientToDelete)
      );
      
      setLicensesData(prevData => ({
        ...prevData,
        clients: prevData.clients.filter(c => c._id !== clientToDelete),
        driving_licenses: prevData.driving_licenses.filter(l => l.client_id !== clientToDelete)
      }));

      setMessage("Client et ses permis associés supprimés avec succès.");
      setTimeout(() => setMessage(""), 3000);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setMessage("Erreur lors de la suppression du client.");
      setTimeout(() => setMessage(""), 3000);
      setIsModalOpen(false);
    }
  };

  const cancelDelete = () => {
    setIsModalOpen(false);
    setClientToDelete(null);
  };

  const handleDelete = (clientId) => {
    setClientToDelete(clientId);
    setIsModalOpen(true);
  };

  // Vue Tableau pour desktop
  const TableView = () => (
    <div className="overflow-x-auto border border-gray-700 rounded-xl shadow-2xl shadow-black/50 bg-gray-800">
      <table className="min-w-full divide-y-2 divide-gray-700">
        <thead className="bg-gray-700">
          <tr className="*:font-extrabold *:text-white uppercase tracking-wider">
            <th className="px-5 py-4 whitespace-nowrap text-start text-xs">Client</th>
            <th className="px-5 py-4 whitespace-nowrap text-start text-xs">N° CIN</th>
            <th className="px-5 py-4 whitespace-nowrap text-start text-xs">Date de naissance</th>
            <th className="px-5 py-4 whitespace-nowrap text-start text-xs">N° permis</th>
            <th className="px-5 py-4 whitespace-nowrap text-end text-xs">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-700">
          {currentItems.length > 0 ? (
            currentItems.map((license) => (
              <tr key={license._id} className="text-gray-200 hover:bg-gray-700/80 transition-colors duration-150">
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="w-10 h-10 flex items-center justify-center rounded-full bg-cyan-500/20 text-cyan-500 font-bold mr-3 text-sm">
                      {license.clientInfo?.first_name?.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="font-semibold text-white">{license.clientInfo?.first_name} {license.clientInfo?.last_name}</p>
                      <p className="text-xs text-gray-400">{license.clientInfo?.cin}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap"><p className="font-medium text-white">{license.clientInfo?.cin}</p></td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-semibold ">
                    {new Date(license.clientInfo?.date_of_birth).toLocaleDateString("fr-FR")}
                  </span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-400 ">
                  <span className="rounded-full bg-blue-900 text-blue-300 py-1 px-2">{license.license_number}</span></td>
                <td className="px-5 py-4 whitespace-nowrap text-end text-sm">
                  <button onClick={() => handleDelete(license.client_id)} className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-gray-700 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => exportClientToWord(license.client_id)} className="text-blue-500 hover:text-blue-400 p-2 rounded-full hover:bg-gray-700 transition-colors ml-2" title="Exporter la fiche complète en Word">
                    <Download className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center py-8 text-gray-500">
                {message.includes("Erreur") ? "Erreur de chargement." : "Aucun client trouvé."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  // Vue Carte pour mobile
  const CardView = () => (
    <div className="space-y-4">
      {currentItems.length > 0 ? (
        currentItems.map((license) => (
          <div key={license._id} className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-4 hover:bg-gray-750 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <span className="w-12 h-12 flex items-center justify-center rounded-full bg-amber-500/20 text-amber-500 font-bold mr-3 text-base">
                  {license.clientInfo?.first_name?.charAt(0).toUpperCase()}
                </span>
                <div>
                  <h3 className="font-semibold text-white text-lg">{license.clientInfo?.first_name} {license.clientInfo?.last_name}</h3>
                  <p className="text-sm text-gray-400">{license.clientInfo?.cin}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => handleDelete(license.client_id)} className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-gray-700 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
                <button onClick={() => exportClientToWord(license.client_id)} className="text-blue-500 hover:text-blue-400 p-2 rounded-full hover:bg-gray-700 transition-colors" title="Exporter la fiche complète en Word">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-300">
                <CreditCard className="w-4 h-4 mr-2 text-cyan-500" />
                <span className="font-medium mr-2">N° CIN:</span>
                <span>{license.clientInfo?.cin}</span>
              </div>
              
              <div className="flex items-center text-gray-300">
                <Calendar className="w-4 h-4 mr-2 text-cyan-500" />
                <span className="font-medium mr-2">Date de naissance:</span>
                <span>{new Date(license.clientInfo?.date_of_birth).toLocaleDateString("fr-FR")}</span>
              </div>
              
              <div className="flex items-start text-gray-300">
                <MapPin className="w-4 h-4 mr-2 text-cyan-500 mt-0.5" />
                <span className="font-medium mr-2">Adresse:</span>
                <span className="flex-1">{license.license_number}</span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500 bg-gray-800 rounded-xl border border-gray-700">
          {message.includes("Erreur") ? "Erreur de chargement." : "Aucun client trouvé."}
        </div>
      )}
    </div>
  );

  // Pagination responsive
  const Pagination = () => {
    if (totalPages <= 1) return null;
    
    if (isMobile) {
      return (
        <div className="flex justify-between items-center mt-6 px-2">
          <button 
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} 
            disabled={currentPage === 1} 
            className="px-3 py-1 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Préc
          </button>
          <span className="text-gray-300 text-sm">
            Page {currentPage} sur {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} 
            disabled={currentPage === totalPages} 
            className="px-3 py-1 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            Suiv
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      );
    }
    
    return (
      <div className="flex justify-center mt-6">
        <nav className="flex items-center space-x-2">
          <button 
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} 
            disabled={currentPage === 1} 
            className="px-3 py-1 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <button 
              key={index} 
              onClick={() => setCurrentPage(index + 1)} 
              className={`px-3 py-1 rounded-md ${currentPage === index + 1 ? "bg-amber-500 text-black" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
            >
              {index + 1}
            </button>
          ))}
          <button 
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} 
            disabled={currentPage === totalPages} 
            className="px-3 py-1 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </nav>
      </div>
    );
  };

  return (
    <div className=" sm:p-8 bg-gray-800 dark:bg-black min-h-screen text-gray-100">
      <h1 className="text-l sm:text-4xl font-extrabold text-white mb-6 sm:mb-8 border-b pb-2 border-gray-700">
        Gestion des Clients
      </h1>

   <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:gap-4 mb-6 sm:mb-8 p-4 bg-gray-900 rounded-xl shadow-2xl shadow-black/50">
  <div className="relative flex-1">  {/* L'input prend 2/3 de l'espace */}
    <input
      type="text"
      placeholder="Rechercher par nom, CIN, N° permis..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full rounded-lg border-2 border-cyan-500/50 bg-gray-900 text-white p-3 pe-10 text-base shadow-inner focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
    />
    <span className="absolute inset-y-0 right-0 mr-3 grid w-10 place-content-center text-cyan-500">
      <Search className="h-5 w-5" />
    </span>
  </div>

  <Link to="/form_client" className="flex-2">  {/* Le bouton prend 1/3 de l'espace */}
    <button className="w-full inline-flex items-center justify-center rounded-xl bg-cyan-500 px-4 sm:px-6 py-3 text-sm font-bold text-black shadow-xl shadow-cyan-500/40 transition-transform duration-300 hover:bg-cyan-400 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-cyan-300">
      <UserPlus className="w-5 h-5 mr-2" />
      Ajouter Client
    </button>
  </Link>
</div>



      {message && (
        <div className={`p-4 mb-4 rounded-lg ${message.includes("Erreur") ? "bg-red-800 text-red-200" : "bg-green-800 text-green-200"}`}>
          {message}
        </div>
      )}

      {/* Afficher la vue appropriée selon la taille de l'écran */}
      {isMobile ? <CardView /> : <TableView />}
      
      <Pagination />

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Suppression du client"
        message={`Êtes-vous sûr de vouloir supprimer le client ${licensesData.clients.find(c => c._id === clientToDelete)?.first_name} ${licensesData.clients.find(c => c._id === clientToDelete)?.last_name} ? Cette action est irréversible et supprimera également tous ses permis associés.`}
        confirmText="Oui, supprimer"
        cancelText="Annuler"
      />
    </div>
  );
};

export default ClientsListDarkTheme;