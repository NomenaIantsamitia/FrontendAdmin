import { useState, useEffect } from 'react';
import axios from 'axios';


export default function ChauffeursAdmin() {
  const [chauffeurs, setChauffeurs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedChauffeur, setSelectedChauffeur] = useState(null);
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [formData, setFormData] = useState({
    prenom: '',
    name: '',
    email: '',
    phone: '',
    taxi: {
      licensePlate: '',
      marque: '',
      model: '',
      annee: ''
    }
  });

  // Chargement initial des données
  useEffect(() => {
    fetchChauffeurs();
  }, []);

  const fetchChauffeurs = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/listesChauffeurs');
      setChauffeurs(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des chauffeurs :', error);
    }
  };

  const generatePassword = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleInputChange = (field, value) => {
    if (field.startsWith('taxi.')) {
      const taxiField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        taxi: { ...prev.taxi, [taxiField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedChauffeur) {
      // Pour les modifications, on affiche d'abord la confirmation
      setPendingUpdate({
        id: selectedChauffeur._id,
        payload: {
          ...formData,
          taxi: {
            licensePlate: formData.taxi.licensePlate,
            model: formData.taxi.model,
            marque: formData.taxi.marque,
            annee: formData.taxi.annee
          }
        }
      });
      setShowConfirmModal(true);
    } else {
      // Création d'un nouveau chauffeur
      try {
        const payload = {
          ...formData,
          password: generatePassword(),
          taxi: {
            licensePlate: formData.taxi.licensePlate,
            model: formData.taxi.model,
            marque: formData.taxi.marque,
            annee: formData.taxi.annee
          }
        };
        
        const response = await axios.post('http://localhost:5000/api/creerUsers', payload);
        
        // Mise à jour optimiste de l'état local
        alert(`Ajout avec succes`);
        resetForm();
        fetchChauffeurs()
        console.log(response.data)
      } catch (error) {
        console.error('Erreur:', error);
        // Recharger les données en cas d'erreur
        fetchChauffeurs();
        if (error.response) {
          alert(`Erreur serveur: ${error.response.data.error}`);
        } else {
          alert('Erreur de connexion au serveur');
        }
      }
    }
  };

  const confirmUpdate = async () => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/modifierListes/${pendingUpdate.id}`,
        pendingUpdate.payload
      );
      
      // Mise à jour optimiste de l'état local
      resetForm();
      setShowConfirmModal(false);
      setPendingUpdate(null);
      fetchChauffeurs();
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      // Recharger les données en cas d'erreur
      fetchChauffeurs();
      if (error.response) {
        alert(`Erreur serveur: ${error.response.data.error}`);
      } else {
        alert('Erreur de connexion au serveur');
      }
    }
  };

  const handleEdit = (chauffeur) => {
    setSelectedChauffeur(chauffeur);
    setFormData({
      prenom: chauffeur.prenom,
      name: chauffeur.name,
      email: chauffeur.email,
      phone: chauffeur.phone,
      taxi: {
        licensePlate: chauffeur.taxi?.licensePlate || '',
        marque: chauffeur.taxi?.marque || '',
        model: chauffeur.taxi?.model || chauffeur.taxi?.model || '',
        annee: chauffeur.taxi?.annee || ''
      }
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce chauffeur ?')) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${id}`);
        // Mise à jour optimiste de l'état local
        setChauffeurs(prev => prev.filter(c => c._id !== id));
      } catch (error) {
        console.error('Erreur:', error);
        // Recharger les données en cas d'erreur
        fetchChauffeurs();
      }
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setSelectedChauffeur(null);
    setFormData({
      prenom: '',
      name: '',
      email: '',
      phone: '',
      taxi: {
        licensePlate: '',
        marque: '',
        model: '',
        annee: ''
      }
    });
  };
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Gestion Chauffeurs & Taxis</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700"
          >
            + Ajouter
          </button>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Nom complet', 'Contact', 'Véhicule', 'Immatriculation', 'Actions'].map((header) => (
                  <th key={header} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {chauffeurs.map((chauffeur) => (
                <tr key={chauffeur._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {chauffeur.prenom}  {chauffeur.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{chauffeur.email}</div>
                    <div className="text-sm text-gray-500">{chauffeur.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="font-medium">
                          {chauffeur.taxi?.marque} {chauffeur.taxi?.model}
                        </div>
                        <div className="text-sm text-gray-500">
                          Année {chauffeur.taxi?.annee}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-blue-600">
                    {chauffeur.taxi?.licensePlate}
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => handleEdit(chauffeur)}
                      className="text-indigo-600 hover:text-indigo-900 px-2 py-1 rounded"
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(chauffeur._id)}
                      className="text-red-600 hover:text-red-900 px-2 py-1 rounded"
                    >
                      🗑️ Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Formulaire */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-xl">
              <h2 className="text-2xl font-bold mb-6">
                {selectedChauffeur ? 'Modifier' : 'Nouveau'} Chauffeur & Taxi
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Prénom"
                    className="p-2 border rounded-lg"
                    value={formData.prenom}
                    onChange={(e) => handleInputChange('prenom', e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Nom"
                    className="p-2 border rounded-lg"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="p-2 border rounded-lg"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Téléphone"
                    className="p-2 border rounded-lg"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-semibold text-lg">Information du Taxi</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Marque"
                      className="p-2 border rounded-lg"
                      value={formData.taxi.marque}
                      onChange={(e) => handleInputChange('taxi.marque', e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Modèle"
                      className="p-2 border rounded-lg"
                      value={formData.taxi.model}
                      onChange={(e) => handleInputChange('taxi.model', e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Immatriculation"
                      className="p-2 border rounded-lg"
                      value={formData.taxi.licensePlate}
                      onChange={(e) => handleInputChange('taxi.licensePlate', e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Année"
                      className="p-2 border rounded-lg"
                      value={formData.taxi.annee}
                      onChange={(e) => handleInputChange('taxi.annee', e.target.value)}
                      min="2000"
                      max={new Date().getFullYear()}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {selectedChauffeur ? 'Enregistrer' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de confirmation */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Confirmer la modification</h2>
              <p className="mb-6">Êtes-vous sûr de vouloir modifier ce chauffeur et son taxi ?</p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingUpdate(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}