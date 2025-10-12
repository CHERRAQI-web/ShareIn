import React from "react";
import { Users, TrendingUp, FileText, Clock } from "lucide-react";
import { TailwindRadialChart } from "../components/PercentageRadialChart.jsx";
import { useState, useEffect } from "react";
import axios from "axios";
import DailyCalendar from "../components/calendrie.jsx";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Rectangle,
  Legend,
} from "recharts";

const Dashboard = () => {
  const [client, setClient] = useState({
    client: [],
    totalClient: 0,
    dailyStats: [],
  });
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState({
    average_confidence: 0,
    document_count: 0,
    human_corrected_count: 0,
    human_correction_percentage: 0,
    dailyStats: [],
  });
  const [activeTab, setActiveTab] = useState("stats"); // Pour la navigation par onglets sur mobile

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await axios("http://localhost:8080/api/clients");
        setClient(response.data);
      } catch (error) {
        setMessage("Erreur lors de la récupération des données des clients");
      }
    };
    fetchClient();
  }, []);

  useEffect(() => {
    const fetchPercentage = async () => {
      try {
        const response = await axios(
          "http://localhost:8080/api/stats/global-stats"
        );
        setStats(response.data);
      } catch (error) {
        setMessage(
          "Erreur lors de la récupération des données des statistiques"
        );
      }
    };
    fetchPercentage();
  }, []);

  const barChartData =
    Array.isArray(client.dailyStats) && client.dailyStats.length > 0
      ? client.dailyStats.map((item) => ({
          "Nombre de client ": item.count || 0,
          date: item.date,
        }))
      : [];

  const areaData =
    Array.isArray(stats.dailyStats) && stats.dailyStats.length > 0
      ? stats.dailyStats.map((item) => ({
          name: item.date,
          documents: item.count || 0,
        }))
      : [];

  const getAccentClasses = (isHover) =>
    isHover
      ? "shadow-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/50"
      : "shadow-md";

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 rounded-lg shadow-xl border border-gray-700">
          <p className="text-sm text-gray-300 mb-2">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Composant pour les cartes statistiques
  const StatCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <div
        className={`border-l-4 border-cyan-500 flex items-center p-4 sm:p-6 bg-gray-900 rounded-xl ${getAccentClasses(
          true
        )}`}
      >
        <div className="p-3 mr-4 rounded-full bg-cyan-500/20 text-cyan-500">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-400">
            Docs. Téléchargés
          </h3>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-white">
            {stats.document_count}
          </p>
        </div>
      </div>

      <div
        className={`border-l-4 border-blue-500 flex items-center p-4 sm:p-6 bg-gray-900 rounded-xl ${getAccentClasses(
          true
        )}`}
      >
        <div className="p-3 mr-4 rounded-full bg-blue-500/20 text-blue-500">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-400">
            Précision moyenne
          </h3>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-white">
            {stats.average_confidence}%
          </p>
        </div>
      </div>

      <div
        className={`border-l-4 border-green-500 flex items-center p-4 sm:p-6 bg-gray-900 rounded-xl ${getAccentClasses(
          true
        )}`}
      >
        <div className="p-3 mr-4 rounded-full bg-green-500/20 text-green-500">
          <TrendingUp className="w-6 h-6 rotate-180" />
        </div>
        <div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-400">
            Taux de Revue Manuelle
          </h3>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-white">
            {stats.human_correction_percentage}%
          </p>
        </div>
      </div>

      <div
        className={`border-l-4 border-purple-500 flex items-center p-4 sm:p-6 bg-gray-900 rounded-xl ${getAccentClasses(
          true
        )}`}
      >
        <div className="p-3 mr-4 rounded-full bg-purple-500/20 text-purple-400">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-400">
            Total Clients
          </h3>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-white">
            {client.totalClient}
          </p>
        </div>
      </div>
    </div>
  );

  // Composant pour les graphiques
  const ChartsSection = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <div className="bg-gray-900 p-4 sm:p-6 rounded-xl shadow-xl lg:col-span-1">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
          Activité Hebdomadaire
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={barChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Nombre de client " fill="#9ed7f8ff" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-900 p-4 sm:p-6 rounded-xl shadow-xl lg:col-span-1">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
          Tendances de Traitement
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart
            data={areaData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="colorDocuments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9ed7f8ff" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#9ed7f8ff" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="documents"
              stroke="#9ed7f8ff"
              fillOpacity={1}
              fill="url(#colorDocuments)"
              name="Total Documents"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-900 rounded-xl shadow-xl lg:col-span-1">
        <DailyCalendar />
      </div>
    </div>
  );

  // Navigation par onglets pour mobile
  const MobileTabs = () => (
    <div className="flex border-b border-gray-700 mb-6 md:hidden">
      <button
        className={`flex-1 py-2 text-center font-medium ${
          activeTab === "stats"
            ? "text-amber-500 border-b-2 border-amber-500"
            : "text-gray-400"
        }`}
        onClick={() => setActiveTab("stats")}
      >
        Statistiques
      </button>
      <button
        className={`flex-1 py-2 text-center font-medium ${
          activeTab === "charts"
            ? "text-amber-500 border-b-2 border-amber-500"
            : "text-gray-400"
        }`}
        onClick={() => setActiveTab("charts")}
      >
        Graphiques
      </button>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 min-h-screen text-gray-100">
      {/* Navigation par onglets pour mobile */}
      <MobileTabs />

      {/* Affichage conditionnel selon l'onglet actif sur mobile */}
      <div className="hidden md:block">
        <StatCards />
        <div className="mt-8">
          <ChartsSection />
        </div>
      </div>

      <div className="md:hidden">
        {activeTab === "stats" && <StatCards />}
        {activeTab === "charts" && <ChartsSection />}
      </div>
    </div>
  );
};

export default Dashboard;
