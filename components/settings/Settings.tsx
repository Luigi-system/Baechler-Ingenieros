
import React, { useState } from 'react';
import DatabaseSettings from './DatabaseSettings';
import CustomizationSettings from './CustomizationSettings';
import UserManagement from './UserManagement';
import RoleManagement from './RoleManagement';
import DataImporter from './DataImporter';
import { DatabaseIcon, PaletteIcon, UsersIcon, ShieldCheckIcon, UploadCloudIcon } from '../ui/Icons';

type Tab = 'database' | 'customization' | 'users' | 'roles' | 'import';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('customization');

  const tabs = [
    { id: 'customization', label: 'Personalización', icon: PaletteIcon },
    { id: 'database', label: 'Base de Datos', icon: DatabaseIcon },
    { id: 'users', label: 'Gestión de Usuarios', icon: UsersIcon },
    { id: 'roles', label: 'Gestión de Roles', icon: ShieldCheckIcon },
    { id: 'import', label: 'Importador', icon: UploadCloudIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'database':
        return <DatabaseSettings />;
      case 'customization':
        return <CustomizationSettings />;
      case 'users':
        return <UserManagement />;
      case 'roles':
        return <RoleManagement />;
      case 'import':
        return <DataImporter />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Configuración</h2>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/4">
            <ul className="space-y-1">
              {tabs.map(tab => (
                 <li key={tab.id}>
                    <button 
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${
                            activeTab === tab.id 
                            ? 'bg-primary/20 text-primary dark:bg-primary/30 font-semibold' 
                            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        <tab.icon className="h-5 w-5 mr-3"/>
                        {tab.label}
                    </button>
                 </li>
              ))}
            </ul>
        </div>
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;