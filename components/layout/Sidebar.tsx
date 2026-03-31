

import React, { useContext, useState } from 'react';
import { 
    DashboardIcon, ReportsIcon, SettingsIcon, 
    ChevronLeftIcon, MenuIcon, BuildingIcon, IndustryIcon, 
    CogIcon, UserCircleIcon, PaletteIcon, 
    UsersIcon, ShieldCheckIcon, KeyIcon, ClipboardCheckIcon, MailIcon 
} from '../ui/Icons';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext'; 

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, permission: 'dashboard' },
    { 
      id: 'reports', 
      label: 'Reportes', 
      icon: ReportsIcon, 
      permission: 'reports',
      subItems: [
        { id: 'reports-service', label: 'Reportes de Servicio', icon: ReportsIcon, permission: 'reports' },
        { id: 'reports-visit', label: 'Reportes de Visita', icon: ClipboardCheckIcon, permission: 'reports' },
      ] 
    },
    { 
      id: 'management', 
      label: 'Gestión', 
      icon: BuildingIcon, 
      permission: 'management',
      subItems: [
        { id: 'management-companies', label: 'Empresas', icon: BuildingIcon, permission: 'management' },
        { id: 'management-plants', label: 'Plantas / Sedes', icon: IndustryIcon, permission: 'management' },
        { id: 'management-machines', label: 'Máquinas', icon: CogIcon, permission: 'management' },
        { id: 'management-supervisors', label: 'Encargados', icon: UserCircleIcon, permission: 'management' },
      ]
    },
    { 
      id: 'settings', 
      label: 'Configuración', 
      icon: SettingsIcon, 
      permission: 'settings',
      subItems: [
        { id: 'settings-customization', label: 'Personalización', icon: PaletteIcon, permission: 'settings' },
        { id: 'settings-users', label: 'Usuarios', icon: UsersIcon, permission: 'settings' },
      ]
    },
];

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isMobileOpen, onCloseMobile, isCollapsed, setIsCollapsed }) => {
  const auth = useContext(AuthContext);
  const { logoUrl, appTitle, logoFontSize, logoFontFamily, logoColor, isLogoAnimated } = useTheme();
  const [isDomainQrOpen, setIsDomainQrOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>('reports');

  const handleItemClick = (item: (typeof navItems)[0]) => {
    if (item.subItems) {
      if (isCollapsed && !isMobileOpen) { // Desktop and collapsed
        setIsCollapsed(false);
        setOpenMenuId(item.id);
      } else { // Desktop and expanded, or mobile
        setOpenMenuId(prevId => (prevId === item.id ? null : item.id));
      }
    } else {
      setActivePage(item.id);
      setOpenMenuId(null);
      onCloseMobile(); // Close mobile sidebar on navigation
    }
  };
  
  const handleSubItemClick = (subItemId: string) => {
    setActivePage(subItemId);
    onCloseMobile();
  };

  const filteredNavItems = navItems.filter(item => auth?.user?.permissions.includes(item.permission));
  const isMainActive = (itemId: string) => activePage.startsWith(itemId) && activePage !== itemId;
  const showExpanded = !isCollapsed || isMobileOpen;

  return (
    <>
      <div 
          className={`sidebar-overlay md:hidden ${isMobileOpen ? 'visible' : ''}`}
          onClick={onCloseMobile}
      ></div>
      <aside 
          className={`
              fixed md:relative inset-y-0 left-0 z-50
              flex flex-col bg-base-200 shadow-2xl md:shadow-xl transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
              md:translate-x-0
              ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
              w-72 sm:w-64 ${isCollapsed ? 'md:w-20' : 'md:w-64'}
          `}
      >
        <div 
            onClick={() => setIsDomainQrOpen(true)}
            className={`flex items-center border-b border-base-border h-16 md:h-20 transition-all duration-300 cursor-pointer hover:bg-base-300/30 group ${!showExpanded ? 'justify-center' : 'px-4'}`}
        >
          <img 
            src={logoUrl} 
            alt="App Logo" 
            className={`transition-all duration-300 object-contain h-8 md:h-10 w-8 md:w-10 shrink-0 ${!showExpanded ? '' : 'mt-1'} ${isLogoAnimated ? 'logo-jiggle-animation' : ''} group-hover:scale-110`} 
          />
          {showExpanded && (
            <div
              className="ml-3 font-bold whitespace-pre-wrap group-hover:text-primary transition-colors"
              style={{
                fontSize: logoFontSize,
                fontFamily: logoFontFamily || 'inherit',
                color: logoColor || 'var(--color-primary)',
                lineHeight: 1.2,
              }}
            >
              {appTitle}
            </div>
          )}
        </div>

        {isDomainQrOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                <div 
                    className="bg-base-200 w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-base-border p-8 py-10 relative animate-in zoom-in-95 duration-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button 
                        onClick={() => setIsDomainQrOpen(false)}
                        className="absolute top-6 right-6 p-2 bg-base-300 hover:bg-error/10 hover:text-error rounded-full transition-all"
                    >
                        <ChevronLeftIcon className="h-5 w-5 rotate-180" />
                    </button>

                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="bg-primary/10 p-4 rounded-3xl">
                            <IndustryIcon className="h-10 w-10 text-primary" />
                        </div>
                        
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tight text-base-content italic">
                                Acceso Rápido
                            </h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral opacity-50 mt-1">DOMINIO INSTITUCIONAL</p>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] shadow-xl ring-8 ring-primary/5">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin)}`} 
                                alt="Domain QR"
                                className="w-48 h-48"
                            />
                        </div>

                        <div className="bg-base-300/50 p-4 rounded-2xl w-full border border-base-border">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 underline">SITIO OFICIAL</p>
                            <p className="text-xs font-mono font-bold truncate opacity-70 break-all">{window.location.origin}</p>
                        </div>

                        <button 
                            onClick={() => setIsDomainQrOpen(false)}
                            className="w-full py-4 bg-primary text-primary-content rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-focus transition-all shadow-lg active:scale-95"
                        >
                            Cerrar Vista
                        </button>
                    </div>
                </div>
                <div className="absolute inset-0 -z-10" onClick={() => setIsDomainQrOpen(false)}></div>
            </div>
        )}

        <nav className="flex-1 px-2 py-4 overflow-y-auto custom-scrollbar">
          <ul>
            {filteredNavItems.map(item => {
              const isOpen = openMenuId === item.id;
              const isActive = activePage === item.id || isMainActive(item.id);

              return (
                <li key={item.id}>
                  <div
                      onClick={() => handleItemClick(item)}
                      className={`
                          relative flex items-center p-3 my-1 rounded-lg cursor-pointer transition-all duration-200 ease-in-out group
                          ${!showExpanded ? 'justify-center' : ''}
                          ${isActive 
                              ? 'bg-primary-lighter text-primary' 
                              : 'text-base-content hover:bg-base-300'
                          }
                      `}
                      title={!showExpanded ? item.label : ''}
                  >
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full"></div>}
                      <item.icon className="h-5 w-5 shrink-0" />
                      {showExpanded && <span className="ml-4 font-medium flex-1 truncate">{item.label}</span>}
                      {showExpanded && item.subItems && (
                           <ChevronLeftIcon className={`h-5 w-5 transition-transform ${isOpen ? '-rotate-90' : 'rotate-0'}`} />
                      )}
                  </div>

                  {showExpanded && isOpen && item.subItems && (
                      <ul className="pl-6 mt-1 mb-2 animate-fade-in-right">
                          {item.subItems.map(subItem => (
                             <li
                               key={subItem.id}
                               onClick={() => handleSubItemClick(subItem.id)}
                               className={`
                                  flex items-center p-2 rounded-md cursor-pointer transition-all duration-200 ease-in-out text-sm group
                                  ${activePage === subItem.id
                                    ? 'text-primary font-semibold'
                                    : 'text-neutral hover:bg-base-300'
                                  }
                               `}
                             >
                              <div className={`h-1.5 w-1.5 rounded-full mr-3 shrink-0 transition-all ${activePage === subItem.id ? 'bg-primary' : 'bg-transparent group-hover:bg-neutral'}`}></div>
                              <subItem.icon className="h-5 w-5 mr-3 shrink-0" />
                              <span className="truncate">{subItem.label}</span>
                             </li>
                          ))}
                      </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="hidden md:block px-2 py-4 border-t border-base-border">
           <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
              flex items-center p-3 w-full rounded-lg cursor-pointer transition-all duration-200 ease-in-out
              text-base-content hover:bg-base-300
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            {isCollapsed ? <MenuIcon className="h-5 w-5"/> : <ChevronLeftIcon className="h-5 w-5"/>}
            {!isCollapsed && <span className="ml-4 font-medium">Contraer</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;