import React, { useState } from 'react';
import { analyzeReportWithAi } from '../../services/aiService';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from '../dashboard/Dashboard';
import ReportList from '../reports/ReportList';
import ReportForm from '../reports/ReportForm';
import VisitReportForm from '../reports/VisitReportForm';
import VisitReportList from '../reports/VisitReportList';

// Management Components
import CompanyList from '../management/companies/CompanyList';
import PlantList from '../management/plants/PlantList';
import MachineList from '../management/machines/MachineList';
import SupervisorList from '../management/supervisors/SupervisorList';
import AiHeaderNotice from '../reports/AiHeaderNotice';

// Settings Components
import CustomizationSettings from '../settings/CustomizationSettings';
import UserManagement from '../settings/UserManagement';
import ProfileSettings from '../settings/ProfileSettings';
import DomainQrModal from '../ui/DomainQrModal';

const Layout: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [isDomainQrModalOpen, setIsDomainQrModalOpen] = useState(false);

  // State for sidebars (mobile and desktop)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [aiData, setAiData] = useState<any>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

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
     setAiData(null);
  }

  const handleAiFileSelected = async (file: File) => {
    setIsAiProcessing(true);
    setAiData(null);
    const reportType = activePage.includes('visit') ? 'visit' : 'service';
    try {
      const extracted = await analyzeReportWithAi(file, reportType);
      setAiData(extracted);
      alert('✅ IA completó el análisis. Los campos han sido autocompletados.');
    } catch (e: any) {
      alert('⚠️ Error al analizar el archivo: ' + e.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      
      // Reports
      case 'reports-service':
        return <ReportList reportType="service" onCreateReport={() => handleCreateReport('service')} onEditReport={(id) => handleEditReport(id, 'service')} />;
      case 'reports-visit':
        return <VisitReportList onCreateReport={() => handleCreateReport('visit')} onEditReport={(id) => handleEditReport(id, 'visit')} />;
      case 'create-report-service':
        return <ReportForm onBack={() => navigateTo('reports-service')} initialAiData={aiData} />;
      case 'edit-report-service':
        return <ReportForm reportId={editingReportId?.toString()} onBack={() => navigateTo('reports-service')} initialAiData={aiData} />;
       case 'create-report-visit':
        return <VisitReportForm onBack={() => navigateTo('reports-visit')} initialAiData={aiData} />;
      case 'edit-report-visit':
        return <VisitReportForm reportId={editingReportId?.toString()} onBack={() => navigateTo('reports-visit')} initialAiData={aiData} />;
      
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
      case 'settings-users':
        return <UserManagement />;
      case 'settings-profile':
        return <ProfileSettings />;
        
      default:
        return <Dashboard />;
    }
  };

  const getPageTitleInfo = () => {
    switch (activePage) {
      case 'dashboard': return { title: 'Dashboard', subtitle: 'Vista general de operaciones' };
      case 'reports-service': return { title: 'Reportes de Servicio', subtitle: 'Listado y gestión de servicios realizados' };
      case 'reports-visit': return { title: 'Reportes de Visita', subtitle: 'Control de visitas y mantenimiento preventivo' };
      case 'create-report-service': return { title: 'Crear Reporte de Servicio', subtitle: 'Inicia un nuevo reporte técnico' };
      case 'edit-report-service': return { title: 'Editar Reporte de Servicio', subtitle: 'Modifica los datos del servicio seleccionado' };
      case 'create-report-visit': return { title: 'Crear Reporte de Visita', subtitle: 'Registra una nueva inspección preventiva' };
      case 'edit-report-visit': return { title: 'Editar Reporte de Visita', subtitle: 'Actualiza la información de la visita' };
      case 'management-companies': return { title: 'Gestionar Empresas', subtitle: 'Añade, edita o elimina registros de empresas' };
      case 'management-plants': return { title: 'Gestionar Plantas', subtitle: 'Administración de sedes y plantas' };
      case 'management-machines': return { title: 'Gestionar Máquinas', subtitle: 'Listado de equipos y maquinaria' };
      case 'management-supervisors': return { title: 'Gestionar Encargados', subtitle: 'Contactos y responsables por planta' };
      case 'settings-customization': return { title: 'Personalización', subtitle: 'Configuración visual de la plataforma' };
      case 'settings-users': return { title: 'Gestión de Usuarios', subtitle: 'Administración de accesos y cuentas' };
      case 'settings-profile': return { title: 'Mi Perfil', subtitle: 'Ajustes de tu cuenta personal' };
      default: return { title: undefined, subtitle: undefined };
    }
  };

  const { title: pageTitle, subtitle: pageSubtitle } = getPageTitleInfo();

  return (
    <div className="flex h-screen bg-base-100 overflow-x-hidden">
      <Sidebar 
        activePage={activePage} 
        setActivePage={navigateTo}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isDesktopSidebarCollapsed}
        setIsCollapsed={setIsDesktopSidebarCollapsed}
        onShowDomainQr={() => setIsDomainQrModalOpen(true)}
      />
      <main className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
        <Header 
            onNavigateToProfile={() => navigateTo('settings-profile')} 
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
            onEditReport={handleEditReport}
            onShowDomainQr={() => setIsDomainQrModalOpen(true)}
            title={pageTitle}
            subtitle={pageSubtitle}
        >
            { (activePage.startsWith('create-report') || activePage.startsWith('edit-report')) && <AiHeaderNotice onFileSelected={handleAiFileSelected} isProcessing={isAiProcessing} /> }
        </Header>
        <div className="flex-1 p-2 md:p-4 overflow-hidden">
          {renderContent()}
        </div>
      </main>

      <DomainQrModal 
        isOpen={isDomainQrModalOpen} 
        onClose={() => setIsDomainQrModalOpen(false)} 
      />
    </div>
  );
};

// FIX: Added default export to the Layout component.
export default Layout;