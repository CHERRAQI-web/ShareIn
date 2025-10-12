import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AgendaMonthlyCalendar = () => {
    // État pour stocker le mois en cours
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // --- LOGIQUE DE NAVIGATION ---
    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };
    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    // Formate le mois et l'année pour l'en-tête (ex: "Juillet 2024")
    const formatMonthYear = (date) => {
        return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    };

    // --- GÉNÉRATION DE LA GRILLE DU MOIS ---
    // useMemo pour ne recalculer que si le mois change
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        // Premier jour du mois
        const firstDayOfMonth = new Date(year, month, 1);
        // Dernier jour du mois
        const lastDayOfMonth = new Date(year, month + 1, 0);
        
        // Jour de la semaine du premier jour (0=Lundi, 6=Dimanche)
        // On ajuste car getDay() de JS est basé sur le dimanche (0=Dimanche)
        const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

        const daysInMonth = lastDayOfMonth.getDate();
        const today = new Date();

        // Crée un tableau pour tous les jours à afficher (jours du mois précédent, actuel et suivant)
        const days = [];

        // Ajoute les jours du mois précédent pour remplir le début de la grille
        const daysInPreviousMonth = new Date(year, month, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            days.push({
                dayNumber: daysInPreviousMonth - i,
                isCurrentMonth: false,
                date: new Date(year, month - 1, daysInPreviousMonth - i)
            });
        }

        // Ajoute tous les jours du mois actuel
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const isToday = date.toDateString() === today.toDateString();
            days.push({
                dayNumber: i,
                isCurrentMonth: true,
                isToday,
                date
            });
        }

        // Ajoute les jours du mois suivant pour compléter la grille (jusqu'à 42 jours = 6 semaines)
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                dayNumber: i,
                isCurrentMonth: false,
                date: new Date(year, month + 1, i)
            });
        }

        return days;
    }, [currentMonth]);

    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    return (
        <div className="p-6 bg-gray-900 rounded-2xl shadow-2xl border border-gray-700">
            {/* En-tête avec la navigation */}
            <div className="flex items-center justify-between mb-6">
                <button 
                    onClick={goToPreviousMonth} 
                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-all duration-200 text-gray-300 hover:text-white hover:scale-110"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold text-white tracking-wide capitalize">
                    {formatMonthYear(currentMonth)}
                </h2>
                <button 
                    onClick={goToNextMonth} 
                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-all duration-200 text-gray-300 hover:text-white hover:scale-110"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* En-tête des jours de la semaine */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {dayNames.map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grille des jours du mois */}
            <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => (
                    <div
                        key={index}
                        className={`
                            aspect-square flex items-center justify-center rounded-lg text-sm font-medium cursor-pointer transition-all duration-200
                            ${day.isToday 
                                ? 'bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-500/30 scale-110' 
                                : day.isCurrentMonth 
                                    ? 'bg-gray-700/50 text-gray-200 hover:bg-gray-600' 
                                    : 'text-gray-600 bg-transparent'
                            }
                        `}
                        title={day.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    >
                        {day.dayNumber}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AgendaMonthlyCalendar;