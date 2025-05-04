import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";
import { CarFront, Users, DollarSign, Activity, Loader2, AlertCircle } from "lucide-react"; // Import Loader2 and AlertCircle
import L from 'leaflet'; // Import Leaflet library
import axios from 'axios'; // Import axios for API calls

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

  // Fetch real data from backend APIs on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null); // Clear previous errors

      try {
        // --- Fetch data from your backend APIs ---
        // We now fetch daily stats, all users (for client count),
        // and live taxi locations from the new endpoint.
        const [statsResponse, usersResponse, liveLocationsResponse] = await Promise.all([
           axios.get('http://localhost:5000/api/dashboard'), // Endpoint for daily stats
           axios.get('http://localhost:5000/api/users'), // Endpoint for users (clients)
           axios.get('http://localhost:5000/api/taxiLocation') // NEW Endpoint for live taxi locations
           // We no longer need the /api/taxis endpoint here for the map data
        ]);

        const dailyStats = statsResponse.data; // { totalRidesToday, totalRevenueToday }
        const allUsers = usersResponse.data; // Array of users (including clients with ridesCount)
        const liveTaxiData = liveLocationsResponse.data; // Array from /api/taxiLocation

        // Process data for the dashboard state
        const totalClients = allUsers.filter(user => user.role === 'client').length; // Count clients

        // Calculate active taxis based on the live location data status
        const activeTaxisCount = liveTaxiData.filter(taxi => taxi.taxi?.status === 'disponible' || taxi.taxi?.status === 'occupé').length;


        // Prepare taxi data for the map from the liveLocationResponse structure
        // The structure is now [{ _id, coordinates, updatedAt, taxi: { _id, status, licensePlate, driver: { _id, name } } }]
        const taxisForMap = liveTaxiData
            .filter(item => item.coordinates && item.coordinates.length === 2) // Only include items with valid coordinates
            .map(item => ({
                id: item._id, // Use the main _id from the live location object
                name: item.taxi?.driver?.name || item.taxi?.licensePlate || 'Taxi Inconnu', // Use driver name or license plate
                position: [item.coordinates[1], item.coordinates[0]], // Leaflet uses [lat, lng], backend provides [lng, lat]
                status: item.taxi?.status || 'Statut inconnu' // Get status from the nested taxi object
            }));


        // Combine all fetched data into the dashboardData state
        setDashboardData({
          stats: [
            { icon: <CarFront className="text-green-600 w-6 h-6" />, title: "Taxis actifs", value: activeTaxisCount },
            { icon: <Activity className="text-blue-600 w-6 h-6" />, title: "Courses aujourd’hui", value: dailyStats.totalRidesToday },
            { icon: <DollarSign className="text-yellow-600 w-6 h-6" />, title: "Revenus du jour", value: `${dailyStats.totalRevenueToday !== undefined ? dailyStats.totalRevenueToday.toFixed(2) : 'N/A'} €` }, // Format revenue, handle undefined
            { icon: <Users className="text-purple-600 w-6 h-6" />, title: "Clients", value: totalClients },
          ],
          taxis: taxisForMap, // Use processed taxi data for the map
           // Set a default center or get it dynamically if needed
           // Using a default center for Antananarivo if no taxi data
           center: taxisForMap.length > 0 ? taxisForMap[0].position : [-18.9167, 47.5167], // Center on first taxi or default Tana
           zoom: taxisForMap.length > 0 ? 13 : 12 // Adjust zoom based on data presence
        });

        setLoading(false);

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError('Erreur lors du chargement des données du tableau de bord.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []); // Empty dependency array means this runs once on mount

  // Handle loading and error states
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen pt-20"> {/* Use h-screen for full page */}
        <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
        <p className="ml-4 text-gray-600 mt-2">Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen pt-20 text-red-600"> {/* Use h-screen */}
        <AlertCircle size={36} className="mb-4"/>
        <p className="text-lg font-semibold">Erreur de chargement</p>
        <p className="text-sm text-gray-500 mt-2">{error}</p>
         {/* Add a retry button */}
         <button onClick={() => { setLoading(true); setError(null); fetchDashboardData(); }} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Réessayer</button>
      </div>
    );
  }

   // Ensure data exists before rendering (should be true if no error and not loading)
  if (!dashboardData) {
       return <div className="pt-20 px-6 text-center text-gray-600">Aucune donnée disponible pour le tableau de bord.</div>;
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
           {/* Check if taxis data is available before rendering MapContainer */}
           {dashboardData.taxis && dashboardData.taxis.length > 0 ? (
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
           ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                 Aucun taxi avec des données de localisation disponibles.
              </div>
           )}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
