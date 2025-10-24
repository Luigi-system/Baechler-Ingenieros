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
    <header className="flex items-center justify-between p-4 bg-base-200 border-b border-base-border shadow-sm">
      <div>
        <h1 className="text-xl font-semibold text-base-content">Bienvenido, {auth.user.nombres}</h1>
        <p className="text-sm text-neutral">Rol: {auth.user.roleName}</p>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
            <BellIcon className="h-6 w-6 text-neutral cursor-pointer hover:text-primary"/>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
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
                  <p className="font-medium text-base-content">{auth.user.nombres}</p>
                  <p className="text-xs text-neutral">{auth.user.email}</p>
                </div>
            </div>
            
            {isProfileMenuOpen && (
                 <div 
                    className="absolute right-0 mt-2 w-48 bg-base-200 rounded-md shadow-lg py-1 z-50 border border-base-border"
                    onMouseLeave={() => setIsProfileMenuOpen(false)}
                >
                    <button
                        onClick={() => { onNavigateToProfile(); setIsProfileMenuOpen(false); }}
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-base-content hover:bg-base-300"
                    >
                        <UserIcon className="h-5 w-5 mr-2" />
                        Mi Perfil
                    </button>
                    <button
                      onClick={() => { auth.logout(); setIsProfileMenuOpen(false); }}
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-error hover:bg-base-300"
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
