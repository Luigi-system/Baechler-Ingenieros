

import React, { useContext, useState } from 'react';
import { 
    DashboardIcon, ReportsIcon, SettingsIcon, 
    ChevronLeftIcon, MenuIcon, BuildingIcon, IndustryIcon, 
    CogIcon, UserCircleIcon, PaletteIcon, DatabaseIcon, 
    UsersIcon, ShieldCheckIcon, UploadCloudIcon, KeyIcon, ClipboardCheckIcon, CpuChipIcon, LinkIcon, MailIcon 
} from '../ui/Icons';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext'; 

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
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
        { id: 'settings-database', label: 'Base de Datos', icon: DatabaseIcon, permission: 'settings' },
        { id: 'settings-users', label: 'Usuarios', icon: UsersIcon, permission: 'settings' },
        { id: 'settings-roles', label: 'Roles', icon: ShieldCheckIcon, permission: 'settings' },
        { id: 'settings-access', label: 'Accesos', icon: KeyIcon, permission: 'settings' },
        { id: 'settings-import', label: 'Importador', icon: UploadCloudIcon, permission: 'settings' },
      ]
    },
    { 
        id: 'integrations',
        label: 'Integraciones',
        icon: LinkIcon, 
        permission: 'settings', 
        subItems: [
            { id: 'settings-ai', label: 'Servicios de IA', icon: CpuChipIcon, permission: 'settings' },
            { id: 'settings-email', label: 'Configuración de Email', icon: MailIcon, permission: 'settings' },
        ]
    },
];

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const auth = useContext(AuthContext);
  const { logoUrl, appTitle, logoFontSize, logoFontFamily, logoColor, isLogoAnimated } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleItemClick = (item: (typeof navItems)[0]) => {
    if (item.subItems) {
      if (isCollapsed) {
        setIsCollapsed(false); // Expand sidebar
        setOpenMenuId(item.id);   // And open the menu
      } else {
        setOpenMenuId(prevId => (prevId === item.id ? null : item.id));
      }
    } else {
      setActivePage(item.id);
      setOpenMenuId(null); // Close any open menu when navigating to a top-level item
    }
  };
  
  const handleSubItemClick = (subItemId: string) => {
    setActivePage(subItemId);
  };


  const filteredNavItems = navItems.filter(item => auth?.user?.permissions.includes(item.permission));

  const isMainActive = (itemId: string) => activePage.startsWith(itemId) && activePage !== itemId;

  return (
    <aside 
        className={`
            relative flex flex-col bg-base-200 shadow-xl transition-all duration-300 ease-in-out z-30
            ${isCollapsed ? 'w-20' : 'w-64'}
        `}
    >
      <div className={`flex border-b border-base-border transition-all duration-300 ${isCollapsed ? 'h-20 justify-center items-center' : 'min-h-20 px-4 py-4 items-start'}`}>
        <img src={logoUrl} alt="App Logo" className={`transition-all duration-300 object-contain h-10 w-10 shrink-0 ${isCollapsed ? '' : 'mt-1'} ${isLogoAnimated ? 'logo-jiggle-animation' : ''}`} />
        {!isCollapsed && (
          <div
            className="ml-3 font-bold whitespace-pre-wrap"
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
                        ${isCollapsed ? 'justify-center' : ''}
                        ${isActive 
                            ? 'bg-primary-lighter text-primary' 
                            : 'text-base-content hover:bg-base-300'
                        }
                    `}
                    title={isCollapsed ? item.label : ''}
                >
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full"></div>}
                    <item.icon className="h-6 w-6 shrink-0" />
                    {!isCollapsed && <span className="ml-4 font-medium flex-1 truncate">{item.label}</span>}
                    {!isCollapsed && item.subItems && (
                         <ChevronLeftIcon className={`h-5 w-5 transition-transform ${isOpen ? '-rotate-90' : 'rotate-0'}`} />
                    )}
                </div>

                {/* Submenu for expanded sidebar */}
                {!isCollapsed && isOpen && item.subItems && (
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
      
      <div className="px-2 py-4 border-t border-base-border">
         <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`
            flex items-center p-3 w-full rounded-lg cursor-pointer transition-all duration-200 ease-in-out
            text-base-content hover:bg-base-300
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          {isCollapsed ? <MenuIcon className="h-6 w-6"/> : <ChevronLeftIcon className="h-6 w-6"/>}
          {!isCollapsed && <span className="ml-4 font-medium">Contraer</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;