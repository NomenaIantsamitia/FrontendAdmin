import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, Clock, Car, User, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

// Données simulées pour les statistiques
const STATS_DATA = {
  daily: {
    rides: 124,
    revenue: 1860,
    newCustomers: 18,
    cancellations: 5
  },
  weekly: {
    rides: 892,
    revenue: 13380,
    newCustomers: 126,
    cancellations: 42
  },
  monthly: {
    rides: 3720,
    revenue: 55800,
    newCustomers: 540,
    cancellations: 180
  }
};

const RIDE_DATA = [
  { name: "Lun", rides: 120, revenue: 1800 },
  { name: "Mar", rides: 150, revenue: 2250 },
  { name: "Mer", rides: 180, revenue: 2700 },
  { name: "Jeu", rides: 110, revenue: 1650 },
  { name: "Ven", rides: 200, revenue: 3000 },
  { name: "Sam", rides: 240, revenue: 3600 },
  { name: "Dim", rides: 210, revenue: 3150 }
];

const DRIVER_DATA = [
  { name: "Disponibles", value: 18 },
  { name: "En course", value: 6 },
  { name: "Indisponibles", value: 4 }
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

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

const StatisticsPage = () => {
  const [activeFilter, setActiveFilter] = useState("weekly");
  const [loading, setLoading] = useState(false);
  
  // Simuler le chargement des données
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [activeFilter]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  const currentStats = STATS_DATA[activeFilter];
  
  return (
    <div className="container mx-auto px-4 py-8">
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
          value={`${currentStats.revenue} €`} 
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
              <BarChart data={RIDE_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#0088FE" />
                <YAxis yAxisId="right" orientation="right" stroke="#FF8042" />
                <Tooltip />
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
                  data={DRIVER_DATA}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {DRIVER_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
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
            <p className="text-2xl font-bold">17h-19h</p>
            <p className="text-sm text-gray-500 mt-1">Pic d'activité</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">Durée moyenne</h4>
            <p className="text-2xl font-bold">23 min</p>
            <p className="text-sm text-gray-500 mt-1">Par course</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">Note moyenne</h4>
            <p className="text-2xl font-bold">4.7/5</p>
            <p className="text-sm text-gray-500 mt-1">Satisfaction clients</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StatisticsPage;