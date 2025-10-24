
import React, { useContext, useState } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';
import { BellIcon, LogoutIcon, UserIcon } from '../ui/Icons';

interface HeaderProps {
  onNavigateToProfile: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigateToProfile }) => {
  const auth = useContext(AuthContext);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  if (!auth || !auth.user) {
    return null;
  }

  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Bienvenido, {auth.user.nombres}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Rol: {auth.user.roleName}</p>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
            <BellIcon className="h-6 w-6 text-gray-500 dark:text-gray-400 cursor-pointer hover:text-primary"/>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
        </div>
        
        <ThemeToggle />

        <div className="relative">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                <img 
                  className="h-10 w-10 rounded-full object-cover" 
                  src={`https://i.pravatar.cc/150?u=${auth.user.email}`} 
                  alt="User avatar" 
                />
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{auth.user.nombres}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{auth.user.email}</p>
                </div>
            </div>
            
            {isProfileMenuOpen && (
                 <div 
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border dark:border-gray-700"
                    onMouseLeave={() => setIsProfileMenuOpen(false)}
                >
                    <button
                        onClick={() => { onNavigateToProfile(); setIsProfileMenuOpen(false); }}
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <UserIcon className="h-5 w-5 mr-2" />
                        Mi Perfil
                    </button>
                    <button
                      onClick={() => { auth.logout(); setIsProfileMenuOpen(false); }}
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <LogoutIcon className="h-5 w-5 mr-2" />
                      Cerrar sesión
                    </button>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;