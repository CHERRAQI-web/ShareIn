import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Save,
  ArrowLeft,
  User,
  FileText,
  Percent,
  CheckCircle,
  XCircle,
  Search,
} from "lucide-react";

const API_URL = "https://sharein-production.up.railway.app/api";
const AI_SERVICE_URL = "http://localhost:5001";

const EditClientWithExtraction = () => {
  const { id } = useParams(); // Récupère l'ID du document depuis l'URL
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [documentType, setDocumentType] = useState(""); // Type de document (CIN, permis, etc.)
  const [clientId, setClientId] = useState(""); // ID du client associé
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

  // État pour les données du document
  const [documentData, setDocumentData] = useState({
    // Données client (pour CIN)
    first_name: "",
    last_name: "",
    cin: "",
    date_of_birth: "",
    address: "",

    // Données permis
    license_number: "",
    categorie: "",
    issue_date: "",
    expiry_date: "",

    // Données véhicule
    numero_immatriculation: "",
    marque: "",
    type: "",
    type_carburant: "",
    numero_chassis: "",

    // Statistiques communes
    stats: {
      average_ai_confidence: 0,
      is_human_validated: false,
      is_corrected_by_human: false,
    },
  });

  // État pour les fichiers
  const [selectedFiles, setSelectedFiles] = useState({
    recto: null,
    verso: null,
  });
  const [filePreviews, setFilePreviews] = useState({
    recto: null,
    verso: null,
  });

  useEffect(() => {
    const loadDocumentData = async () => {
      try {
        if (!id) {
          setMessage("Aucun ID de document fourni dans l'URL.");
          setLoading(false);
          return;
        }

        // Récupérer les stats
        const statsResponse = await axios.get(`${API_URL}/stats/${id}`);
        const stats = statsResponse.data;

        if (!stats) {
          setMessage("Aucune donnée trouvée pour cet ID.");
          setLoading(false);
          return;
        }

        console.log("Type de document détecté :", stats.document_type);
        setDocumentType(stats.document_type);
        setClientId(stats.client_id);

        // Initialiser les stats communes
        setDocumentData((prev) => ({
          ...prev,
          stats: {
            average_ai_confidence: stats.average_ai_confidence || 0,
            is_human_validated: stats.is_human_validated || false,
            is_corrected_by_human: stats.is_corrected_by_human || false,
          },
        }));

        // Récupérer les données du document en fonction du type
        if (stats.document_type === "CIN") {
          const clientResponse = await axios.get(
            `${API_URL}/clients/${stats.client_id}`
          );
          const client = clientResponse.data;

          setDocumentData((prev) => ({
            ...prev,
            first_name: client.first_name || "",
            last_name: client.last_name || "",
            cin: client.cin || "",
            date_of_birth: client.date_of_birth || "",
            address: client.address || "",
          }));
        } else if (stats.document_type === "PERMIS") {
          // CORRECTION : Utilisez la nouvelle route pour récupérer par client_id
          const licenseResponse = await axios.get(
            `${API_URL}/driving-licenses/client/${stats.client_id}`
          );
          const license = licenseResponse.data;

          setDocumentData((prev) => ({
            ...prev,
            license_number: license.license_number || "",
            categorie: license.categorie || "",
            issue_date: license.issue_date || "",
            expiry_date: license.expiry_date || "",
          }));
        } else if (stats.document_type === "CARTE GRISE") {
          // CORRECTION : Utilisez la nouvelle route pour récupérer par client_id
          const vehicleResponse = await axios.get(
            `${API_URL}/vehicule/client/${stats.client_id}`
          );
          const vehicle = vehicleResponse.data;

          setDocumentData((prev) => ({
            ...prev,
            numero_immatriculation: vehicle.numero_immatriculation || "",
            marque: vehicle.marque || "",
            type: vehicle.type || "",
            type_carburant: vehicle.type_carburant || "",
            numero_chassis: vehicle.numero_chassis || "",
          }));
        }

        setLoading(false);
      } catch (err) {
        console.error("Erreur lors du chargement des données :", err);
        setMessage(`Erreur : ${err.message}`);
        setLoading(false);
      }
    };

    loadDocumentData();
  }, [id]);

  const handleFileChange = (e, side) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFiles((prev) => ({
      ...prev,
      [side]: file,
    }));

    const reader = new FileReader();
    reader.onload = () => {
      setFilePreviews((prev) => ({
        ...prev,
        [side]: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  // Fonction d'extraction avec IA
  const extractWithAI = async () => {
    if (!selectedFiles.recto && !selectedFiles.verso) {
      setMessage("Veuillez sélectionner au moins une image du document.");
      return;
    }

    setExtracting(true);
    setMessage("Extraction des données en cours...");

    try {
      const form = new FormData();
      const documentTypeMapping = {
        CIN: "cin",
        PERMIS: "permis",
        "CARTE GRISE": "carte grise",
      };

      form.append(
        "document_type",
        documentTypeMapping[documentType] || documentType
      );
      if (selectedFiles.recto) form.append("file_recto", selectedFiles.recto);
      if (selectedFiles.verso) form.append("file_verso", selectedFiles.verso);

      const response = await fetch(`${AI_SERVICE_URL}/extract`, {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        throw new Error(`Échec de l'extraction (Code: ${response.status})`);
      }

      const data = await response.json();
      const stats = data.extraction_stats || { percentage: 0 };
      const { extraction_stats, ...extractedData } = data;

      // Mettre à jour les données du formulaire avec les données extraites
      setDocumentData((prev) => ({
        ...prev,
        ...extractedData,
        stats: {
          average_ai_confidence: stats.percentage || 0,
          is_human_validated: false,
          is_corrected_by_human: false,
        },
      }));

      setMessage(`Extraction réussie ! Précision: ${stats.percentage || 0}%`);
    } catch (error) {
      setMessage(`Erreur d'extraction: ${error.message}`);
      console.error(error);
    } finally {
      setExtracting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("stats.")) {
      const statField = name.split(".")[1];
      setDocumentData((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          [statField]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setDocumentData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); // Réinitialiser le message d'erreur
    try {
      // Mettre à jour les données en fonction du type de document
      if (documentType === "CIN") {
        console.log("Mise à jour du client ID:", clientId);
        await axios.put(`${API_URL}/clients/${clientId}`, {
          first_name: documentData.first_name,
          last_name: documentData.last_name,
          cin: documentData.cin,
          date_of_birth: documentData.date_of_birth,
          address: documentData.address,
        });
      } else if (documentType === "PERMIS") {
        console.log("Mise à jour du permis pour le client ID:", clientId);
        await axios.put(`${API_URL}/driving-licenses/client/${clientId}`, {
          license_number: documentData.license_number,
          categorie: documentData.categorie,
          issue_date: documentData.issue_date,
          expiry_date: documentData.expiry_date,
        });
      } else if (documentType === "CARTE GRISE") {
        console.log(
          "Mise à jour de la carte grise pour le client ID:",
          clientId
        );
        await axios.put(`${API_URL}/vehicule/client/${clientId}`, {
          numero_immatriculation: documentData.numero_immatriculation,
          marque: documentData.marque,
          type: documentData.type,
          type_carburant: documentData.type_carburant,
          numero_chassis: documentData.numero_chassis,
        });
      }

      // Mettre à jour les stats
      console.log("Mise à jour des stats pour l'ID:", id);
      await axios.put(`${API_URL}/stats/${id}`, {
        average_ai_confidence: documentData.stats.average_ai_confidence,
        is_human_validated: documentData.stats.is_human_validated,
        is_corrected_by_human: documentData.stats.is_corrected_by_human,
      });

      setMessage("Document mis à jour avec succès.");
      setTimeout(() => {
        navigate("/clients");
      }, 2000);
    } catch (err) {
      // --- AMÉLIORATION DE LA GESTION DES ERREURS ---
      console.error("Erreur complète lors de la mise à jour :", err);

      let errorMessage = "Erreur lors de la mise à jour du document.";

      if (err.response) {
        // Le serveur a répondu avec un statut d'erreur (4xx, 5xx)
        console.error("Détails de l'erreur du serveur :", err.response.data);
        errorMessage = `Erreur du serveur (${err.response.status}) : ${
          err.response.data.message ||
          err.response.data.error ||
          JSON.stringify(err.response.data)
        }`;
      } else if (err.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        console.error("Le serveur n'a pas répondu :", err.request);
        errorMessage =
          "Le serveur n'a pas répondu. Vérifiez que le backend est en cours d'exécution.";
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        console.error("Erreur de configuration de la requête :", err.message);
        errorMessage = `Erreur : ${err.message}`;
      }

      setMessage(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8 bg-gray-900 min-h-screen text-gray-100 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          <p className="mt-4 text-gray-400">Chargement des données...</p>
        </div>
      </div>
    );
  }

  // Rendre le formulaire en fonction du type de document
  const renderFormByType = () => {
    switch (documentType) {
      case "CIN":
        return (
          <>
            <div className="space-y-4">
              <h2 className="text-lg sm:text-xl font-semibold text-cyan-500 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Informations de la Carte d'Identité
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={documentData.first_name}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 text-white p-3 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={documentData.last_name}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 text-white p-3 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    CIN
                  </label>
                  <input
                    type="text"
                    name="cin"
                    value={documentData.cin}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 text-white p-3 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={
                      documentData.date_of_birth
                        ? new Date(documentData.date_of_birth)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 text-white p-3 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    required
                  />
                </div>
              </div>
            </div>
          </>
        );

      case "PERMIS":
        return (
          <>
            <div className="space-y-4">
              <h2 className="text-lg sm:text-xl font-semibold text-cyan-500 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Informations du Permis de Conduire
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Numéro de permis
                  </label>
                  <input
                    type="text"
                    name="license_number"
                    value={documentData.license_number}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 text-white p-3 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Catégorie
                  </label>
                  <input
                    type="text"
                    name="categorie"
                    value={documentData.categorie}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 text-white p-3 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date d'émission
                  </label>
                  <input
                    type="date"
                    name="issue_date"
                    value={
                      documentData.issue_date
                        ? new Date(documentData.issue_date)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 text-white p-3 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    required
                  />
                </div>{" "}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date d'expiration
                  </label>
                  <input
                    type="date"
                    name="expiry_date"
                    value={
                      documentData.expiry_date
                        ? new Date(documentData.expiry_date)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 text-white p-3 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    required
                  />
                </div>
              </div>
            </div>
          </>
        );

      case "CARTE GRISE":
        return (
          <>
            <div className="space-y-4">
              <h2 className="text-lg sm:text-xl font-semibold text-cyan-500 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Informations de la Carte Grise
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Numéro d'immatriculation
                  </label>
                  <input
                    type="text"
                    name="numero_immatriculation"
                    value={documentData.numero_immatriculation}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 text-white p-3 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Marque
                  </label>
                  <input
                    type="text"
                    name="marque"
                    value={documentData.marque}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 text-white p-3 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Type
                  </label>
                  <input
                    type="text"
                    name="type"
                    value={documentData.type}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 text-white p-3 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Type de carburant
                  </label>
                  <input
                    type="text"
                    name="type_carburant"
                    value={documentData.type_carburant}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 text-white p-3 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Numéro de châssis (VIN)
                  </label>
                  <input
                    type="text"
                    name="numero_chassis"
                    value={documentData.numero_chassis}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 text-white p-3 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    required
                  />
                </div>
              </div>
            </div>
          </>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            Type de document non reconnu.
          </div>
        );
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-gray-800 min-h-screen text-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6 sm:mb-8">
          <button
            onClick={() => navigate("/clients")}
            className="mr-4 p-2 rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-l sm:text-3xl font-extrabold text-white">
            Modifier{" "}
            {documentType === "CIN"
              ? "la Carte d'Identité"
              : documentType === "PERMIS"
              ? "le Permis de Conduire"
              : documentType === "CARTE GRISE"
              ? "la Carte Grise"
              : "le Document"}
          </h1>
        </div>

        {message && (
          <div
            className={`p-4 mb-6 rounded-lg ${
              message.includes("Erreur")
                ? "bg-red-800 text-red-200"
                : "bg-green-800 text-green-200"
            }`}
          >
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6"
        >
          {/* Section pour télécharger de nouvelles images */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-cyan-500 mb-4 flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Extraire les données depuis de nouvelles images
            </h2>

            <div
              className={`grid ${
                isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
              } gap-4 sm:gap-6 mb-6`}
            >
              {/* Section Recto */}
              <div className="relative group">
                <div
                  className={`border-2 ${
                    filePreviews.recto
                      ? "border-green-500 bg-green-900/20"
                : "border-dashed border-gray-600 bg-gray-700/50"
                  } p-3 sm:p-6 text-center rounded-xl transition-all duration-300 hover:border-blue-400 hover:bg-blue-50 overflow-hidden`}
                >
                  <label htmlFor="file-recto" className="cursor-pointer block">
                    {filePreviews.recto ? (
                      <div className="relative">
                        <img
                          src={filePreviews.recto}
                          alt="Aperçu Recto"
                          className="max-h-32 sm:max-h-48 mx-auto rounded-lg shadow-md"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                          <span className="text-white font-medium bg-blue-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                            Changer l'image
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 sm:py-8">
                        <div className="mx-auto w-12 sm:w-16 h-12 sm:h-16 bg-gray-700 rounded-full flex items-center justify-center mb-2 sm:mb-4">
                          <svg
                            className="w-6 sm:w-8 h-6 sm:h-8 text-cyan-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-cyan-500 font-semibold text-sm sm:text-lg mb-1">
                          RECTO
                        </p>
                        <p className="text-gray-500 text-xs sm:text-sm">
                          Cliquez pour télécharger une image
                        </p>
                      </div>
                    )}
                  </label>
                  <input
                    type="file"
                    id="file-recto"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, "recto")}
                  />
                  {selectedFiles.recto && (
                    <div className="mt-2 sm:mt-3 flex items-center justify-center">
                      <svg
                        className="w-3 sm:w-4 h-3 sm:h-4 text-green-500 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-xs text-gray-600 truncate max-w-full">
                        {selectedFiles.recto?.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section Verso */}
              <div className="relative group">
                <div
                  className={`border-2 ${
                    filePreviews.verso
                     ? "border-green-500 bg-green-900/20"
                : "border-dashed border-gray-600 bg-gray-700/50"
                  } p-3 sm:p-6 text-center rounded-xl transition-all duration-300 hover:border-blue-400 hover:bg-blue-50 overflow-hidden`}
                >
                  <label htmlFor="file-verso" className="cursor-pointer block">
                    {filePreviews.verso ? (
                      <div className="relative">
                        <img
                          src={filePreviews.verso}
                          alt="Aperçu Verso"
                          className="max-h-32 sm:max-h-48 mx-auto rounded-lg shadow-md"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                          <span className="text-white font-medium bg-blue-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                            Changer l'image
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 sm:py-8">
                        <div className="mx-auto w-12 sm:w-16 h-12 sm:h-16 bg-gray-700 rounded-full flex items-center justify-center mb-2 sm:mb-4">
                          <svg
                            className="w-6 sm:w-8 h-6 sm:h-8 text-cyan-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-cyan-500 font-semibold text-sm sm:text-lg mb-1">
                          VERSO
                        </p>
                        <p className="text-gray-500 text-xs sm:text-sm">
                          Cliquez pour télécharger une image
                        </p>
                      </div>
                    )}
                  </label>
                  <input
                    type="file"
                    id="file-verso"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, "verso")}
                  />
                  {selectedFiles.verso && (
                    <div className="mt-2 sm:mt-3 flex items-center justify-center">
                      <svg
                        className="w-3 sm:w-4 h-3 sm:h-4 text-green-500 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-xs text-gray-600 truncate max-w-full">
                        {selectedFiles.verso?.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={extractWithAI}
              disabled={
                (!selectedFiles.recto && !selectedFiles.verso) || extracting
              }
              className={`w-full py-2 sm:py-3 rounded-lg font-medium text-white transition-all duration-300 transform hover:scale-[1.02] text-sm sm:text-base ${
                extracting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-700 hover:to-cyan-600 shadow-md hover:shadow-lg"
              } ${
                !selectedFiles.recto && !selectedFiles.verso
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {extracting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Extraction en cours...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  Extraire les données par IA
                </span>
              )}
            </button>
          </div>

          <div className="border-t border-gray-700 pt-6">
            {renderFormByType()}

            {/* Section des statistiques (commune à tous les types) */}

            <div className="mt-6 sm:mt-8 flex justify-end">
              <button
                type="submit"
                className="flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-600 transition-colors text-sm sm:text-base"
              >
                <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClientWithExtraction;
