import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  User,
  Search,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Filter,
  ChevronDown,
  ChevronUp,
  Loader2, // Icône de chargement
  AlertCircle // Icône d'erreur
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // Import AnimatePresence

const AdminClientsPage = () => {
  // Liste complète des clients, filtrée par rôle 'client' après le fetch initial
  const [clients, setClients] = useState([]);
  // Liste filtrée (par recherche/filtres), triée et paginée pour l'affichage
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [clientsPerPage] = useState(10); // Nombre d'éléments par page
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' }); // Configuration du tri

  // --- États pour les filtres ---
  // verified: null (Tous), true (Vérifiés), false (Non vérifiés)
  const [filterVerified, setFilterVerified] = useState(null);
  // active: null (Tous), true (Actifs), false (Inactifs)
  // NOTE TRÈS IMPORTANTE : Le filtre 'active' et le tri par 'Courses Terminées'
  // NE FONCTIONNERONT CORRECTEMENT QUE SI VOTRE API BACKEND /api/users
  // CALCULE ET INCLUT UNE PROPRIÉTÉ 'ridesCount' (nombre de courses terminées)
  // POUR CHAQUE CLIENT DANS LA RÉPONSE.
  // Si votre backend ne fournit pas 'ridesCount', ce filtre et ce tri seront inopérants.
  const [filterActive, setFilterActive] = useState(null);
  // -----------------------------

  // --- États et Refs pour les dropdowns de filtre ---
  const [showVerifiedFilterDropdown, setShowVerifiedFilterDropdown] = useState(false);
  const [showActiveFilterDropdown, setShowActiveFilterDropdown] = useState(false);
  const verifiedButtonRef = useRef(null);
  const verifiedDropdownRef = useRef(null);
  const activeButtonRef = useRef(null);
  const activeDropdownRef = useRef(null);
  // -------------------------------------------------


  const navigate = useNavigate(); // Hook pour la navigation (si besoin pour l'édition)

  // 1. Fetch clients from API on mount
  useEffect(() => {
    const fetchClients = async () => {
        try {
          setLoading(true);
          setError(null); // Clear previous errors

          // NOTE BACKEND: Idéalement, votre API /api/users devrait avoir un paramètre
          // pour filtrer par rôle (e.g., /api/users?role=client) et potentiellement
          // inclure le compte des courses si le filtre 'active' est utilisé.
          // Ici, nous récupérons tous les utilisateurs et filtrons côté frontend.
          // ASSUREZ-VOUS QUE CETTE API RENVOIE BIEN LES USERS AVEC role='client'
          // ET SI POSSIBLE, AJOUTE LA PROPRIÉTÉ 'ridesCount' CALCULÉE.
          const response = await axios.get('http://localhost:5000/api/userRides');

          // Filtrer les utilisateurs pour ne garder que les clients
          // Cette étape est nécessaire si l'API /api/users renvoie tous les rôles.
          const allUsers = response.data;
          const clientUsers = allUsers.filter(user => user.role === 'client');

          // NOTE DEPENDANCE: Pour que le filtre 'actif' fonctionne, chaque objet client
          // dans clientUsers doit avoir une propriété 'ridesCount' (nombre de courses terminées)
          // calculée par le backend. Si ce n'est pas le cas, le filtre 'active' ne fonctionnera pas.
          // Exemple de données attendues pour un client: { _id: "...", name: "...", role: "client", ridesCount: 5 }

          setClients(clientUsers); // Store the list of clients
          // setFilteredClients is handled by the next useEffect
        } catch (err) {
          console.error('Erreur lors du chargement des clients :', err);
          // Display a more specific error message if available
          setError(err.response?.data?.message || 'Erreur de chargement des clients. Veuillez vérifier la connexion.');
          setClients([]); // Ensure clients list is empty on error
        } finally {
          setLoading(false);
        }
      };

    fetchClients();
  }, []); // Empty dependency array: runs only once on mount

  // 2. Apply filter, search, and sort whenever dependencies change
  useEffect(() => {
    let result = [...clients]; // Start with the full list of clients

    // --- 2a. Apply Search ---
    if (searchTerm) {
      result = result.filter(client =>
        (client.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || // Use optional chaining and default empty string
        (client.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (client.phone?.includes(searchTerm) || '') // Phone might not be string, handle safely
      );
    }

    // --- 2b. Apply Filters ---
    // Filter by verification status
    if (filterVerified !== null) {
      result = result.filter(client => client.isVerified === filterVerified);
    }

    // Filter by activity status
    // NOTE DEPENDANCE: This filter requires 'ridesCount' property on client objects from the backend
    if (filterActive !== null) {
       result = result.filter(client => {
           // Ensure ridesCount exists and is a number before comparing
           // If ridesCount is not provided by the backend, this filter will treat all clients as inactive (unless filterActive is true)
           const hasRides = typeof client.ridesCount === 'number' && client.ridesCount > 0;
           return filterActive ? hasRides : !hasRides; // Filter for active (has rides) or inactive (no rides)
       });
    }


    // --- 2c. Apply Sorting ---
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue, bValue;

        // Access nested or direct properties safely
         // Handle potential missing values
        aValue = a[sortConfig.key];
        bValue = b[sortConfig.key];


        // Special handling for date sorting (createdAt)
        if (sortConfig.key === 'createdAt') {
            // Convert MongoDB date object or ISO string to Date objects for comparison
            const dateA = new Date(aValue?.$date || aValue);
            const dateB = new Date(bValue?.$date || bValue);

            // Handle invalid dates
            if (isNaN(dateA.getTime())) aValue = new Date(0); // Treat invalid date as very old
            else aValue = dateA;

            if (isNaN(dateB.getTime())) bValue = new Date(0);
            else bValue = dateB;

        } else if (sortConfig.key === 'ridesCount') {
             // Handle ridesCount sorting (assuming it's a number)
             // Treat non-numeric/missing ridesCount as 0 for sorting purposes
             aValue = typeof aValue === 'number' ? aValue : 0;
             bValue = typeof bValue === 'number' ? bValue : 0;
        }
        else {
             // Handle null/undefined values for other types, treat as empty string for consistent sorting
             if (aValue === null || aValue === undefined) aValue = '';
             if (bValue === null || bValue === undefined) bValue = '';

             // Case-insensitive comparison for strings
             if (typeof aValue === 'string' && typeof bValue === 'string') {
               aValue = aValue.toLowerCase();
               bValue = bValue.toLowerCase();
             }
        }


        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredClients(result);
    setCurrentPage(1); // Reset pagination when filter, search, or sort changes
  }, [searchTerm, clients, sortConfig.key, sortConfig.direction, filterVerified, filterActive]); // Add filter states to dependencies


  // 3. Sort function (just updates sortConfig state)
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    // Sorting logic is applied in the useEffect above when sortConfig changes
  };

  // 4. Pagination calculation
  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient);
  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);

  // 5. Handle client actions (Edit, Delete)
  const handleEdit = (clientId) => {
    // NOTE: This requires a route and component for editing a client
    navigate(`/admin/clients/edit/${clientId}`);
  };

  const handleDelete = async (clientId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        // NOTE BACKEND: Cet endpoint DELETE doit supprimer le document User avec le rôle 'client'.
        // Assurez-vous que votre backend gère correctement la suppression des clients.
        await axios.delete(`http://localhost:5000/api/users/${clientId}`);

        // Optimistic update: Remove the client from the lists
        setClients(prevClients => prevClients.filter(client => client._id !== clientId));

        alert('Client supprimé avec succès.'); // User feedback
      } catch (err) {
        console.error('Erreur lors de la suppression :', err);
        const deleteError = err.response?.data?.message || 'Erreur lors de la suppression du client.';
        setError(deleteError); // Set error state
        alert(`Erreur lors de la suppression : ${deleteError}`); // User feedback
        // Optional: Re-fetch data to ensure state consistency if deletion failed on backend
        // fetchClients();
      }
    }
  };

  // --- Handle filter selection from dropdowns ---
  const handleVerifiedFilterSelect = (status) => {
    setFilterVerified(status);
    setShowVerifiedFilterDropdown(false); // Close dropdown after selection
  };

   const handleActiveFilterSelect = (status) => {
    setFilterActive(status);
    setShowActiveFilterDropdown(false); // Close dropdown after selection
  };
  // ---------------------------------------------

   // --- Effect pour fermer les dropdowns lors d'un clic à l'extérieur ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close Verified dropdown if click is outside its button and dropdown content
      if (showVerifiedFilterDropdown && verifiedButtonRef.current && !verifiedButtonRef.current.contains(event.target) &&
          verifiedDropdownRef.current && !verifiedDropdownRef.current.contains(event.target)
      ) {
        setShowVerifiedFilterDropdown(false);
      }
      // Close Active dropdown if click is outside its button and dropdown content
      if (showActiveFilterDropdown && activeButtonRef.current && !activeButtonRef.current.contains(event.target) &&
          activeDropdownRef.current && !activeDropdownRef.current.contains(event.target)
      ) {
        setShowActiveFilterDropdown(false);
      }
    };

    // Add event listener when either dropdown is shown
    if (showVerifiedFilterDropdown || showActiveFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside); // Use mousedown or click
    }

    // Clean up event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVerifiedFilterDropdown, showActiveFilterDropdown]); // Re-run effect when dropdown visibility changes
  // ------------------------------------------------------------------------------


  // Conditional rendering for initial loading (shows spinner if loading and no data yet)
  if (loading && clients.length === 0 && filteredClients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen pt-20"> {/* Use h-screen for full page */}
        <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
        <p className="ml-4 text-gray-600 mt-2">Chargement des clients...</p>
      </div>
    );
  }

  // Conditional rendering for error when NO data could be loaded
  if (error && clients.length === 0 && filteredClients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen pt-20 text-red-600"> {/* Use h-screen */}
        <AlertCircle size={36} className="mb-4"/>
        <p className="text-lg font-semibold">Erreur de chargement</p>
        <p className="text-sm text-gray-500 mt-2">{error}</p>
         {/* Add a retry button */}
         <button onClick={() => { setLoading(true); setError(null); /* Re-trigger fetch logic */ }} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Réessayer</button>
      </div>
    );
  }


  // Main render content
  return (
    <div className="container mx-auto px-4 pt-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center"> {/* Adjusted size */}
          <User className="mr-3" size={32} /> {/* Larger icon, more margin */}
          Gestion des Clients
        </h1>
        {/* Add Client button (Placeholder - requires a form modal or new page) */}
        {/* <button
          onClick={() => navigate('/admin/clients/new')} // Example navigation for adding
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium"
        >
          <Plus size={18} className="mr-2" />
          Ajouter un Client
        </button> */}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-100"> {/* Added border */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} /> {/* Vertically centered icon */}
            <input
              type="text"
              placeholder="Rechercher par Nom, Email, Téléphone..." // More specific placeholder
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" // Added text-sm
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Buttons and Dropdowns */}
          <div className="flex space-x-2 flex-shrink-0"> {/* Prevent buttons from growing */}

            {/* Verified Filter Button and Dropdown */}
            <div className="relative"> {/* Wrapper for positioning dropdown */}
                <button
                  ref={verifiedButtonRef} // Attach ref
                  onClick={() => setShowVerifiedFilterDropdown(!showVerifiedFilterDropdown)}
                  className={`px-3 py-2 rounded-lg flex items-center text-sm font-medium border ${
                    filterVerified === true
                      ? 'bg-green-100 border-green-500 text-green-800' // Verified: Green
                      : filterVerified === false
                        ? 'bg-yellow-100 border-yellow-500 text-yellow-800' // Not Verified: Yellow
                        : 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200' // All: Gray
                  }`}
                >
                  Vérifié:
                  <span className="ml-1 font-semibold">
                     {filterVerified === true ? 'Oui' : filterVerified === false ? 'Non' : 'Tous'}
                  </span>
                  {/* Show appropriate icon */}
                  {showVerifiedFilterDropdown ? (
                     <ChevronUp className="ml-2" size={16} />
                  ) : (
                     <ChevronDown className="ml-2" size={16} />
                  )}
                </button>

                {/* Verified Filter Dropdown Content */}
                <AnimatePresence>
                  {showVerifiedFilterDropdown && (
                    <motion.div
                      ref={verifiedDropdownRef} // Attach ref
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 origin-top-right"
                    >
                      <div className="py-1">
                        {/* Options: Tous, Oui, Non */}
                        <button
                           onClick={() => handleVerifiedFilterSelect(null)}
                           className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                           Tous
                        </button>
                        <button
                           onClick={() => handleVerifiedFilterSelect(true)}
                           className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                           Oui
                        </button>
                         <button
                           onClick={() => handleVerifiedFilterSelect(false)}
                           className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                           Non
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>


            {/* Active Filter Button and Dropdown */}
             {/* NOTE DEPENDANCE: This filter's logic relies on 'ridesCount' from the backend */}
            <div className="relative"> {/* Wrapper for positioning dropdown */}
                <button
                  ref={activeButtonRef} // Attach ref
                  onClick={() => setShowActiveFilterDropdown(!showActiveFilterDropdown)}
                  className={`px-3 py-2 rounded-lg flex items-center text-sm font-medium border ${
                    filterActive === true
                      ? 'bg-blue-100 border-blue-500 text-blue-800' // Active: Blue
                      : filterActive === false
                        ? 'bg-red-100 border-red-500 text-red-800' // Inactive: Red
                        : 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200' // All: Gray
                  }`}
                >
                  Actif:
                  <span className="ml-1 font-semibold">
                    {filterActive === true ? 'Oui' : filterActive === false ? 'Non' : 'Tous'}
                  </span>
                   {/* Show appropriate icon */}
                  {showActiveFilterDropdown ? (
                     <ChevronUp className="ml-2" size={16} />
                  ) : (
                     <ChevronDown className="ml-2" size={16} />
                  )}
                </button>

                 {/* Active Filter Dropdown Content */}
                <AnimatePresence>
                  {showActiveFilterDropdown && (
                    <motion.div
                      ref={activeDropdownRef} // Attach ref
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 origin-top-right"
                    >
                      <div className="py-1">
                         {/* Options: Tous, Oui, Non */}
                        <button
                           onClick={() => handleActiveFilterSelect(null)}
                           className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                           Tous
                        </button>
                        <button
                           onClick={() => handleActiveFilterSelect(true)}
                           className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                           Oui
                        </button>
                         <button
                           onClick={() => handleActiveFilterSelect(false)}
                           className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                           Non
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>

          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto"> {/* Allows horizontal scrolling on small screens */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center">
                    Nom
                    {sortConfig.key === 'name' && (
                      sortConfig.direction === 'asc' ?
                        <ChevronUp className="ml-1" size={16} /> :
                        <ChevronDown className="ml-1" size={16} />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Téléphone
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('isVerified')}
                >
                  <div className="flex items-center">
                    Statut
                    {sortConfig.key === 'isVerified' && (
                      sortConfig.direction === 'asc' ?
                        <ChevronUp className="ml-1" size={16} /> :
                        <ChevronDown className="ml-1" size={16} />
                    )}
                  </div>
                </th>
                {/* NOTE DEPENDANCE: Sorting by ridesCount requires 'ridesCount' from backend */}
                 <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('ridesCount')} // Assuming 'ridesCount' exists for sorting
                >
                  <div className="flex items-center">
                    Courses Terminées
                    {sortConfig.key === 'ridesCount' && (
                      sortConfig.direction === 'asc' ?
                        <ChevronUp className="ml-1" size={16} /> :
                        <ChevronDown className="ml-1" size={16} />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('createdAt')}
                >
                  <div className="flex items-center">
                    Inscription
                    {sortConfig.key === 'createdAt' && (
                      sortConfig.direction === 'asc' ?
                        <ChevronUp className="ml-1" size={16} /> :
                        <ChevronDown className="ml-1" size={16} />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Show loading spinner in table body if data is being filtered/sorted after initial load */}
               {loading && clients.length > 0 ? (
                 <tr>
                   <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                     <Loader2 className="animate-spin h-5 w-5 text-blue-500 inline-block mr-2" />
                     Mise à jour de la liste...
                   </td>
                 </tr>
               ) : currentClients.length > 0 ? (
                currentClients.map((client) => (
                  <motion.tr
                    key={client._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="text-blue-600" size={20} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{client.name || 'N/A'}</div> {/* Handle missing name */}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.email || 'N/A'} {/* Handle missing email */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.phone || 'N/A'} {/* Handle missing phone */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        client.isVerified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {client.isVerified ? 'Vérifié' : 'Non vérifié'}
                      </span>
                    </td>
                     {/* Display ridesCount if available */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                       {typeof client.ridesCount === 'number' ? client.ridesCount : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {/* Format date safely */}
                       {client.createdAt ? new Date(client.createdAt.$date || client.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {/* Edit Button (Placeholder - requires edit page/modal) */}
                        {/* <button
                          onClick={() => handleEdit(client._id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Modifier ce client"
                        >
                          <Edit size={18} />
                        </button> */}
                        <button
                          onClick={() => handleDelete(client._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer ce client"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                 /* Message if no clients match filter/search after loading */
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    {loading ? "Chargement..." : "Aucun client trouvé pour les critères sélectionnés."}
                  </td>
                </tr>
              )}
            </tbody>
             {/* Message if no clients at all after initial load and no error */}
             {clients.length === 0 && !loading && !error && (
               <tfoot>
                 <tr>
                   <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                     Aucun client dans le système.
                   </td>
                 </tr>
               </tfoot>
             )}
          </table>
        </div>

        {/* Pagination */}
        {filteredClients.length > 0 && ( // Only show pagination if there are items to paginate
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            {/* Mobile pagination */}
            <div className="flex-1 flex justify-between sm:hidden">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Précédent</button> {/* Added disabled styles */}
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Suivant</button> {/* Added disabled styles */}
            </div>
            {/* Desktop pagination */}
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Affichage de <span className="font-medium">{filteredClients.length > 0 ? indexOfFirstClient + 1 : 0}</span> à{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastClient, filteredClients.length)}
                  </span>{' '}
                  sur <span className="font-medium">{filteredClients.length}</span> clients
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <ArrowLeft size={16} />
                  </button>
                  {/* Page numbers (simplified - can add ellipsis for many pages) */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      onClick={() => setCurrentPage(number)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        number === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <ArrowRight size={16} />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminClientsPage;
