import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';

const ConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Êtes-vous sûr ?", 
    message = "Cette action est irréversible. Voulez-vous vraiment continuer ?", 
    confirmText = "Confirmer", 
    cancelText = "Annuler",
    type = "warning", // warning, info, error, success
    size = "medium", // small, medium, large
    closeOnBackdropClick = true,
    showCloseButton = true,
    requireConfirmation = false, // Nécessite de taper un texte pour confirmer
    confirmationText = "CONFIRMER", // Texte à taper pour confirmer
    children = null // Pour ajouter du contenu personnalisé
}) => {
    const [confirmationInput, setConfirmationInput] = React.useState('');
    const [isAnimating, setIsAnimating] = React.useState(false);
    const modalRef = useRef(null);
    const confirmButtonRef = useRef(null);

    // Gérer l'animation d'entrée/sortie
    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            // Focus sur le bouton de confirmation à l'ouverture
            setTimeout(() => {
                confirmButtonRef.current?.focus();
            }, 100);
        } else {
            setIsAnimating(false);
        }
    }, [isOpen]);

    // Gérer la fermeture avec la touche Échap
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.keyCode === 27 && isOpen) {
                onClose();
            }
        };
        
        window.addEventListener('keydown', handleEsc);
        
        // Empêcher le scroll du body lorsque le modal est ouvert
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Gérer le clic sur le fond
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && closeOnBackdropClick) {
            onClose();
        }
    };

    // Gérer la confirmation
    const handleConfirm = () => {
        if (requireConfirmation && confirmationInput !== confirmationText) {
            return;
        }
        onConfirm();
        setConfirmationInput(''); // Réinitialiser l'input après confirmation
    };

    if (!isOpen) return null;

    // Déterminer l'icône en fonction du type
    const getIcon = () => {
        switch (type) {
            case 'warning':
                return <AlertTriangle className="w-12 h-12 text-amber-500" />;
            case 'info':
                return <Info className="w-12 h-12 text-blue-500" />;
            case 'error':
                return <XCircle className="w-12 h-12 text-red-500" />;
            case 'success':
                return <CheckCircle className="w-12 h-12 text-green-500" />;
            default:
                return <AlertTriangle className="w-12 h-12 text-amber-500" />;
        }
    };

    // Déterminer la classe de taille
    const getSizeClass = () => {
        switch (size) {
            case 'small':
                return "max-w-sm";
            case 'large':
                return "max-w-2xl";
            case 'medium':
            default:
                return "max-w-md";
        }
    };

    // Déterminer la classe du bouton de confirmation
    const getConfirmButtonClass = () => {
        const baseClass = "flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-all transform hover:scale-105";
        
        switch (type) {
            case 'warning':
                return `${baseClass} bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500`;
            case 'info':
                return `${baseClass} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
            case 'error':
                return `${baseClass} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
            case 'success':
                return `${baseClass} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500`;
            default:
                return `${baseClass} bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500`;
        }
    };

    return (
        <div 
            className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleBackdropClick}
        >
            <div className="absolute inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm"></div>
            
            <div 
                ref={modalRef}
                className={`relative bg-white rounded-xl shadow-2xl w-full mx-4 ${getSizeClass()} transform transition-all duration-300 ${isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
            >
                {showCloseButton && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="Fermer"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                )}
                
                <div className="p-6">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-4">
                            {getIcon()}
                        </div>
                        
                        <h2 id="modal-title" className="text-xl font-semibold mb-4 text-gray-800">
                            {title}
                        </h2>
                        
                        <p id="modal-description" className="mb-6 text-gray-600">
                            {message}
                        </p>
                        
                        {children && (
                            <div className="mb-6 w-full">
                                {children}
                            </div>
                        )}
                        
                        {requireConfirmation && (
                            <div className="mb-6 w-full">
                                <p className="text-sm text-gray-500 mb-2">
                                    Pour confirmer, tapez <span className="font-mono font-bold">{confirmationText}</span> ci-dessous :
                                </p>
                                <input
                                    type="text"
                                    value={confirmationInput}
                                    onChange={(e) => setConfirmationInput(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    placeholder={confirmationText}
                                />
                            </div>
                        )}
                        
                        <div className="flex justify-between w-full gap-4">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all transform hover:scale-105"
                            >
                                {cancelText}
                            </button>
                            
                            <button
                                ref={confirmButtonRef}
                                onClick={handleConfirm}
                                disabled={requireConfirmation && confirmationInput !== confirmationText}
                                className={`${getConfirmButtonClass()} ${requireConfirmation && confirmationInput !== confirmationText ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;