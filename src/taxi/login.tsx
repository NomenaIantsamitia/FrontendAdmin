import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2, AlertCircle } from 'lucide-react';
// Assurez-vous d'avoir une image de fond dans ce chemin ou remplacez-le


const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.email || !formData.password) {
        setLoading(false);
        return;
    }

    try {
      // Appel à l'API backend pour l'authentification
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      

      const { token, user } = response.data;

      // Stocker le token et les informations utilisateur (utiliser des cookies HTTP-only en production)
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Rediriger l'utilisateur
      navigate('/admin/dashboard'); // Adaptez le chemin si nécessaire

    } catch (err) {
      console.error('Erreur de connexion :', err);
      setError(err.response?.data?.message || 'Échec de la connexion. Veuillez vérifier vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Conteneur principal avec fond d'écran et centrage
    <div
      className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8"
      style={{
       
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Carte de connexion animée */}
      <motion.div
        className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-2xl z-10 border border-gray-200 backdrop-filter backdrop-blur-sm bg-opacity-80" // Ajout de shadow-2xl, border, backdrop-filter
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }} // Animation plus fluide
      >
        <div>
          {/* Titre centré */}
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Connectez-vous
          </h2>
           <p className="mt-2 text-center text-sm text-gray-600">
             Accédez à votre espace d'administration
           </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Afficher l'erreur générale si elle existe */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative text-sm" // rounded-md
              role="alert"
            >
              <span className="block sm:inline">{error}</span>
            </motion.div>
          )}

          {/* Champs de formulaire avec icônes */}
          <div className="space-y-4"> {/* Espacement entre les champs */}
            {/* Champ Email */}
            <div className="relative">
               <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} /> {/* Icône plus grande */}
               <input
                 id="email-address"
                 name="email"
                 type="email"
                 autoComplete="email"
                 required
                 className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out" // Styles améliorés, transition
                 placeholder="Adresse Email"
                 value={formData.email}
                 onChange={handleInputChange}
               />
            </div>
            {/* Champ Mot de passe */}
            <div className="relative">
               <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} /> {/* Icône plus grande */}
               <input
                 id="password"
                 name="password"
                 type={showPassword ? 'text' : 'password'}
                 autoComplete="current-password"
                 required
                 className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out" // Styles améliorés, transition, pr-10 pour l'icône
                 placeholder="Mot de passe"
                 value={formData.password}
                 onChange={handleInputChange}
               />
               {/* Toggle password visibility icon */}
               <button
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700" // Position et style hover
                   aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
               >
                   {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
               </button>
             </div>
          </div>

          {/* Option "Se souvenir de moi" ou "Mot de passe oublié" (facultatif) */}
          {/* Vous pouvez les ajouter ici si nécessaire */}

          {/* Bouton de connexion */}
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out" // Styles améliorés, transition
              disabled={loading}
            >
              {loading ? (
                 <Loader2 className="animate-spin mr-2" size={18} />
              ) : (
                 <LogIn className="mr-2" size={18} />
              )}
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </div>
        </form>

        {/* Lien vers l'inscription si applicable */}
        {/* Vous pouvez l'ajouter ici si nécessaire */}

      </motion.div>
    </div>
  );
};

export default Login;
