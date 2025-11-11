

import React, { useContext, useState } from 'react';
import { 
    DashboardIcon, ReportsIcon, SettingsIcon, 
    ChevronLeftIcon, MenuIcon, BuildingIcon, IndustryIcon, 
    CogIcon, UserCircleIcon, PaletteIcon, DatabaseIcon, 
    UsersIcon, ShieldCheckIcon, UploadCloudIcon, KeyIcon, ClipboardCheckIcon, CpuChipIcon, LinkIcon, MailIcon 
} from '../ui/Icons';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext'; // Import AuthContext

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
  const { logoUrl, appTitle, logoFontSize, logoFontFamily, logoColor } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  }

  const filteredNavItems = navItems.filter(item => auth?.user?.permissions.includes(item.permission));

  return (
    <aside className={`
      relative flex flex-col bg-base-200 shadow-xl transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-20' : 'w-64'}
    `}>
      <div className={`flex items-center border-b border-base-border ${isCollapsed ? 'h-20 justify-center' : 'h-20 p-4'}`}>
        <img src={logoUrl} alt="App Logo" className={`transition-all duration-300 ${isCollapsed ? 'h-10 w-10' : 'h-10'}`} />
        {!isCollapsed && (
          <span
            className="ml-3 font-bold"
            style={{
              fontSize: logoFontSize,
              fontFamily: logoFontFamily || 'inherit',
              color: logoColor || 'var(--color-primary)',
            }}
          >
            {appTitle}
          </span>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 overflow-y-auto custom-scrollbar">
        <ul>
          {filteredNavItems.map(item => (
            <li key={item.id}>
                <div
                    onClick={() => item.subItems ? toggleMenu(item.id) : setActivePage(item.id)}
                    className={`
                        flex items-center p-3 my-1 rounded-lg cursor-pointer transition-all duration-200 ease-in-out
                        ${activePage.startsWith(item.id) 
                        ? 'bg-primary-lighter text-primary' 
                        : 'text-base-content hover:bg-base-300'
                        }
                        ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? item.label : ''}
                >
                    <item.icon className="h-6 w-6 shrink-0" />
                    {!isCollapsed && <span className="ml-4 font-medium flex-1">{item.label}</span>}
                    {!isCollapsed && item.subItems && (
                         <ChevronLeftIcon className={`h-5 w-5 transition-transform ${openMenus.has(item.id) ? '-rotate-90' : ''}`} />
                    )}
                </div>
                {!isCollapsed && openMenus.has(item.id) && item.subItems && (
                    <ul className="pl-8 border-l-2 border-base-300 ml-5">
                        {item.subItems.map(subItem => (
                           <li
                             key={subItem.id}
                             onClick={() => setActivePage(subItem.id)}
                             className={`
                                flex items-center p-2 my-1 rounded-md cursor-pointer transition-all duration-200 ease-in-out text-sm
                                ${activePage === subItem.id
                                  ? 'text-primary font-semibold'
                                  : 'text-neutral hover:bg-base-300'
                                }
                             `}
                           >
                            <subItem.icon className="h-5 w-5 mr-3 shrink-0" />
                            <span>{subItem.label}</span>
                           </li>
                        ))}
                    </ul>
                )}
            </li>
          ))}
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
