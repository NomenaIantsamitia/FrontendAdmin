import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, Clock, Car, User, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";

// Configuration des couleurs
const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

// Composant TimeFilter
const TimeFilter = ({ activeFilter, setActiveFilter }) => {
  const filters = ["daily", "weekly", "monthly"];
  
  return (
    <div className="flex space-x-2 mb-6">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => setActiveFilter(filter)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === filter
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {filter === "daily" && "Aujourd'hui"}
          {filter === "weekly" && "Cette semaine"}
          {filter === "monthly" && "Ce mois"}
        </button>
      ))}
    </div>
  );
};

// Composant StatCard
const StatCard = ({ icon, title, value, change }) => {
  const isPositive = change >= 0;
  
  return (
    <motion.div 
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
      whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
    >
      <div className="flex items-center justify-between">
        <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
          {icon}
        </div>
        <div className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? '+' : ''}{change}%
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-gray-800">{value}</h3>
        <p className="text-sm text-gray-500 mt-1">{title}</p>
      </div>
    </motion.div>
  );
};

// Fonctions utilitaires pour traiter les données
const processData = (rides, users, taxis) => {
  const now = new Date();
  const today = new Date(now.setHours(0, 0, 0, 0));
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // Formater la date selon le format de votre API
  const formatDate = (date) => date.toISOString().split('T')[0];

  // Filtrer les courses par période
  const filterRides = (startDate, endDate = new Date()) => {
    return rides.filter(ride => {
      const rideDate = new Date(ride.createdAt);
      return rideDate >= startDate && rideDate <= endDate;
    });
  };

  // Calculer le revenu
  const calculateRevenue = (rideList) => {
    return rideList
      .filter(ride => ride.status === "terminé" && ride.price)
      .reduce((sum, ride) => sum + ride.price, 0);
  };

  // Compter les nouveaux clients
  const countNewCustomers = (startDate) => {
    return users.filter(user => 
      new Date(user.createdAt) >= startDate && user.role === "client"
    ).length;
  };

  // Compter les annulations
  const countCancellations = (rideList) => {
    return rideList.filter(ride => ride.status === "annulé").length;
  };

  // Préparer les données pour le graphique hebdomadaire
  const prepareWeeklyData = () => {
    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    return days.map((day, index) => {
      const dayStart = new Date(weekStart);
      dayStart.setDate(dayStart.getDate() + index);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayRides = rides.filter(ride => {
        const rideDate = new Date(ride.createdAt);
        return rideDate >= dayStart && rideDate < dayEnd;
      });

      const revenue = calculateRevenue(dayRides);

      return {
        name: day,
        rides: dayRides.length,
        revenue: revenue
      };
    });
  };

  // Préparer les données des conducteurs
  const prepareDriverData = () => {
    const statusCount = {
      disponible: 0,
      occupé: 0,
      "hors service": 0
    };

    taxis.forEach(taxi => {
      statusCount[taxi.status] = (statusCount[taxi.status] || 0) + 1;
    });

    return [
      { name: "Disponibles", value: statusCount.disponible },
      { name: "En course", value: statusCount.occupé },
      { name: "Indisponibles", value: statusCount["hors service"] }
    ];
  };

  return {
    stats: {
      daily: {
        rides: filterRides(today).length,
        revenue: calculateRevenue(filterRides(today)),
        newCustomers: countNewCustomers(today),
        cancellations: countCancellations(filterRides(today))
      },
      weekly: {
        rides: filterRides(weekStart).length,
        revenue: calculateRevenue(filterRides(weekStart)),
        newCustomers: countNewCustomers(weekStart),
        cancellations: countCancellations(filterRides(weekStart))
      },
      monthly: {
        rides: filterRides(monthStart).length,
        revenue: calculateRevenue(filterRides(monthStart)),
        newCustomers: countNewCustomers(monthStart),
        cancellations: countCancellations(filterRides(monthStart))
      }
    },
    weeklyChartData: prepareWeeklyData(),
    driverChartData: prepareDriverData()
  };
};

// Composant principal
const StatisticsPage = () => {
  const [activeFilter, setActiveFilter] = useState("weekly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processedData, setProcessedData] = useState(null);

  // URLs des API (à adapter selon votre configuration)
  const API_ENDPOINTS = {
    taxis: 'http://localhost:5000/api/taxis',
    users: 'http://localhost:5000/api/users',
    rides: 'http://localhost:5000/api/rides'
  };

  // Charger les données depuis les APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Récupérer toutes les données en parallèle
        const [taxisRes, usersRes, ridesRes] = await Promise.all([
          axios.get(API_ENDPOINTS.taxis),
          axios.get(API_ENDPOINTS.users),
          axios.get(API_ENDPOINTS.rides)
        ]);

        // Traiter les données reçues
        const data = processData(ridesRes.data, usersRes.data, taxisRes.data);
        setProcessedData(data);
        
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        setError("Erreur de chargement des données. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Afficher le chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Afficher les erreurs
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        {error}
      </div>
    );
  }

  // Vérifier si les données sont prêtes
  if (!processedData) {
    return null;
  }

  const { stats, weeklyChartData, driverChartData } = processedData;
  const currentStats = stats[activeFilter];


  return (
    <div className="container mx-auto px-4 pt-20">
      <div className="flex justify-between items-center mb-8">
        <motion.h1 
          className="text-3xl font-bold text-gray-800"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Statistiques
        </motion.h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar size={16} />
          <span>Mis à jour: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
      
      <TimeFilter activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
      
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon={<Car size={20} />} 
          title="Courses effectuées" 
          value={currentStats.rides} 
          change={7.5} 
        />
        <StatCard 
          icon={<DollarSign size={20} />} 
          title="Revenu total" 
          value={`${currentStats.revenue?.toFixed(2) || '0.00'} €`} 
          change={12.3} 
        />
        <StatCard 
          icon={<User size={20} />} 
          title="Nouveaux clients" 
          value={currentStats.newCustomers} 
          change={4.2} 
        />
        <StatCard 
          icon={<AlertCircle size={20} />} 
          title="Annulations" 
          value={currentStats.cancellations} 
          change={-2.1} 
        />
      </div>
      
      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp size={18} className="mr-2 text-blue-600" />
            Activité hebdomadaire
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#0088FE" />
                <YAxis yAxisId="right" orientation="right" stroke="#FF8042" />
                <Tooltip formatter={(value) => [`${value}`, value === weeklyChartData[0]?.rides ? "Courses" : "Revenu (€)"]} />
                <Legend />
                <Bar yAxisId="left" dataKey="rides" name="Courses" fill="#0088FE" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="revenue" name="Revenu (€)" fill="#FF8042" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Car size={18} className="mr-2 text-blue-600" />
            Statut des conducteurs
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={driverChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {driverChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, "Conducteurs"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
      
      {/* Détails supplémentaires */}
      <motion.div 
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-lg font-semibold mb-4">Détails des performances</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">Heures chargées</h4>
            <p className="text-2xl font-bold">11h-13h</p>
            <p className="text-sm text-gray-500 mt-1">Pic d'activité</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">Durée moyenne</h4>
            <p className="text-2xl font-bold">15 min</p>
            <p className="text-sm text-gray-500 mt-1">Par course</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">Note moyenne</h4>
            <p className="text-2xl font-bold">4.5/5</p>
            <p className="text-sm text-gray-500 mt-1">Satisfaction clients</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StatisticsPage;