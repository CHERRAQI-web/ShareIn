// TailwindRadialChartDonut.jsx

import React from 'react';
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

/**
 * Composant Radial Chart de style Donut 360° complet.
 * @param {number} percentage - La valeur en pourcentage à afficher (0-100)
 * @param {string} title - Le titre de la carte
 * @param {string} unitLabel - Le libellé sous la valeur centrale
 * @param {number} [comparisonChange=0] - Le pourcentage de changement (optionnel)
 * @param {string} [activeColor="hsl(210 90% 50%)"] - La couleur principale de la barre
 */
export function TailwindRadialChart({ 
    percentage, 
    title, 
    unitLabel, 
    comparisonChange = 0,
    activeColor = "hsl(210 90% 50%)", // Bleu vif par défaut
}) {
  
  // Angle maximum de 360 degrés
  const maxAngle = 360; 
  const endAngle = (percentage / 100) * maxAngle;
  
  // Données du graphique :
  // 1. L'arrière-plan (toujours à 100%)
  // 2. La barre de progression (valeur réelle)
  const chartData = [
    { name: "Background", value: 100, fill: "hsl(210 40% 96.1%)" }, // Couleur très claire
    { name: title, value: percentage, fill: activeColor } 
  ];

  const isPositive = comparisonChange >= 0;
  const comparisonText = comparisonChange === 0 
    ? "Aucun changement" 
    : `${Math.abs(comparisonChange).toFixed(1)}% ${isPositive ? 'amélioration' : 'baisse'}`;
  
  const changeColorClass = isPositive ? 'text-green-600' : 'text-red-600';
  const TrendingIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    // Carte avec ombre douce et bordures très légèrement arrondies
    <div className="bg-white  rounded-xl shadow-lg flex flex-col items-center transition-all duration-300">
      
      {/* En-tête de la carte */}
      <div className="text-center pb-2">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        {/* <p className="text-sm text-gray-500 mt-1">Total {maxAngle}°</p> */}
      </div>

      {/* Conteneur du graphique */}
      <div className="mx-auto" style={{ width: 250, height: 250 }}>
        <RadialBarChart
          width={250} 
          height={250} 
          data={chartData}
          startAngle={90} // Commence en haut
          endAngle={90 - endAngle} // Tourne dans le sens des aiguilles d'une montre
          innerRadius={85} // Rayon intérieur
          outerRadius={105} // Rayon extérieur
        >
          {/* Les PolarGrid et PolarRadiusAxis sont masqués pour un look plus propre */}
          <PolarGrid /> 
          <PolarRadiusAxis tick={false} axisLine={false} />
          
          {/* Barres :
              1. La barre d'arrière-plan (toujours affichée)
              2. La barre de progression (doit être définie APRÈS l'arrière-plan)
          */}
          <RadialBar 
            dataKey="value" 
            background={false} // Pas d'arrière-plan automatique ici, on utilise la première barre
            cornerRadius={10} 
            // Application d'une légère ombre portée pour un effet 3D subtil sur la barre de progression
            filter="drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.2))" 
          />

          <Label
            value={`${percentage.toFixed(1)}%`}
            position="center"
            className="text-5xl font-extrabold text-gray-900"
          />

          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {/* Affichage du pourcentage */}
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy - 10} 
                        className="text-5xl font-extrabold text-gray-900" 
                      >
                        {percentage.toFixed(1)}%
                      </tspan>
                      {/* Affichage du libellé */}
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 20}
                        className="text-sm font-semibold text-gray-500" 
                      >
                        {unitLabel}
                      </tspan>
                    </text>
                  )
                }
              }}
            />
          </PolarRadiusAxis>

        </RadialBarChart>
      </div>
      
      {/* Pied de la carte */}
      {/* {comparisonChange !== 0 && (
          <div className="flex flex-col gap-1 text-sm pt-4 border-t border-gray-100 w-full mt-4 items-center">
              <div className={`flex items-center gap-2 leading-none font-semibold ${changeColorClass}`}>
                  {comparisonText} par rapport à la période précédente 
                  <TrendingIcon className="h-4 w-4" /> 
              </div>
          </div>
      )} */}
    </div>
  )
}