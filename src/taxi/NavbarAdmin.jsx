import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, LayoutDashboard, BarChart, Users, User, LogOut } from 'lucide-react';

export default function NavbarAdmin() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  const links = [
    { name: 'Tableau de bord', to: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Statistique', to: '/statistics', icon: <BarChart size={20} /> },
    { name: 'Chauffeur', to: '/chauffeurs', icon: <User size={20} /> },
    { name: 'Client', to: '/clients', icon: <Users size={20} /> },
    { name: 'Déconnexion', to: '/logout', icon: <LogOut size={20} /> },
  ];

  return (
    <nav className="bg-[#0f172a] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16 items-center fixed top-0 left-0 right-0 z-50 bg-[#0f172a] px-4">
          <div className="text-2xl font-bold text-yellow-400">Taxi Admin</div>
          <div className="hidden md:flex space-x-6">
            {links.map((link) => (
              <NavLink
                key={link.name}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-yellow-100 text-yellow-800 font-semibold'
                      : 'text-white hover:text-yellow-400'
                  }`
                }
              >
                {link.icon}
                {link.name}
              </NavLink>
            ))}
          </div>
          <div className="md:hidden">
            <button onClick={toggleMenu} className="text-white">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {isOpen && (
        <div className="md:hidden px-2 pt-2 pb-3 space-y-1 bg-[#1e293b]">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-yellow-100 text-yellow-800 font-semibold'
                    : 'text-white hover:text-yellow-400 hover:bg-[#334155]'
                }`
              }
            >
              <div className="flex items-center gap-2">
                {link.icon}
                {link.name}
              </div>
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
