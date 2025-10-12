  const renderFinalSummary = () => {
    const { client, "driving-license": license, "vehicle-registration": vehicle } = finalSubmissionData;
    return (
      <div className="space-y-4 sm:space-y-6">
        {client && (
          <div className="p-3 sm:p-4 border border-gray-700 rounded-lg bg-gray-800 shadow-sm">
            <h3 className="font-bold text-base sm:text-lg mb-2 text-gray-100">Données Client</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-400">Prénom</p>
                <p className="font-medium text-sm sm:text-base text-gray-100">{client.first_name}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-400">Nom</p>
                <p className="font-medium text-sm sm:text-base text-gray-100">{client.last_name}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-400">CIN</p>
                <p className="font-medium text-sm sm:text-base text-gray-100">{client.cin}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-400">Date de Naissance</p>
                <p className="font-medium text-sm sm:text-base text-gray-100">{client.date_of_birth}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs sm:text-sm text-gray-400">Adresse</p>
                <p className="font-medium text-sm sm:text-base text-gray-100">{client.address}</p>
              </div>
            </div>
            {client.stats && (
              <div className="mt-3 pt-3 border-t border-gray-700 text-xs sm:text-sm text-gray-400">
                <p>
                  Précision d'extraction IA:{" "}
                  {client.stats.average_ai_confidence}%
                </p>
                <p>
                  Corrigé par l'homme:{" "}
                  {client.stats.is_corrected_by_human ? "Oui" : "Non"}
                </p>
              </div>
            )}
          </div>
        )}
        {license && (
          <div className="p-3 sm:p-4 border border-gray-700 rounded-lg bg-gray-800 shadow-sm">
            <h3 className="font-bold text-base sm:text-lg mb-2 text-gray-100">Permis de Conduire</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-400">N° Permis</p>
                <p className="font-medium text-sm sm:text-base text-gray-100">{license.license_number}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-400">Catégorie</p>
                <p className="font-medium text-sm sm:text-base text-gray-100">{license.categorie}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-400">Date d'Émission</p>
                <p className="font-medium text-sm sm:text-base text-gray-100">{license.issue_date}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-400">Date d'Expiration</p>
                <p className="font-medium text-sm sm:text-base text-gray-100">{license.expiry_date}</p>
              </div>
            </div>
            {license.stats && (
              <div className="mt-3 pt-3 border-t border-gray-700 text-xs sm:text-sm text-gray-400">
                <p>
                  Précision d'extraction IA:{" "}
                  {license.stats.average_ai_confidence}%
                </p>
                <p>
                  Corrigé par l'homme:{" "}
                  {license.stats.is_corrected_by_human ? "Oui" : "Non"}
                </p>
              </div>
            )}
          </div>
        )}
        {vehicle && (
          <div className="p-3 sm:p-4 border border-gray-700 rounded-lg bg-gray-800 shadow-sm">
            <h3 className="font-bold text-base sm:text-lg mb-2 text-gray-100">Carte Grise</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-400">Numéro d'immatriculation</p>
                <p className="font-medium text-sm sm:text-base text-gray-100">{vehicle.numero_immatriculation}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-400">Marque</p>
                <p className="font-medium text-sm sm:text-base text-gray-100">{vehicle.marque}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-400">Type</p>
                <p className="font-medium text-sm sm:text-base text-gray-100">{vehicle.type}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-400">Type de carburant</p>
                <p className="font-medium text-sm sm:text-base text-gray-100">{vehicle.type_carburant}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs sm:text-sm text-gray-400">N° du chassis (VIN)</p>
                <p className="font-medium text-sm sm:text-base text-gray-100">{vehicle.numero_chassis}</p>
              </div>
            </div>
            {vehicle.stats && (
              <div className="mt-3 pt-3 border-t border-gray-700 text-xs sm:text-sm text-gray-400">
                <p>
                  Précision d'extraction IA:{" "}
                  {vehicle.stats.average_ai_confidence}%
                </p>
                <p>
                  Corrigé par l'homme:{" "}
                  {vehicle.stats.is_corrected_by_human ? "Oui" : "Non"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
export default renderFinalSummary;