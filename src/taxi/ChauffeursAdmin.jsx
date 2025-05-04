import React, { useState, useEffect, useRef } from 'react'; // Import useRef
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
    Car,
    Loader2,
    AlertCircle,
    Eye, // Icon for showing password
    EyeOff // Icon for hiding password
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // Import AnimatePresence

const ChauffeursAdmin = () => {
    const [chauffeurs, setChauffeurs] = useState([]);
    const [filteredChauffeurs, setFilteredChauffeurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [chauffeursPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [showFormModal, setShowFormModal] = useState(false);
    const [selectedChauffeur, setSelectedChauffeur] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState(null); // State for form specific errors (like password mismatch)


    // --- Nouveaux états pour le filtre de statut ---
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'disponible', 'occupé', 'hors service'
    const [showStatusFilterDropdown, setShowStatusFilterDropdown] = useState(false);

    // Refs pour détecter les clics extérieurs (pour fermer le dropdown)
    const filterButtonRef = useRef(null);
    const filterDropdownRef = useRef(null);
    // --------------------------------------------------

    // --- États pour les champs password et leur visibilité ---
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '', // Champ password
        confirmPassword: '', // Nouveau champ pour confirmer le mot de passe
        taxi: {
            licensePlate: '',
            marque: '',
            model: '',
            color: '',
            status: 'disponible'
        }
    });
    const [showPassword, setShowPassword] = useState(false); // État pour afficher/masquer le mot de passe
    // --------------------------------------------------------


    // 1. Fetch chauffeurs from API on mount
    useEffect(() => {
        const fetchChauffeurs = async () => {
            try {
                setLoading(true);
                setError(null); // Clear main error state
                // Assuming this endpoint returns taxi documents, populated with driverId
                const response = await axios.get('http://localhost:5000/api/taxis');
                setChauffeurs(response.data);
                // Do NOT set filteredChauffeurs here. The useEffect below will handle initial filtering/sorting.
            } catch (err) {
                console.error('Erreur lors du chargement des chauffeurs :', err);
                setError(err.response?.data?.message || 'Erreur de chargement des chauffeurs. Veuillez vérifier la connexion.');
                setChauffeurs([]); // Ensure chauffeurs list is empty on error
            } finally {
                setLoading(false);
            }
        };

        fetchChauffeurs();
    }, []);

    // 2. Apply filter, search, and sort whenever dependencies change
    useEffect(() => {
        let result = [...chauffeurs];

        // --- 2a. Apply Status Filter ---
        if (filterStatus !== 'all') {
            result = result.filter(chauffeur => chauffeur.status === filterStatus);
        }

        // --- 2b. Apply Search ---
        if (searchTerm) {
            result = result.filter(chauffeur =>
                // Use optional chaining and default empty string for safety
                (chauffeur.driverId?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (chauffeur.driverId?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (chauffeur.driverId?.phone?.includes(searchTerm) || '') ||
                (chauffeur.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
                (chauffeur.marque?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
                (chauffeur.model?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
            );
        }

        // --- 2c. Apply Sorting ---
        if (sortConfig.key) {
            result.sort((a, b) => {
                let aValue, bValue;
                // Access nested or direct properties safely
                if (sortConfig.key.includes('driverId.')) {
                    const nestedKey = sortConfig.key.split('.')[1];
                    aValue = a.driverId?.[nestedKey];
                    bValue = b.driverId?.[nestedKey];
                } else {
                    aValue = a[sortConfig.key];
                    bValue = b[sortConfig.key];
                }

                // Handle null/undefined values and ensure consistent comparison (e.g., treat null as less than non-null)
                if (aValue === null || aValue === undefined) aValue = ''; // Treat null/undefined as empty string for sorting
                if (bValue === null || bValue === undefined) bValue = '';

                // Case-insensitive comparison for strings
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }


        setFilteredChauffeurs(result);
        setCurrentPage(1); // Reset pagination when filter, search, or sort changes
    }, [searchTerm, chauffeurs, sortConfig.key, sortConfig.direction, filterStatus]); // Add filterStatus to dependencies


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
    const indexOfLastChauffeur = currentPage * chauffeursPerPage;
    const indexOfFirstChauffeur = indexOfLastChauffeur - chauffeursPerPage;
    const currentChauffeurs = filteredChauffeurs.slice(indexOfFirstChauffeur, indexOfLastChauffeur);
    const totalPages = Math.ceil(filteredChauffeurs.length / chauffeursPerPage);

    // 5. Handle chauffeur actions (Edit, Delete, Form Submit, Input Change, Reset Form)
    const handleEdit = (chauffeur) => {
        setSelectedChauffeur(chauffeur);
        setFormData({
            name: chauffeur.driverId?.name || '',
            email: chauffeur.driverId?.email || '',
            phone: chauffeur.driverId?.phone || '',
            password: '', // Ne pas pré-remplir le champ password pour l'édition
            confirmPassword: '', // Réinitialiser le champ de confirmation
            taxi: {
                licensePlate: chauffeur.licensePlate || '',
                marque: chauffeur.marque || '',
                model: chauffeur.model || '',
                color: chauffeur.color || '',
                status: chauffeur.status || 'disponible'
            }
        });
        setShowFormModal(true);
        setFormError(null); // Clear form errors on opening modal
        setShowPassword(false); // Hide password by default on opening modal
    };

    const handleDelete = async (chauffeur) => {
        // Confirm deletion with the user
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer le chauffeur "${chauffeur.driverId?.name || 'N/A'}" et son taxi (${chauffeur.licensePlate || 'N/A'}) ?`)) {
            try {
                // Assuming this endpoint deletes the taxi and potentially the linked driver user
                await axios.delete(`http://localhost:5000/api/taxis/${chauffeur._id}`);

                // Optimistically update the original chauffeurs list state
                setChauffeurs(prevChauffeurs => prevChauffeurs.filter(c => c._id !== chauffeur._id));

                alert('Chauffeur supprimé avec succès.'); // User feedback
            } catch (err) {
                console.error('Erreur lors de la suppression :', err);
                const deleteError = err.response?.data?.message || 'Erreur lors de la suppression du chauffeur.';
                setError(deleteError); // Set main error state
                alert(`Erreur lors de la suppression : ${deleteError}`); // User feedback
                 // Optional: Re-fetch data to ensure state consistency if deletion failed on backend
                 // fetchChauffeurs();
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError(null); // Clear previous form errors

        // --- Validation for creation mode ---
        if (!selectedChauffeur) { // Only validate password fields on creation
            if (formData.password !== formData.confirmPassword) {
                setFormError('Les mots de passe ne correspondent pas.');
                setIsSubmitting(false);
                return; // Stop submission
            }
             if (!formData.password) {
                 setFormError('Le mot de passe est requis.');
                 setIsSubmitting(false);
                 return; // Stop submission
             }
        }
        // ------------------------------------


        try {
            if (selectedChauffeur) {
                // --- Update Existing Chauffeur and Taxi ---
                // Assuming your PUT /api/taxis/:id endpoint handles updating both the Taxi and the linked User (driver)
                const updatePayload = {
                    // Fields for the linked User (driver)
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    // Note: Password update is typically handled separately in a real app
                    // If you need password update here, add a dedicated field and backend logic
                    // Fields for the Taxi
                    licensePlate: formData.taxi.licensePlate,
                    marque: formData.taxi.marque,
                    model: formData.taxi.model,
                    color: formData.taxi.color,
                    status: formData.taxi.status,
                    // Include the driverId to help the backend find the correct User to update
                    driverId: selectedChauffeur.driverId?._id // Use optional chaining
                };
                await axios.put(`http://localhost:5000/api/taxis/${selectedChauffeur._id}`, updatePayload);
                alert('Chauffeur et Taxi mis à jour avec succès !');

            } else {
                // --- Create New Chauffeur and Taxi ---
                // Assuming your POST /api/creerUsers endpoint handles creating a User with role 'chauffeur' AND linking/creating a Taxi for them
                const createPayload = {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password, // Inclure le champ password pour la création
                    role: 'chauffeur', // Ensure the role is set correctly
                    licensePlate: formData.taxi.licensePlate,
                    marque: formData.taxi.marque,
                    model: formData.taxi.model,
                    color: formData.taxi.color,
                    status: formData.taxi.status
                };
                await axios.post('http://localhost:5000/api/taxis', createPayload); // Assuming this endpoint handles User+Taxi creation
                alert('Chauffeur et Taxi créés avec succès !');
            }

            // Refresh the main list after successful operation
            // Re-fetching ensures the list is up-to-date with any changes
            const response = await axios.get('http://localhost:5000/api/taxis');
            setChauffeurs(response.data); // This will trigger the useEffect to re-filter/sort/paginate

            // Reset form and close modal
            resetForm();

        } catch (err) {
            console.error('Erreur lors de la soumission du formulaire :', err);
            const submitError = err.response?.data?.message || 'Une erreur est survenue lors de l\'enregistrement.';
            setFormError(submitError); // Set form specific error state
            alert(`Erreur lors de l\'enregistrement : ${submitError}`); // User feedback
        } finally {
            setIsSubmitting(false); // Stop submitting state
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            password: '', // Réinitialiser le champ password
            confirmPassword: '', // Réinitialiser le champ de confirmation
            taxi: {
                licensePlate: '',
                marque: '',
                model: '',
                color: '',
                status: 'disponible'
            }
        });
        setSelectedChauffeur(null);
        setShowFormModal(false);
        setFormError(null); // Clear form errors on closing modal
        setShowPassword(false); // Hide password on closing modal
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name.startsWith('taxi.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                taxi: {
                    ...prev.taxi,
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // --- Effect pour fermer le dropdown du filtre de statut lors d'un clic à l'extérieur ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Close dropdown if click is outside the button and the dropdown content
            if (filterButtonRef.current && !filterButtonRef.current.contains(event.target) &&
                filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)
            ) {
                setShowStatusFilterDropdown(false);
            }
        };

        // Add event listener when dropdown is shown
        if (showStatusFilterDropdown) {
            document.addEventListener('mousedown', handleClickOutside); // Use mousedown or click
        }

        // Clean up event listener
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showStatusFilterDropdown]); // Re-run effect when dropdown visibility changes
    // ------------------------------------------------------------------------------


    // Conditional rendering for initial loading (shows spinner if loading and no data yet)
    if (loading && chauffeurs.length === 0 && filteredChauffeurs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen pt-20"> {/* Use h-screen for full page */}
                <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
                <p className="ml-4 text-gray-600 mt-2">Chargement des chauffeurs...</p>
            </div>
        );
    }

    // Conditional rendering for error when NO data could be loaded
    if (error && chauffeurs.length === 0 && filteredChauffeurs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen pt-20 text-red-600"> {/* Use h-screen */}
                <AlertCircle size={36} className="mb-4" />
                <p className="text-lg font-semibold">Erreur de chargement</p>
                <p className="text-sm text-gray-500 mt-2">{error}</p>
                {/* Add a retry button */}
                <button onClick={fetchChauffeurs} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Réessayer</button>
            </div>
        );
    }


    // Main render content
    return (
        <div className="container mx-auto px-4 pt-20">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <motion.h1
                    className="text-3xl font-bold text-gray-800 flex items-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <Car className="mr-3" size={32} /> {/* Larger icon, more margin */}
                    Gestion des Chauffeurs
                </motion.h1>
                <button
                    onClick={() => setShowFormModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium"
                >
                    <Plus size={18} className="mr-2" />
                    Ajouter un Chauffeur
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Search Input */}
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher par Nom, Email, Téléphone, Immatriculation, Marque, Modèle..."
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" // Added text-sm
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filter Button and Dropdown */}
                    <div className="relative flex-shrink-0">
                        <button
                            ref={filterButtonRef} // Attach ref
                            onClick={() => setShowStatusFilterDropdown(!showStatusFilterDropdown)}
                            className={`px-3 py-2 rounded-lg flex items-center text-sm font-medium border ${filterStatus !== 'all' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200'
                                }`}
                        >
                            Statut: <span className="ml-1 font-semibold">{filterStatus === 'all' ? 'Tous' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}</span>
                            {showStatusFilterDropdown ? <ChevronUp className="ml-2" size={16} /> : <ChevronDown className="ml-2" size={16} />}
                        </button>

                        {/* Use AnimatePresence for exit animation */}
                        <AnimatePresence>
                            {showStatusFilterDropdown && (
                                <motion.div
                                    ref={filterDropdownRef} // Attach ref
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.2 }} // Animation duration
                                    className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 origin-top-right" // Added origin
                                >
                                    <div className="py-1">
                                        {['all', 'disponible', 'occupé', 'hors service'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => {
                                                    setFilterStatus(status);
                                                    setShowStatusFilterDropdown(false);
                                                }}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                {status === 'all' ? 'Tous' : status.charAt(0).toUpperCase() + status.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Chauffeurs Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => requestSort('driverId.name')}
                                >
                                    <div className="flex items-center">
                                        Nom
                                        {sortConfig.key === 'driverId.name' && (
                                            sortConfig.direction === 'asc' ?
                                                <ChevronUp className="ml-1" size={16} /> :
                                                <ChevronDown className="ml-1" size={16} />
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Véhicule
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => requestSort('licensePlate')}
                                >
                                    <div className="flex items-center">
                                        Immatriculation
                                        {sortConfig.key === 'licensePlate' && (
                                            sortConfig.direction === 'asc' ?
                                                <ChevronUp className="ml-1" size={16} /> :
                                                <ChevronDown className="ml-1" size={16} />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => requestSort('status')}
                                >
                                    <div className="flex items-center">
                                        Status
                                        {sortConfig.key === 'status' && (
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
                            {currentChauffeurs.length > 0 ? (
                                currentChauffeurs.map((chauffeur) => (
                                    <motion.tr
                                        key={chauffeur._id}
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
                                                    <div className="text-sm font-medium text-gray-900">{chauffeur.driverId?.name || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{chauffeur.driverId?.email || 'N/A'}</div>
                                            <div className="text-sm text-gray-500">{chauffeur.driverId?.phone || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {chauffeur.marque || 'N/A'} {chauffeur.model || 'N/A'}
                                            </div>
                                            <div className="text-sm text-gray-500">{chauffeur.color || 'Non spécifié'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-blue-600">
                                            {chauffeur.licensePlate || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${chauffeur.status === 'disponible'
                                                    ? 'bg-green-100 text-green-800'
                                                    : chauffeur.status === 'occupé'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                {chauffeur.status || 'Inconnu'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(chauffeur)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(chauffeur)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
            
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                                        Aucun chauffeur trouvé pour les critères sélectionnés.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {filteredChauffeurs.length === 0 && !loading && ( // Message if no chauffeurs at all after loading
                            <tfoot>
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                                        Aucun chauffeur dans le système. Utilisez le bouton "Ajouter un Chauffeur" pour en créer un.
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                {/* Pagination */}
                {filteredChauffeurs.length > 0 && ( // Only show pagination if there are items to paginate
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
                                    Affichage de <span className="font-medium">{filteredChauffeurs.length > 0 ? indexOfFirstChauffeur + 1 : 0}</span> à{' '}
                                    <span className="font-medium">
                                        {Math.min(indexOfLastChauffeur, filteredChauffeurs.length)}
                                    </span>{' '}
                                    sur <span className="font-medium">{filteredChauffeurs.length}</span> chauffeurs
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        <ArrowLeft size={16} />
                                    </button>
                                    
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                                        <button
                                            key={number}
                                            onClick={() => setCurrentPage(number)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${number === currentPage
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
                                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
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


            {/* Form Modal */}
            {/* Use AnimatePresence for modal animations */}
            <AnimatePresence>
                {showFormModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6">
                                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                                    {selectedChauffeur ? 'Modifier Chauffeur' : 'Ajouter un Nouveau Chauffeur'}
                                </h2>

                                {/* Display form error if any */}
                                {formError && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
                                        <span className="block sm:inline">{formError}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Chauffeur Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                placeholder="Entrez le nom complet" // Added placeholder
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                placeholder="Entrez l'email" // Added placeholder
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                placeholder="Entrez le numéro de téléphone" // Added placeholder
                                                required
                                            />
                                        </div>
                                    
                                        {!selectedChauffeur && (
                                            <> {/* Use a fragment to group related password fields */}
                                                <div className="relative"> {/* Wrapper for password input and toggle icon */}
                                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                                                    <input
                                                        type={showPassword ? 'text' : 'password'} // Toggle type based on state
                                                        id="password"
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleInputChange}
                                                        className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                        placeholder="Entrez un mot de passe" // Added placeholder
                                                        required={!selectedChauffeur} // Required only for creation
                                                    />
                                                    {/* Toggle password visibility icon */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 top-5" // Position icon
                                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                    >
                                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                                <div className="relative"> {/* Wrapper for confirm password input and toggle icon */}
                                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirmer mot de passe</label>
                                                    <input
                                                        type={showPassword ? 'text' : 'password'} // Toggle type based on state (linked to password field)
                                                        id="confirmPassword"
                                                        name="confirmPassword"
                                                        value={formData.confirmPassword}
                                                        onChange={handleInputChange}
                                                        className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                        placeholder="Confirmez le mot de passe" // Added placeholder
                                                        required={!selectedChauffeur} // Required only for creation
                                                    />
                                                    {/* Toggle password visibility icon (linked to password field visibility) */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 top-5" // Position icon
                                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                    >
                                                         {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Taxi Info */}
                                    <div className="border-t pt-4 mt-4">
                                        <h3 className="font-semibold text-lg mb-4">Informations du Taxi</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="taxi.marque" className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
                                                <input
                                                    type="text"
                                                    id="taxi.marque"
                                                    name="taxi.marque"
                                                    value={formData.taxi.marque}
                                                    onChange={handleInputChange}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                    placeholder="Ex: Toyota" // Added placeholder
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="taxi.model" className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
                                                <input
                                                    type="text"
                                                    id="taxi.model"
                                                    name="taxi.model"
                                                    value={formData.taxi.model}
                                                    onChange={handleInputChange}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                    placeholder="Ex: Corolla" // Added placeholder
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="taxi.licensePlate" className="block text-sm font-medium text-gray-700 mb-1">Immatriculation</label>
                                                <input
                                                    type="text"
                                                    id="taxi.licensePlate"
                                                    name="taxi.licensePlate"
                                                    value={formData.taxi.licensePlate}
                                                    onChange={handleInputChange}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                    placeholder="Ex: 123 AB 01" // Added placeholder
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="taxi.color" className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                                                <input
                                                    type="text"
                                                    id="taxi.color"
                                                    name="taxi.color"
                                                    value={formData.taxi.color}
                                                    onChange={handleInputChange}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                    placeholder="Ex: Jaune" // Added placeholder
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="taxi.status" className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                                                <select
                                                    id="taxi.status"
                                                    name="taxi.status"
                                                    value={formData.taxi.status}
                                                    onChange={handleInputChange}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                    required
                                                    disabled={isSubmitting} // Disable select during submission
                                                >
                                                    <option value="disponible">Disponible</option>
                                                    <option value="occupé">Occupé</option>
                                                    <option value="hors service">Hors service</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Form Actions */}
                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                                            disabled={isSubmitting} // Disable button while submitting
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed" // Added disabled styles
                                            disabled={isSubmitting || (formError && !selectedChauffeur)} // Disable if submitting or if there's a form error in creation mode
                                        >
                                            {isSubmitting && <Loader2 className="animate-spin mr-2" size={18} />}
                                            {selectedChauffeur ? 'Mettre à jour' : 'Créer'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChauffeursAdmin;
