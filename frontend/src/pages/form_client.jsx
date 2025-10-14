import React, { useState, useCallback } from "react";
import axios from "axios";
// Constantes pour les URLs
const API_URL = "https://sharein-production.up.railway.app/api";
const AI_SERVICE_URL = "https://honest-connection-production-1b35.up.railway.app/";
import TabContent from '../components/tabContent.jsx';
// import renderFinalSummary from '../components/renderFinalSummary.jsx' // Problème: ce composant n'est pas fourni

// Définition des étapes/onglets
const TABS = [
  {
    id: "cin-section",
    label: "Carte d'Identité (CIN)",
    type: "client",
    nextTab: "license-section",
  },
  {
    id: "license-section",
    label: "Permis de Conduire",
    type: "driving-license",
    nextTab: "vehicle-section",
  },
  {
    id: "vehicle-section",
    label: "Carte Grise",
    type: "vehicle-registration",
    nextTab: "unified-section",
  },
  {
    id: "unified-section",
    label: "Récapitulatif et Validation",
    type: "unified",
    nextTab: null,
  },
];

const Client = () => {
  // États du composant
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [completedSteps, setCompletedSteps] = useState({
    client: false,
    "driving-license": false,
    "vehicle-registration": false,
  });
  const [resultMessage, setResultMessage] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Détecter la taille de l'écran
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // État pour les données des formulaires (pour chaque onglet)
  const [formData, setFormData] = useState({
    client: {
      first_name: "",
      last_name: "",
      cin: "",
      date_of_birth: "",
      address: "",
      stats: {
        average_ai_confidence: 0,
        is_corrected_by_human: false,
      },
    },
    "driving-license": {
      license_number: "",
      categorie: "",
      issue_date: "",
      expiry_date: "",
      stats: {
        average_ai_confidence: 0,
        is_corrected_by_human: false,
      },
    },
    "vehicle-registration": {
      numero_immatriculation: "",
      marque: "",
      type: "",
      type_carburant: "",
      numero_chassis: "",
      stats: {
        average_ai_confidence: 0,
        is_corrected_by_human: false,
      },
    },
  });

  // État pour stocker les données finales validées
  const [finalSubmissionData, setFinalSubmissionData] = useState({
    client: null,
    "driving-license": null,
    "vehicle-registration": null,
  });

  const [selectedFiles, setSelectedFiles] = useState({
    cin: { recto: null, verso: null },
    license: { recto: null, verso: null },
    vehicle: { recto: null, verso: null },
  });
  const [filePreviews, setFilePreviews] = useState({
    cin: { recto: null, verso: null },
    license: { recto: null, verso: null },
    vehicle: { recto: null, verso: null },
  });

  // États pour le chargement et la soumission finale
  const [isSavingAll, setIsSavingAll] = useState(false);
  // Ajout d'un état pour suivre l'extraction en cours
  const [isExtracting, setIsExtracting] = useState({
    client: false,
    "driving-license": false,
    "vehicle-registration": false,
  });

  // --- Fonctions de gestion ---
  const handleTabChange = useCallback(
    (tabId) => {
      const tabIndex = TABS.findIndex((t) => t.id === tabId);
      const currentTabIndex = TABS.findIndex((t) => t.id === activeTab);
      if (
        tabIndex <= currentTabIndex ||
        (tabIndex > 0 && completedSteps[TABS[tabIndex - 1].type])
      ) {
        setActiveTab(tabId);
        setResultMessage("");
      } else {
        setResultMessage(
          <strong className="text-red-400">
            Veuillez compléter l'étape précédente avant de continuer.
          </strong>
        );
      }
    },
    [activeTab, completedSteps]
  );

  const handleFormChange = useCallback((e, type) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [name]: value,
        // Marquer que le champ a été modifié par l'homme
        stats: {
          ...prev[type].stats,
          is_corrected_by_human: true,
        },
      },
    }));
  }, []);

  const handleFileChange = (e, tabId, side) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFiles((prev) => ({
      ...prev,
      [tabId]: { ...prev[tabId], [side]: file },
    }));
    const reader = new FileReader();
    reader.onload = () => {
      setFilePreviews((prev) => ({
        ...prev,
        [tabId]: { ...prev[tabId], [side]: reader.result },
      }));
    };
    reader.readAsDataURL(file);
  };

  // --- Fonction d'extraction ---
  const extractWithAI = async (documentType) => {
    const documentTypeMap = {
      client: "cin",
      "driving-license": "license",
      "vehicle-registration": "vehicle",
    };
    const fileTypeKey = documentTypeMap[documentType];
    if (!fileTypeKey) {
      setResultMessage(
        <div className="text-red-400">
          <strong>Erreur:</strong> Type de document inconnu.
        </div>
      );
      return;
    }

    const rectoFile = selectedFiles[fileTypeKey]?.recto;
    const versoFile = selectedFiles[fileTypeKey]?.verso;
    if (!rectoFile && !versoFile) {
      alert("Veuillez choisir au moins une image...");
      return;
    }

    // Activer l'état d'extraction pour ce type de document
    setIsExtracting(prev => ({ ...prev, [documentType]: true }));
    
    setResultMessage(
      <div className="text-center text-blue-400">Extraction en cours...</div>
    );
    const form = new FormData();
    const documentTypeMapping = { 
      client: "cin", 
      "driving-license": "permis",
      "vehicle-registration": "carte grise"
    };
    form.append(
      "document_type",
      documentTypeMapping[documentType] || documentType
    );
    if (rectoFile) form.append("file_recto", rectoFile);
    if (versoFile) form.append("file_verso", versoFile);

    try {
      const response = await fetch(`${AI_SERVICE_URL}/extract`, {
        method: "POST",
        body: form,
      });
      if (!response.ok) {
        let errorMessage = `Échec de la connexion au service IA (Code: ${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          console.error(
            "La réponse d'erreur du serveur n'était pas du JSON:",
            jsonError
          );
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();

      // Mettre à jour les données du formulaire avec les données extraites
      // et conserver les statistiques d'extraction
      const stats = data.extraction_stats || { percentage: 0 };
      const { extraction_stats, ...extractedData } = data;

      setFormData((prev) => ({
        ...prev,
        [documentType]: {
          ...prev[documentType],
          ...extractedData,
          stats: {
            average_ai_confidence: stats.percentage || 0,
            is_corrected_by_human: false,
          },
        },
      }));

      setResultMessage(
        <div className="text-green-400">
          <strong>Extraction réussie !</strong>
          <div className="text-sm mt-1">
            Précision: {stats.percentage || 0}% ({stats.found_count || 0}/
            {stats.total_fields || 0} champs trouvés)
          </div>
        </div>
      );
    } catch (error) {
      setResultMessage(
        <div className="text-red-400">
          <strong>Erreur d'extraction:</strong> {error.message}
        </div>
      );
    } finally {
      // Désactiver l'état d'extraction pour ce type de document
      setIsExtracting(prev => ({ ...prev, [documentType]: false }));
    }
  };

  // --- Fonction pour valider les données d'une étape ---
  const validateStep = (type) => {
    const dataToValidate = formData[type];
    let isValid = true;
    let errorMessage = "";

    if (type === "client") {
      if (
        !dataToValidate.first_name ||
        !dataToValidate.last_name ||
        !dataToValidate.cin ||
        !dataToValidate.date_of_birth ||
        !dataToValidate.address
      ) {
        isValid = false;
        errorMessage =
          "Veuillez remplir tous les champs obligatoires du client.";
      }
    } else if (type === "driving-license") {
      if (
        !dataToValidate.categorie ||
        !dataToValidate.license_number ||
        !dataToValidate.issue_date ||
        !dataToValidate.expiry_date
      ) {
        isValid = false;
        errorMessage =
          "Veuillez remplir tous les champs obligatoires du permis.";
      }
    } else if (type === "vehicle-registration") {
      if (
        !dataToValidate.numero_immatriculation ||
        !dataToValidate.marque ||
        !dataToValidate.type ||
        !dataToValidate.type_carburant ||
        !dataToValidate.numero_chassis
      ) {
        isValid = false;
        errorMessage =
          "Veuillez remplir tous les champs obligatoires de la carte grise.";
      }
    }

    if (!isValid) {
      setResultMessage(
        <strong className="text-red-400">{errorMessage}</strong>
      );
      return;
    }

    setFinalSubmissionData((prev) => ({ ...prev, [type]: dataToValidate }));
    setCompletedSteps((prev) => ({ ...prev, [type]: true }));
    setResultMessage(
      <strong className="text-green-400">Étape validée avec succès !</strong>
    );
  };

  // --- Fonction pour sauvegarder toutes les données dans la base de données ---
  const saveAllData = async () => {
    setIsSavingAll(true);
    setResultMessage(
      <div className="text-center text-blue-400">
        Sauvegarde en cours, veuillez patienter...
      </div>
    );

    // --- DÉBUT DE LA CORRECTION ---
    // Ajout d'une vérification de sécurité pour s'assurer que toutes les données sont prêtes
    if (!finalSubmissionData.client || !finalSubmissionData["driving-license"] || !finalSubmissionData["vehicle-registration"]) {
        setResultMessage(
            <div className="text-red-400">
                <strong>Erreur de sauvegarde:</strong> Veuillez valider toutes les étapes avant de sauvegarder.
            </div>
        );
        setIsSavingAll(false);
        return;
    }
    // --- FIN DE LA CORRECTION ---

    try {
      // 1. Créer le client et récupérer son ID MongoDB
      console.log("Données client à envoyer:", finalSubmissionData.client);

      const clientResponse = await axios.post(
        `${API_URL}/clients`,
        finalSubmissionData.client,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Réponse du serveur pour le client:", clientResponse.data);

      // Vérifier si la réponse contient l'ID attendu
      if (!clientResponse.data || !clientResponse.data._id) {
        throw new Error(
          "La réponse du serveur ne contient pas d'ID client valide"
        );
      }

      const newClient = clientResponse.data;
      const clientId = newClient._id; // ID MongoDB du client

      // 2. Créer le permis de conduire en le liant au client via son ID
      if (finalSubmissionData["driving-license"]) {
        console.log("Données du permis à envoyer:", {
          ...finalSubmissionData["driving-license"],
          client_id: clientId,
        });

        const licenseResponse = await axios.post(
          `${API_URL}/driving-licenses`,
          {
            ...finalSubmissionData["driving-license"],
            client_id: clientId,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Réponse du serveur pour le permis:", licenseResponse.data);
      }

      // 3. Créer la carte grise en la liant au client via son ID
      if (finalSubmissionData["vehicle-registration"]) {
        console.log("Données de la carte grise à envoyer:", {
          ...finalSubmissionData["vehicle-registration"],
          client_id: clientId,
        });

        const vehicleResponse = await axios.post(
          `${API_URL}/vehicule`,
          {
            ...finalSubmissionData["vehicle-registration"],
            client_id: clientId,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Réponse du serveur pour la carte grise:", vehicleResponse.data);
      }

      // 4. Sauvegarder les statistiques d'extraction avec les bonnes valeurs pour document_type
      if (finalSubmissionData.client && finalSubmissionData.client.stats) {
        await axios.post(`${API_URL}/stats`, {
          client_id: clientId,
          document_type: "CIN", // Correction: utilisation de la valeur attendue par le modèle
          average_ai_confidence:
            finalSubmissionData.client.stats.average_ai_confidence,
          is_human_validated: true,
          is_corrected_by_human:
            finalSubmissionData.client.stats.is_corrected_by_human,
        });
      }

      if (
        finalSubmissionData["driving-license"] &&
        finalSubmissionData["driving-license"].stats
      ) {
        await axios.post(`${API_URL}/stats`, {
          client_id: clientId,
          document_type: "PERMIS", // Correction: utilisation de la valeur attendue par le modèle
          average_ai_confidence:
            finalSubmissionData["driving-license"].stats.average_ai_confidence,
          is_human_validated: true,
          is_corrected_by_human:
            finalSubmissionData["driving-license"].stats.is_corrected_by_human,
        });
      }

      if (
        finalSubmissionData["vehicle-registration"] &&
        finalSubmissionData["vehicle-registration"].stats
      ) {
        await axios.post(`${API_URL}/stats`, {
          client_id: clientId,
          document_type: "carte grise", // Utilisation de la valeur attendue par le modèle
          average_ai_confidence:
            finalSubmissionData["vehicle-registration"].stats.average_ai_confidence,
          is_human_validated: true,
          is_corrected_by_human:
            finalSubmissionData["vehicle-registration"].stats.is_corrected_by_human,
        });
      }

      setResultMessage(
        <strong className="text-green-400">
          Toutes les données ont été sauvegardées avec succès !
        </strong>
      );
    } catch (error) {
      // Amélioration de la gestion des erreurs
      let errorMessage = "Une erreur inconnue est survenue.";

      if (error.response) {
        // Le serveur a répondu avec un statut d'erreur
        console.error("Erreur de réponse du serveur:", error.response.data);
        console.error("Statut:", error.response.status);

        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        } else {
          errorMessage = `Erreur du serveur (Code: ${error.response.status})`;
        }
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        console.error("Erreur de requête:", error.request);
        errorMessage = "Le serveur n'a pas répondu. Vérifiez votre connexion.";
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        console.error("Erreur de configuration:", error.message);
        errorMessage = error.message;
      }

      setResultMessage(
        <div className="text-red-400">
          <strong>Erreur de sauvegarde:</strong> {errorMessage}
        </div>
      );
    } finally {
      setIsSavingAll(false);
    }
  };


  // Navigation par onglets pour mobile
  const MobileTabNavigation = () => (
    <div className="flex flex-col sm:hidden">
      <div className="flex justify-between items-center mb-4 bg-gray-800 rounded-lg p-1 border border-gray-700">
        <button
          onClick={() => {
            const currentIndex = TABS.findIndex(t => t.id === activeTab);
            if (currentIndex > 0) {
              handleTabChange(TABS[currentIndex - 1].id);
            }
          }}
          disabled={activeTab === TABS[0].id}
          className="p-2 rounded-md bg-gray-700 shadow-sm disabled:opacity-50 text-gray-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <span className="text-sm font-medium text-gray-300">
          {TABS.find(t => t.id === activeTab)?.label}
        </span>
        <button
          onClick={() => {
            const currentIndex = TABS.findIndex(t => t.id === activeTab);
            if (currentIndex < TABS.length - 1) {
              handleTabChange(TABS[currentIndex + 1].id);
            }
          }}
          disabled={activeTab === TABS[TABS.length - 1].id}
          className="p-2 rounded-md bg-gray-700 shadow-sm disabled:opacity-50 text-gray-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
      <div className="flex justify-between">
        {TABS.map((tab) => {
          const isCompleted = completedSteps[tab.type];
          return (
            <div
              key={tab.id}
              className={`flex-1 h-1 rounded-full mx-0.5 ${
                activeTab === tab.id
                  ? "bg-amber-500"
                  : isCompleted
                  ? "bg-green-500"
                  : "bg-gray-600"
              }`}
            />
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="font-sans bg-gray-800 min-h-screen p-3 sm:p-5 text-gray-100 shadow-xl" dir="ltr">
      <div className="max-w-4xl mx-auto bg-gray-800 p-4 sm:p-5 rounded-lg shadow-xl border border-gray-700">
        <h1 className="text-center text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-5">
          Application d'Extraction et de Sauvegarde de Documents
        </h1>
        
        {/* Navigation par onglets responsive */}
        <div className="mb-4 sm:mb-5">
          {/* Version mobile */}
          <MobileTabNavigation />
          
          {/* Version desktop */}
          <div className="hidden sm:flex justify-center border-b-2 border-gray-700 space-x-2 sm:space-x-4 overflow-x-auto">
            {TABS.map((tab, index) => {
              const isCompleted = completedSteps[tab.type];
              const isEnabled =
                tab.id === activeTab ||
                isCompleted ||
                index === 0 ||
                (index > 0 && completedSteps[TABS[index - 1].type]);
              return (
                <button
                  key={tab.id}
                  className={`py-2 px-2 sm:px-4 cursor-pointer font-bold transition-all duration-300 text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-cyan-500 border-b-4 border-cyan-500"
                      : isEnabled
                      ? "text-gray-300 hover:text-cyan-400"
                      : "text-gray-600 cursor-not-allowed"
                  }`}
                  onClick={() => isEnabled && handleTabChange(tab.id)}
                  disabled={!isEnabled}
                >
                  {tab.label}{" "}
                  {isCompleted && <span className="text-green-400">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 sm:mt-5">
          {/* Contenu - Carte d'Identité (CIN) */}
          {activeTab === "cin-section" && (
            <TabContent
              tabId="cin"
              title="Extraction des données de la Carte d'Identité"
              dataType="client"
              data={formData.client}
              onExtract={extractWithAI}
              onSave={validateStep}
              onFormChange={handleFormChange}
              onFileChange={handleFileChange}
              filePreviews={filePreviews}
              selectedFiles={selectedFiles}
              nextTabId={TABS[0].nextTab}
              setActiveTab={setActiveTab}
              isCompleted={completedSteps.client}
              saveButtonText="Valider l'étape"
              isMobile={isMobile}
              isExtracting={isExtracting.client}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="mb-3 sm:mb-4">
                  <label htmlFor="first_name" className="block mb-1 font-bold text-sm sm:text-base text-gray-300">
                    Prénom
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    required
                    value={formData.client.first_name}
                    onChange={(e) => handleFormChange(e, "client")}
                    className="w-full p-2 sm:p-3 border border-gray-600 bg-gray-900 text-white rounded-md text-sm sm:text-base focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div className="mb-3 sm:mb-4">
                  <label htmlFor="last_name" className="block mb-1 font-bold text-sm sm:text-base text-gray-300">
                    Nom de Famille
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    required
                    value={formData.client.last_name}
                    onChange={(e) => handleFormChange(e, "client")}
                    className="w-full p-2 sm:p-3 border border-gray-600 bg-gray-900 text-white rounded-md text-sm sm:text-base focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div className="mb-3 sm:mb-4">
                  <label htmlFor="cin" className="block mb-1 font-bold text-sm sm:text-base text-gray-300">
                    Numéro de CIN
                  </label>
                  <input
                    type="text"
                    id="cin"
                    name="cin"
                    required
                    value={formData.client.cin}
                    onChange={(e) => handleFormChange(e, "client")}
                    className="w-full p-2 sm:p-3 border border-gray-600 bg-gray-900 text-white rounded-md text-sm sm:text-base focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div className="mb-3 sm:mb-4">
                  <label htmlFor="date_of_birth" className="block mb-1 font-bold text-sm sm:text-base text-gray-300">
                    Date de Naissance
                  </label>
                  <input
                    type="date"
                    id="date_of_birth"
                    name="date_of_birth"
                    required
                    value={formData.client.date_of_birth}
                    onChange={(e) => handleFormChange(e, "client")}
                    className="w-full p-2 sm:p-3 border border-gray-600 bg-gray-900 text-white rounded-md text-sm sm:text-base focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              
              </div>
            </TabContent>
          )}

          {/* Contenu - Permis de Conduire */}
          {activeTab === "license-section" && (
            <TabContent
              tabId="license"
              title="Extraction des données du Permis de Conduire"
              dataType="driving-license"
              data={formData["driving-license"]}
              onExtract={extractWithAI}
              onSave={validateStep}
              onFormChange={handleFormChange}
              onFileChange={handleFileChange}
              filePreviews={filePreviews}
              selectedFiles={selectedFiles}
              nextTabId={TABS[1].nextTab}
              setActiveTab={setActiveTab}
              isCompleted={completedSteps["driving-license"]}
              saveButtonText="Valider l'étape"
              isMobile={isMobile}
              isExtracting={isExtracting["driving-license"]}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="mb-3 sm:mb-4">
                  <label htmlFor="categorie" className="block mb-1 font-bold text-sm sm:text-base text-gray-300">
                    Catégorie
                  </label>
                  <input
                    type="text"
                    id="categorie"
                    name="categorie"
                    required
                    value={formData["driving-license"].categorie}
                    onChange={(e) => handleFormChange(e, "driving-license")}
                    className="w-full p-2 sm:p-3 border border-gray-600 bg-gray-700 text-white rounded-md text-sm sm:text-base focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div className="mb-3 sm:mb-4">
                  <label
                    htmlFor="license_number"
                    className="block mb-1 font-bold text-sm sm:text-base text-gray-300"
                  >
                    Numéro de Permis
                  </label>
                  <input
                    type="text"
                    id="license_number"
                    name="license_number"
                    required
                    value={formData["driving-license"].license_number}
                    onChange={(e) => handleFormChange(e, "driving-license")}
                    className="w-full p-2 sm:p-3 border border-gray-600 bg-gray-700 text-white rounded-md text-sm sm:text-base focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div className="mb-3 sm:mb-4">
                  <label htmlFor="issue_date" className="block mb-1 font-bold text-sm sm:text-base text-gray-300">
                    Date d'Émission
                  </label>
                  <input
                    type="date"
                    id="issue_date"
                    name="issue_date"
                    required
                    value={formData["driving-license"].issue_date}
                    onChange={(e) => handleFormChange(e, "driving-license")}
                    className="w-full p-2 sm:p-3 border border-gray-600 bg-gray-700 text-white rounded-md text-sm sm:text-base focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div className="mb-3 sm:mb-4">
                  <label htmlFor="expiry_date" className="block mb-1 font-bold text-sm sm:text-base text-gray-300">
                    Date d'Expiration
                  </label>
                  <input
                    type="date"
                    id="expiry_date"
                    name="expiry_date"
                    required
                    value={formData["driving-license"].expiry_date}
                    onChange={(e) => handleFormChange(e, "driving-license")}
                    className="w-full p-2 sm:p-3 border border-gray-600 bg-gray-700 text-white rounded-md text-sm sm:text-base focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
            </TabContent>
          )}

          {/* Contenu - Carte Grise */}
          {activeTab === "vehicle-section" && (
            <TabContent
              tabId="vehicle"
              title="Extraction des données de la Carte Grise"
              dataType="vehicle-registration"
              data={formData["vehicle-registration"]}
              onExtract={extractWithAI}
              onSave={validateStep}
              onFormChange={handleFormChange}
              onFileChange={handleFileChange}
              filePreviews={filePreviews}
              selectedFiles={selectedFiles}
              nextTabId={TABS[2].nextTab}
              setActiveTab={setActiveTab}
              isCompleted={completedSteps["vehicle-registration"]}
              saveButtonText="Valider l'étape"
              isMobile={isMobile}
              isExtracting={isExtracting["vehicle-registration"]}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="mb-3 sm:mb-4">
                  <label htmlFor="registration_number" className="block mb-1 font-bold text-sm sm:text-base text-gray-300">
                    Numéro d'immatriculation
                  </label>
                  <input
                    type="text"
                    id="registration_number"
                    name="numero_immatriculation"
                    required
                    value={formData["vehicle-registration"].numero_immatriculation}
                    onChange={(e) => handleFormChange(e, "vehicle-registration")}
                    className="w-full p-2 sm:p-3 border border-gray-600 bg-gray-700 text-white rounded-md text-sm sm:text-base focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div className="mb-3 sm:mb-4">
                  <label htmlFor="brand" className="block mb-1 font-bold text-sm sm:text-base text-gray-300">
                    Marque
                  </label>
                  <input
                    type="text"
                    id="brand"
                    name="marque"
                    required
                    value={formData["vehicle-registration"].marque}
                    onChange={(e) => handleFormChange(e, "vehicle-registration")}
                    className="w-full p-2 sm:p-3 border border-gray-600 bg-gray-700 text-white rounded-md text-sm sm:text-base focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div className="mb-3 sm:mb-4">
                  <label htmlFor="type" className="block mb-1 font-bold text-sm sm:text-base text-gray-300">
                    Type
                  </label>
                  <input
                    type="text"
                    id="type"
                    name="type"
                    required
                    value={formData["vehicle-registration"].type}
                    onChange={(e) => handleFormChange(e, "vehicle-registration")}
                    className="w-full p-2 sm:p-3 border border-gray-600 bg-gray-700 text-white rounded-md text-sm sm:text-base focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div className="mb-3 sm:mb-4">
                  <label htmlFor="fuel_type" className="block mb-1 font-bold text-sm sm:text-base text-gray-300">
                    Type de carburant
                  </label>
                  <input
                    type="text"
                    id="fuel_type"
                    name="type_carburant"
                    required
                    value={formData["vehicle-registration"].type_carburant}
                    onChange={(e) => handleFormChange(e, "vehicle-registration")}
                    className="w-full p-2 sm:p-3 border border-gray-600 bg-gray-700 text-white rounded-md text-sm sm:text-base focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div className="mb-3 sm:mb-4 sm:col-span-2">
                  <label htmlFor="vin" className="block mb-1 font-bold text-sm sm:text-base text-gray-300">
                    N° du chassis (VIN)
                  </label>
                  <input
                    type="text"
                    id="vin"
                    name="numero_chassis"
                    required
                    value={formData["vehicle-registration"].numero_chassis}
                    onChange={(e) => handleFormChange(e, "vehicle-registration")}
                    className="w-full p-2 sm:p-3 border border-gray-600 bg-gray-700 text-white rounded-md text-sm sm:text-base focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
            </TabContent>
          )}

          {/* Contenu - Récapitulatif et Validation */}
          {activeTab === "unified-section" && (
            <div>
              <h2 className="text-center text-lg sm:text-xl font-semibold text-gray-300 mb-4">
                Récapitulatif et Validation
              </h2>
              <p className="text-center mb-4 text-sm sm:text-base text-gray-400">
                Vérifiez toutes les informations ci-dessous avant de les
                sauvegarder.
              </p>

              {/* --- DÉBUT DE LA CORRECTION --- */}
              {/* Remplacement de l'appel à renderFinalSummary() qui n'existe pas */}
              <div className="bg-gray-700 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold text-lg text-cyan-400">Client</h3>
                <p className="text-sm text-gray-300">Nom: {finalSubmissionData.client?.last_name || 'N/A'}, Prénom: {finalSubmissionData.client?.first_name || 'N/A'}</p>
                <p className="text-sm text-gray-300">CIN: {finalSubmissionData.client?.cin || 'N/A'}</p>

                <h3 className="font-semibold text-lg text-cyan-400 mt-4">Permis de Conduire</h3>
                <p className="text-sm text-gray-300">Numéro: {finalSubmissionData['driving-license']?.license_number || 'N/A'}</p>
                <p className="text-sm text-gray-300">Catégorie: {finalSubmissionData['driving-license']?.categorie || 'N/A'}</p>

                <h3 className="font-semibold text-lg text-cyan-400 mt-4">Carte Grise</h3>
                <p className="text-sm text-gray-300">Immatriculation: {finalSubmissionData['vehicle-registration']?.numero_immatriculation || 'N/A'}</p>
                <p className="text-sm text-gray-300">Marque: {finalSubmissionData['vehicle-registration']?.marque || 'N/A'}, Type: {finalSubmissionData['vehicle-registration']?.type || 'N/A'}</p>
              </div>
              {/* --- FIN DE LA CORRECTION --- */}

              <div className="mt-6 sm:mt-8">
                <button
                  onClick={saveAllData}
                  // --- DÉBUT DE LA CORRECTION ---
                  // Le bouton est maintenant désactivé si TOUTES les étapes ne sont pas validées
                  disabled={
                    isSavingAll ||
                    !completedSteps.client ||
                    !completedSteps["driving-license"] ||
                    !completedSteps["vehicle-registration"]
                  }
                  // --- FIN DE LA CORRECTION ---
                  className="w-full py-3 bg-green-600 text-white rounded-md cursor-pointer text-base sm:text-lg font-bold hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  {isSavingAll
                    ? "Sauvegarde en cours..."
                    : "Valider et Sauvegarder Tout"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 sm:mt-5 p-3 sm:p-4 bg-gray-700 rounded-md text-center">
          <div className="text-xs sm:text-sm whitespace-pre-wrap text-gray-300">
            {resultMessage || "Les résultats des opérations apparaîtront ici."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Client;