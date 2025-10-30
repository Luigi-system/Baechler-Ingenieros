import React, { useState } from 'react';
import { BuildingIcon, IndustryIcon, CogIcon, UserCircleIcon } from '../ui/Icons';
import CompanyList from './companies/CompanyList';
import PlantList from './plants/PlantList';
import MachineList from './machines/MachineList';
import SupervisorList from './supervisors/SupervisorList';

type Tab = 'companies' | 'plants' | 'machines' | 'supervisors';

const Management: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('companies');

  const tabs = [
    { id: 'companies', label: 'Empresas', icon: BuildingIcon },
    { id: 'plants', label: 'Plantas / Sedes', icon: IndustryIcon },
    { id: 'machines', label: 'Máquinas', icon: CogIcon },
    { id: 'supervisors', label: 'Encargados', icon: UserCircleIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'companies':
        return <CompanyList />;
      case 'plants':
        return <PlantList />;
      case 'machines':
        return <MachineList />;
      case 'supervisors':
        return <SupervisorList />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Gestión</h2>
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

export default Management;