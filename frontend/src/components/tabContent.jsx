const TabContent = ({
  tabId,
  title,
  dataType,
  onExtract,
  onSave,
  onFormChange,
  onFileChange,
  filePreviews,
  selectedFiles,
  nextTabId,
  setActiveTab,
  isCompleted,
  saveButtonText,
  children,
  isExtracting = false,
  isMobile = false,
}) => {
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 transition-all duration-300 hover:shadow-xl border border-gray-700">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-2xl font-bold text-center text-gray-100 mb-2">
          {title}
        </h2>
        <div className="w-16 sm:w-20 h-1 bg-gradient-to-r from-cyan-500 to-blue-600 mx-auto rounded-full"></div>
      </div>

      <div
        className={`grid ${
          isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
        } gap-4 sm:gap-6 mb-4 sm:mb-6`}
      >
        {/* Section Recto */}
        <div className="relative group">
          <div
            className={`border-2 ${
              filePreviews[tabId]?.recto
                ? "border-green-500 bg-green-900/20"
                : "border-dashed border-gray-600 bg-gray-700/50"
            } p-3 sm:p-6 text-center rounded-xl transition-all duration-300 hover:border-cyan-500 hover:bg-gray-700 overflow-hidden`}
          >
            <label
              htmlFor={`${tabId}-file-recto`}
              className="cursor-pointer block"
            >
              {filePreviews[tabId]?.recto ? (
                <div className="relative">
                  <img
                    src={filePreviews[tabId].recto}
                    alt="Aperçu Recto"
                    className="max-h-32 sm:max-h-48 mx-auto rounded-lg shadow-md"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                    <span className="text-white font-medium bg-cyan-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
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
                  <p className="text-gray-400 text-xs sm:text-sm">
                    Cliquez pour télécharger une image
                  </p>
                </div>
              )}
            </label>
            <input
              type="file"
              id={`${tabId}-file-recto`}
              accept="image/*"
              className="hidden"
              onChange={(e) => onFileChange(e, tabId, "recto")}
            />
            {selectedFiles[tabId]?.recto && (
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
                <p className="text-xs text-gray-400 truncate max-w-full">
                  {selectedFiles[tabId]?.recto?.name}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section Verso */}
        <div className="relative group">
          <div
            className={`border-2 ${
              filePreviews[tabId]?.verso
                ? "border-green-500 bg-green-900/20"
                : "border-dashed border-gray-600 bg-gray-700/50"
            } p-3 sm:p-6 text-center rounded-xl transition-all duration-300 hover:border-cyan-500 hover:bg-gray-700 overflow-hidden`}
          >
            <label
              htmlFor={`${tabId}-file-verso`}
              className="cursor-pointer block"
            >
              {filePreviews[tabId]?.verso ? (
                <div className="relative">
                  <img
                    src={filePreviews[tabId].verso}
                    alt="Aperçu Verso"
                    className="max-h-32 sm:max-h-48 mx-auto rounded-lg shadow-md"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                    <span className="text-white font-medium bg-amber-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
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
                  <p className="text-gray-400 text-xs sm:text-sm">
                    Cliquez pour télécharger une image
                  </p>
                </div>
              )}
            </label>
            <input
              type="file"
              id={`${tabId}-file-verso`}
              accept="image/*"
              className="hidden"
              onChange={(e) => onFileChange(e, tabId, "verso")}
            />
            {selectedFiles[tabId]?.verso && (
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
                <p className="text-xs text-gray-400 truncate max-w-full">
                  {selectedFiles[tabId]?.verso?.name}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => onExtract(dataType)}
        disabled={
          (!selectedFiles[tabId]?.recto && !selectedFiles[tabId]?.verso) ||
          isExtracting
        }
        className={`w-full py-2 sm:py-3 rounded-lg font-medium text-white transition-all duration-300 transform hover:scale-[1.02] text-sm sm:text-base ${
          isExtracting
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-700 hover:to-cyan-600 shadow-md hover:shadow-lg"
        } ${
          !selectedFiles[tabId]?.recto && !selectedFiles[tabId]?.verso
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
      >
        {isExtracting ? (
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

      <div className="mt-4 sm:mt-6 bg-gray-800 rounded-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-cyan-500 mb-3 sm:mb-4">
          Informations extraites
        </h3>
        <form>
          {children}
          <div
            className={`flex ${
              isMobile ? "flex-col space-y-2" : "justify-between space-x-4"
            } mt-4 sm:mt-6`}
          >
            <button
              type="button"
              onClick={() => onSave(dataType)}
              className={`${
                isMobile ? "w-full" : "flex-1"
              } py-2 sm:py-3 rounded-lg font-medium text-white transition-all duration-300 transform hover:scale-[1.02] text-sm sm:text-base ${
                isCompleted
                  ? "bg-green-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-md hover:shadow-lg"
              }`}
              disabled={isCompleted}
            >
              {isCompleted ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Étape Validée
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {saveButtonText}
                </span>
              )}
            </button>
            {nextTabId && (
              <button
                type="button"
                onClick={() => setActiveTab(nextTabId)}
                className={`${
                  isMobile ? "w-full" : "w-1/3"
                } py-2 sm:py-3 rounded-lg font-medium text-white transition-all duration-300 transform hover:scale-[1.02] text-sm sm:text-base ${
                  isCompleted
                    ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-md hover:shadow-lg"
                    : "bg-gray-600 cursor-not-allowed opacity-50"
                }`}
                disabled={!isCompleted}
              >
                <span className="flex items-center justify-center">
                  Suivant
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
export default TabContent;
