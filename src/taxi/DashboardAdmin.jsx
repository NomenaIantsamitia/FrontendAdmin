import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";
import { CarFront, Users, DollarSign, Activity } from "lucide-react";
import L from 'leaflet'; // Import Leaflet library

// Fix for default marker icon issue with Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// --- Stat Card Component ---
const StatCard = ({ icon, title, value, delay }) => {
  return (
    <motion.div
      className="rounded-xl p-4 shadow bg-white flex items-center gap-4"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay }}
    >
      {icon}
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <h2 className="text-xl font-semibold text-gray-800">{value}</h2>
      </div>
    </motion.div>
  );
};

// --- Dashboard Component ---
const Dashboard = () => {
  // State for holding fetched data
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simulate data fetching on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // --- Replace with your actual API call ---
        // Example: const response = await fetch('/api/dashboard-stats');
        // const data = await response.json();
        // setDashboardData(data);
        // ----------------------------------------

        // Simulate a network request delay
        setTimeout(() => {
          const simulatedData = {
            stats: [
              { icon: <CarFront className="text-green-600 w-6 h-6" />, title: "Taxis actifs", value: 24 },
              { icon: <Activity className="text-blue-600 w-6 h-6" />, title: "Courses aujourd’hui", value: 89 },
              { icon: <DollarSign className="text-yellow-600 w-6 h-6" />, title: "Revenus du jour", value: "420 €" },
              { icon: <Users className="text-purple-600 w-6 h-6" />, title: "Clients", value: 312 },
            ],
            taxis: [
              { id: 1, name: "Taxi 1", position: [48.8566, 2.3522], status: "Libre" },
              { id: 2, name: "Taxi 2", position: [48.857, 2.35], status: "Occupé" },
               { id: 3, name: "Taxi 3", position: [48.86, 2.348], status: "Libre" },
            ],
             center: [48.8566, 2.3522], // Dynamic center from data
             zoom: 13
          };
          setDashboardData(simulatedData);
          setLoading(false);
        }, 1000); // Simulate 1 second loading time

      } catch (err) {
        setError(err);
        setLoading(false);
        console.error("Failed to fetch dashboard data:", err);
      }
    };

    fetchDashboardData();
  }, []); // Empty dependency array means this runs once on mount

  // Handle loading and error states
  if (loading) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="pt-20 px-6 text-center text-red-600">Erreur lors du chargement des données.</div>;
  }

   // Ensure data exists before rendering
  if (!dashboardData) {
       return <div className="pt-20 px-6 text-center text-gray-600">Aucune donnée disponible.</div>;
  }

  return (
    <div className="pt-20 px-6 space-y-6 bg-gray-50 min-h-screen">
      <motion.h1
        className="text-3xl font-bold text-gray-800"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Tableau de bord
      </motion.h1>

      {/* Statistiques animées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardData.stats.map((stat, idx) => (
          <StatCard
            key={idx}
            icon={stat.icon}
            title={stat.title}
            value={stat.value}
            delay={idx * 0.1}
          />
        ))}
      </div>

      {/* Carte des taxis */}
      <motion.div
        className="bg-white rounded-xl shadow overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: dashboardData.stats.length * 0.1 + 0.1 }}
      >
        <h3 className="text-lg font-semibold p-4 border-b">🗺️ Carte des taxis en temps réel</h3>
        <div className="h-[600px] w-full">
          <MapContainer center={dashboardData.center} zoom={dashboardData.zoom} className="h-full w-full z-0">
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {dashboardData.taxis.map((taxi) => (
              <Marker
                key={taxi.id}
                position={taxi.position}
                // No custom icon here, using default
              >
                <Popup>
                  <strong>{taxi.name}</strong><br />
                  Statut : {taxi.status}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;