
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from '../dashboard/Dashboard';
import ReportList from '../reports/ReportList';
import Assistant from '../assistant/Assistant';
import ReportForm from '../reports/ReportForm';
import VisitReportForm from '../reports/VisitReportForm';
import Modal from '../ui/Modal';
import { AssistantIcon } from '../ui/Icons';

// Management Components
import CompanyList from '../management/companies/CompanyList';
import PlantList from '../management/plants/PlantList';
import MachineList from '../management/machines/MachineList';
import SupervisorList from '../management/supervisors/SupervisorList';

// Settings Components
import CustomizationSettings from '../settings/CustomizationSettings';
import DatabaseSettings from '../settings/DatabaseSettings';
import UserManagement from '../settings/UserManagement';
import RoleManagement from '../settings/RoleManagement';
import DataImporter from '../settings/DataImporter';
import AccessManagement from '../settings/AccessManagement';
import ProfileSettings from '../settings/ProfileSettings';
import MCPSettings from '../settings/MCPSettings';

const Layout: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const navigateTo = (page: string) => {
    setActivePage(page);
    setEditingReportId(null);
  };

  const handleCreateReport = (type: 'service' | 'visit') => {
    setActivePage(`create-report-${type}`);
    setEditingReportId(null);
  };
  
  const handleEditReport = (id: number, type: 'service' | 'visit') => {
     setActivePage(`edit-report-${type}`);
     setEditingReportId(id);
  }

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      
      // Reports
      case 'reports-service':
        return <ReportList reportType="service" onCreateReport={() => handleCreateReport('service')} onEditReport={(id) => handleEditReport(id, 'service')} />;
      case 'reports-visit':
        return <VisitReportForm onBack={() => navigateTo('dashboard')} />;
      case 'create-report-service':
        return <ReportForm onBack={() => navigateTo('reports-service')} />;
      case 'edit-report-service':
        // FIX: Converted 'editingReportId' from number to string to match the 'reportId' prop type in ReportForm.
        return <ReportForm reportId={editingReportId?.toString()} onBack={() => navigateTo('reports-service')} />;
       case 'create-report-visit':
        return <VisitReportForm onBack={() => navigateTo('reports-visit')} />;
      case 'edit-report-visit':
        return <VisitReportForm reportId={editingReportId?.toString()} onBack={() => navigateTo('reports-visit')} />;
      
      // Management Pages
      case 'management-companies':
        return <CompanyList />;
      case 'management-plants':
        return <PlantList />;
      case 'management-machines':
        return <MachineList />;
      case 'management-supervisors':
        return <SupervisorList />;

      // Settings Pages
      case 'settings-customization':
        return <CustomizationSettings />;
      case 'settings-database':
        return <DatabaseSettings />;
      case 'settings-mcp':
        return <MCPSettings />;
      case 'settings-users':
        return <UserManagement />;
      case 'settings-roles':
        return <RoleManagement />;
      case 'settings-access':
        return <AccessManagement />;
      case 'settings-import':
        return <DataImporter />;

      // User Profile Page
      case 'profile':
        return <ProfileSettings />;
        
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar activePage={activePage} setActivePage={navigateTo} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onNavigateToProfile={() => navigateTo('profile')} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
      
      {/* Floating Action Button for AI Assistant */}
      <button
        onClick={() => setIsAssistantOpen(true)}
        className="fixed bottom-8 right-8 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-dark transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark z-40"
        aria-label="Abrir Asistente IA"
      >
        <AssistantIcon className="h-8 w-8" />
      </button>

      {/* AI Assistant Modal */}
      <Modal 
        isOpen={isAssistantOpen} 
        onClose={() => setIsAssistantOpen(false)} 
        maxWidth="max-w-4xl" 
        hasPadding={false}
      >
        <Assistant />
      </Modal>
    </div>
  );
};

export default Layout;