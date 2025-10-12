import React, { useState, useEffect } from "react";
import {
  Search,
  UserPlus,
  CheckCircle,
  XCircle,
  Edit,
  FileText,
  Download,
} from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";

const ClientsListDarkTheme = () => {
  // États
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statsData, setStatsData] = useState({ stats: [], clients: [] });
  const [licensesData, setLicensesData] = useState({ 
    driving_licenses: [], 
    clients: [],   
    vehicle_registrations: []  
  });
  const [vehiclesData, setVehiclesData] = useState([]);
  const [mergedData, setMergedData] = useState([]);
  const [mergedLicenses, setMergedLicenses] = useState([]);

  // Détecter la taille de l'écran
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Récupérer les données de stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/Stats");
        console.log("Réponse de l'API Stats :", response.data);
        setStatsData({
          stats: response.data.stats || [],
          clients: response.data.clients || [],
        });
      } catch (err) {
        setMessage("Erreur lors de la récupération des données des clients.");
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  // Récupérer les données des véhicules
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/vehicles");
        console.log("Réponse de l'API véhicules :", response.data);
        // Gestion robuste des données des véhicules
        let vehicleData = [];
        if (Array.isArray(response.data)) {
            vehicleData = response.data;
        } else if (response.data && Array.isArray(response.data.vehicules)) {
            vehicleData = response.data.vehicules;
        } else if (response.data && Array.isArray(response.data.vehicles)) {
            vehicleData = response.data.vehicles;
        }
        setVehiclesData(vehicleData);
      } catch (err) {
        console.error("Erreur lors de la récupération des données des véhicules:", err);
      }
    };
    fetchVehicles();
  }, []);

  // Récupérer les données des permis et cartes grises
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Récupérer les permis et les clients
        const licensesResponse = await axios.get("http://localhost:8080/api/driving-licenses");
        
        // Récupérer les cartes grises
        const vehiclesResponse = await axios.get("http://localhost:8080/api/vehicule");
        
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

  // Fusionner les données de stats avec les infos clients
  useEffect(() => {
    const clientMap = {};
    statsData.clients.forEach((client) => {
      clientMap[client._id] = client;
    });
    
    const merged = statsData.stats.map((stat) => ({
      ...stat,
      clientInfo: clientMap[stat.client_id] || null,
    }));
    
    setMergedData(merged);
  }, [statsData]);

  // Fusionner les données des permis avec les infos clients et véhicules
  useEffect(() => {
    if (!licensesData.driving_licenses.length && !licensesData.vehicle_registrations.length) {
        return;
    }

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

  // Filtrer les données selon le terme de recherche
  const filteredStats = mergedData.filter(
    (item) =>
      item.clientInfo?.first_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.clientInfo?.last_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.clientInfo?.cin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.document_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLicenses = Array.isArray(mergedLicenses)
    ? mergedLicenses.filter((license) => {
        const client = license.clientInfo;
        return (
          client?.first_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          client?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client?.cin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          license.license_number
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          license.categorie?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    : [];

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStats.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStats.length / itemsPerPage);

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("fr-FR");
  };

  // Fonction pour exporter TOUTES les données en CSV
  const exportToCSV = () => {
    setIsLoading(true);
    try {
      const headers = [
        "Nom et prénom", "Date de naissance", "Numéro CIN", "Permis N°", "Catégorie",
        "Date de délivrance", "Date d'expiration", "Numéro d'immatriculation", "Marque",
        "Type", "Type de carburant", "Numéro de chassis", "Document généré le"
      ];

      const csvRows = [];
      licensesData.clients.forEach((client) => {
        const licenses = licensesData.driving_licenses.filter(l => l.client_id === client._id);
        const vehicles = licensesData.vehicle_registrations.filter(v => v.client_id === client._id);

        if (licenses.length === 0 && vehicles.length === 0) {
          csvRows.push([`"${client.first_name} ${client.last_name}"`, `"${formatDate(client.date_of_birth)}"`, `"${client.cin}"`, "", "", "", "", "", "", "", "", `"${formatDate(new Date())}"`].join(","));
        } else if (licenses.length > 0 && vehicles.length === 0) {
          licenses.forEach((license) => {
            csvRows.push([`"${client.first_name} ${client.last_name}"`, `"${formatDate(client.date_of_birth)}"`, `"${client.cin}"`, `"${license.license_number || ''}"`, `"${license.categorie || ''}"`, `"${formatDate(license.issue_date)}"`, `"${formatDate(license.expiry_date)}"`, "", "", "", "", `"${formatDate(new Date())}"`].join(","));
          });
        } else if (licenses.length === 0 && vehicles.length > 0) {
          vehicles.forEach((vehicle) => {
            csvRows.push([`"${client.first_name} ${client.last_name}"`, `"${formatDate(client.date_of_birth)}"`, `"${client.cin}"`, "", "", "", "", `"${vehicle.numero_immatriculation || ''}"`, `"${vehicle.marque || ''}"`, `"${vehicle.type || ''}"`, `"${vehicle.type_carburant || ''}"`, `"${vehicle.numero_chassis || ''}"`, `"${formatDate(new Date())}"`].join(","));
          });
        } else {
          licenses.forEach((license) => {
            vehicles.forEach((vehicle) => {
              csvRows.push([`"${client.first_name} ${client.last_name}"`, `"${formatDate(client.date_of_birth)}"`, `"${client.cin}"`, `"${license.license_number || ''}"`, `"${license.categorie || ''}"`, `"${formatDate(license.issue_date)}"`, `"${formatDate(license.expiry_date)}"`, `"${vehicle.numero_immatriculation || ''}"`, `"${vehicle.marque || ''}"`, `"${vehicle.type || ''}"`, `"${vehicle.type_carburant || ''}"`, `"${vehicle.numero_chassis || ''}"`, `"${formatDate(new Date())}"`].join(","));
            });
          });
        }
      });

      const csvContent = [headers.join(","), ...csvRows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tous_les_clients_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setMessage("Exportation de tous les clients réussie.");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Erreur lors de l'exportation CSV.");
      console.error("Erreur d'exportation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const ValidationBadge = ({ value }) => {
    const badgeClasses = value
      ? "bg-green-900 text-green-200"
      : "bg-red-900 text-red-200";

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badgeClasses}`}
      >
        {value ? (
          <>
            <CheckCircle className="w-2 h-2 mr-1" />
            OUI
          </>
        ) : (
          <>
            <XCircle className="w-2 h-2 mr-1" />
            NON
          </>
        )}
      </span>
    );
  };

  // Vue Tableau pour desktop
  const TableView = () => (
    <div className="overflow-x-auto border border-gray-700 rounded-xl shadow-2xl shadow-black/50 bg-gray-800">
      <table className="min-w-full divide-y-2 divide-gray-700">
        <thead className="bg-gray-700">
          <tr className="*:font-extrabold *:text-white uppercase tracking-wider">
            <th className="px-5 py-4 whitespace-nowrap text-start text-xs">
              Nom et prénom
            </th>
            <th className="px-5 py-4 whitespace-nowrap text-start text-xs">
              type de documents
            </th>
            <th className="px-5 py-4 whitespace-nowrap text-start text-xs">
              Confiance IA
            </th>
            <th className="px-5 py-4 whitespace-nowrap text-start text-xs">
              {" "}
              validé par humain
            </th>
            <th className="px-5 py-4 whitespace-nowrap text-start text-xs">
              Corrigé par humain
            </th>
            <th className="px-5 py-4 whitespace-nowrap text-end text-xs">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-700">
          {currentItems.length > 0 ? (
            currentItems.map((item) => (
              <tr
                key={item._id}
                className="text-gray-200 hover:bg-gray-700/80 transition-colors duration-150"
              >
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="w-10 h-10 flex items-center justify-center rounded-full bg-cyan-500/20 text-cyan-500 font-bold mr-3 text-sm">
                      {item.clientInfo?.first_name?.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="font-semibold text-white">
                        {item.clientInfo?.first_name}{" "}
                        {item.clientInfo?.last_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        CIN: {item.clientInfo?.cin}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-400">
                  {item.document_type}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <p className="font-medium text-white">
                    {item.average_ai_confidence} %
                  </p>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <ValidationBadge value={item.is_human_validated} />
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <ValidationBadge value={item.is_corrected_by_human} />
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-end text-sm">
                  <Link
                    to={`/EditClient/${item._id}`}
                    className="text-cyan-500 hover:text-cyan-400 p-2 rounded-full hover:bg-gray-700 transition-colors mr-1 inline-block"
                  >
                    <Edit className="w-5 h-5" />
                  </Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="text-center py-8 text-gray-500">
                {message.includes("Erreur")
                  ? "Erreur de chargement."
                  : "Aucun client trouvé."}
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
        currentItems.map((item) => (
          <div
            key={item._id}
            className="bg-gray-900 rounded-xl shadow-xl border border-gray-700 p-4 hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <span className="w-12 h-12 flex items-center justify-center rounded-full bg-cyan-500/20 text-cyan-500 font-bold mr-3 text-base">
                  {item.clientInfo?.first_name?.charAt(0).toUpperCase()}
                </span>
                <div>
                  <h3 className="font-semibold text-white text-lg">
                    {item.clientInfo?.first_name} {item.clientInfo?.last_name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    CIN: {item.clientInfo?.cin}
                  </p>
                </div>
              </div>
              <Link
                to={`/EditClient/${item._id}`}
                className="text-cyan-500 hover:text-cyan-400 p-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                <Edit className="w-5 h-5" />
              </Link>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-300">
                <FileText className="w-4 h-4 mr-2 text-cyan-500" />
                <span className="font-medium mr-2">Type de document:</span>
                <span>{item.document_type}</span>
              </div>

              <div className="flex items-center text-gray-300">
                <span className="w-4 h-4 mr-2 text-cyan-500 flex items-center justify-center font-bold">
                  %
                </span>
                <span className="font-medium mr-2">Confiance IA:</span>
                <span>{item.average_ai_confidence}%</span>
              </div>

              <div className="flex items-center text-gray-300">
                <CheckCircle className="w-4 h-4 mr-2 text-cyan-500" />
                <span className="font-medium mr-2">Validé par humain:</span>
                <ValidationBadge value={item.is_human_validated} />
              </div>

              <div className="flex items-center text-gray-300">
                <Edit className="w-4 h-4 mr-2 text-cyan-500" />
                <span className="font-medium mr-2">Corrigé par humain:</span>
                <ValidationBadge value={item.is_corrected_by_human} />
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500 bg-gray-900 rounded-xl border border-gray-700">
          {message.includes("Erreur")
            ? "Erreur de chargement."
            : "Aucun client trouvé."}
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Préc
          </button>
          <span className="text-gray-300 text-sm">
            Page {currentPage} sur {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            Suiv
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-1"
            >
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
              className={`px-3 py-1 rounded-md ${
                currentPage === index + 1
                  ? "bg-cyan-500 text-black"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
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
    <div className="sm:p-8 bg-gray-800 dark:bg-black min-h-screen text-gray-100">
      <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-6 sm:mb-8 border-b pb-2 border-gray-700">
        Gestion des documents clients
      </h1>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4 p-4 bg-gray-900 rounded-xl shadow-2xl shadow-black/50">
        {/* Input */}
        <div className="relative w-full sm:w-2/3">
          <input
            type="text"
            placeholder="Rechercher par nom , cin , type de document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border-2 border-cyan-500/50 bg-gray-900 text-white p-3 pe-10 text-base shadow-inner focus:ring-cyan-500 focus:border-amber-500 transition-colors"
          />
          <span className="absolute inset-y-0 right-0 mr-3 grid w-10 place-content-center text-cyan-500">
            <Search className="h-5 w-5" />
          </span>
        </div>

        {/* Section pour les boutons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:w-1/3">
          <Link to="/form_client" className="w-full">
            <button className="w-full inline-flex items-center justify-center rounded-xl bg-cyan-600 px-4 sm:px-6 py-3 text-sm font-bold text-black shadow-xl shadow-cyan-600/40 transition-transform duration-300 hover:bg-cyan-400 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-cyan-400">
              <UserPlus className="w-5 h-5 mr-2" />
              Ajouter Client
            </button>
          </Link>

          <button
            onClick={exportToCSV}
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center rounded-xl bg-blue-800 px-4 sm:px-6 py-3 text-sm font-bold text-black shadow-xl shadow-blue-600/40 transition-transform duration-300 hover:bg-blue-500 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exportation...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Exporter CSV
              </>
            )}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 mb-4 rounded-lg ${
            message.includes("Erreur")
              ? "bg-red-800 text-red-200"
              : "bg-green-800 text-green-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* Afficher la vue appropriée selon la taille de l'écran */}
      {isMobile ? <CardView /> : <TableView />}

      <Pagination />
    </div>
  );
};

export default ClientsListDarkTheme;