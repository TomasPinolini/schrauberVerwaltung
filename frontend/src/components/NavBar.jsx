import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavBar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems = [
    { path: '/', label: 'Schraubendreher' },
    { path: '/attributes', label: 'Attribute' },
    { path: '/reports', label: 'Berichte' },
    { path: '/auftraege', label: 'Schraubprozesse' }
  ];
  
  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">Schrauber Verwaltung</Link>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden focus:outline-none" 
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4">
            {navItems.map(item => (
              <Link 
                key={item.path}
                to={item.path} 
                className={`px-3 py-2 rounded hover:bg-gray-700 transition-colors ${location.pathname === item.path ? 'bg-gray-700 font-medium' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-3 space-y-2">
            {navItems.map(item => (
              <Link 
                key={item.path}
                to={item.path} 
                className={`block px-3 py-2 rounded hover:bg-gray-700 transition-colors ${location.pathname === item.path ? 'bg-gray-700 font-medium' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
