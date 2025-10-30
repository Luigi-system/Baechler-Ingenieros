"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var Icons_1 = require("../ui/Icons");
var ThemeContext_1 = require("../../contexts/ThemeContext");
var AuthContext_1 = require("../../contexts/AuthContext"); // Import AuthContext
var navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons_1.DashboardIcon, permission: 'dashboard' },
    {
        id: 'reports',
        label: 'Reportes',
        icon: Icons_1.ReportsIcon,
        permission: 'reports',
        subItems: [
            { id: 'reports-service', label: 'Reportes de Servicio', icon: Icons_1.ReportsIcon, permission: 'reports' },
            { id: 'reports-visit', label: 'Reportes de Visita', icon: Icons_1.ClipboardCheckIcon, permission: 'reports' },
        ]
    },
    {
        id: 'management',
        label: 'Gestión',
        icon: Icons_1.BuildingIcon,
        permission: 'management',
        subItems: [
            { id: 'management-companies', label: 'Empresas', icon: Icons_1.BuildingIcon, permission: 'management' },
            { id: 'management-plants', label: 'Plantas / Sedes', icon: Icons_1.IndustryIcon, permission: 'management' },
            { id: 'management-machines', label: 'Máquinas', icon: Icons_1.CogIcon, permission: 'management' },
            { id: 'management-supervisors', label: 'Encargados', icon: Icons_1.UserCircleIcon, permission: 'management' },
        ]
    },
    {
        id: 'settings',
        label: 'Configuración',
        icon: Icons_1.SettingsIcon,
        permission: 'settings',
        subItems: [
            { id: 'settings-customization', label: 'Personalización', icon: Icons_1.PaletteIcon, permission: 'settings' },
            { id: 'settings-database', label: 'Base de Datos', icon: Icons_1.DatabaseIcon, permission: 'settings' },
            { id: 'settings-users', label: 'Usuarios', icon: Icons_1.UsersIcon, permission: 'settings' },
            { id: 'settings-roles', label: 'Roles', icon: Icons_1.ShieldCheckIcon, permission: 'settings' },
            { id: 'settings-access', label: 'Accesos', icon: Icons_1.KeyIcon, permission: 'settings' },
            { id: 'settings-import', label: 'Importador', icon: Icons_1.UploadCloudIcon, permission: 'settings' },
        ]
    },
    {
        id: 'integrations',
        label: 'Integraciones',
        icon: Icons_1.DriveIcon,
        permission: 'settings',
        subItems: [
            { id: 'settings-ai', label: 'Servicios de IA', icon: Icons_1.CpuChipIcon, permission: 'settings' },
            { id: 'settings-agente', label: 'Agente AI Externo', icon: Icons_1.LinkIcon, permission: 'settings' }, // New sub-item for Agente
        ]
    },
];
var Sidebar = function (_a) {
    var activePage = _a.activePage, setActivePage = _a.setActivePage;
    var auth = (0, react_1.useContext)(AuthContext_1.AuthContext);
    var _b = (0, ThemeContext_1.useTheme)(), logoUrl = _b.logoUrl, appTitle = _b.appTitle;
    var _c = (0, react_1.useState)(false), isCollapsed = _c[0], setIsCollapsed = _c[1];
    var _d = (0, react_1.useState)(new Set(['reports', 'management', 'settings', 'integrations'])), openMenus = _d[0], setOpenMenus = _d[1];
    var toggleMenu = function (id) {
        setOpenMenus(function (prev) {
            var newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            }
            else {
                newSet.add(id);
            }
            return newSet;
        });
    };
    var filteredNavItems = navItems.filter(function (item) { var _a; return (_a = auth === null || auth === void 0 ? void 0 : auth.user) === null || _a === void 0 ? void 0 : _a.permissions.includes(item.permission); });
    return (<aside className={"\n      relative flex flex-col bg-base-200 shadow-xl transition-all duration-300 ease-in-out\n      ".concat(isCollapsed ? 'w-20' : 'w-64', "\n    ")}>
      <div className={"flex items-center border-b border-base-border ".concat(isCollapsed ? 'h-20 justify-center' : 'h-20 p-4')}>
        <img src={logoUrl} alt="App Logo" className={"transition-all duration-300 ".concat(isCollapsed ? 'h-10 w-10' : 'h-10')}/>
        {!isCollapsed && <span className="ml-3 text-2xl font-bold text-primary">{appTitle}</span>}
      </div>

      <nav className="flex-1 px-2 py-4 overflow-y-auto custom-scrollbar">
        <ul>
          {filteredNavItems.map(function (item) { return (<li key={item.id}>
                <div onClick={function () { return item.subItems ? toggleMenu(item.id) : setActivePage(item.id); }} className={"\n                        flex items-center p-3 my-1 rounded-lg cursor-pointer transition-all duration-200 ease-in-out\n                        ".concat(activePage.startsWith(item.id)
                ? 'bg-primary-lighter text-primary'
                : 'text-base-content hover:bg-base-300', "\n                        ").concat(isCollapsed ? 'justify-center' : '', "\n                    ")} title={isCollapsed ? item.label : ''}>
                    <item.icon className="h-6 w-6 shrink-0"/>
                    {!isCollapsed && <span className="ml-4 font-medium flex-1">{item.label}</span>}
                    {!isCollapsed && item.subItems && (<Icons_1.ChevronLeftIcon className={"h-5 w-5 transition-transform ".concat(openMenus.has(item.id) ? '-rotate-90' : '')}/>)}
                </div>
                {!isCollapsed && openMenus.has(item.id) && item.subItems && (<ul className="pl-8 border-l-2 border-base-300 ml-5">
                        {item.subItems.map(function (subItem) { return (<li key={subItem.id} onClick={function () { return setActivePage(subItem.id); }} className={"\n                                flex items-center p-2 my-1 rounded-md cursor-pointer transition-all duration-200 ease-in-out text-sm\n                                ".concat(activePage === subItem.id
                        ? 'text-primary font-semibold'
                        : 'text-neutral hover:bg-base-300', "\n                             ")}>
                            <subItem.icon className="h-5 w-5 mr-3 shrink-0"/>
                            <span>{subItem.label}</span>
                           </li>); })}
                    </ul>)}
            </li>); })}
        </ul>
      </nav>
      
      <div className="px-2 py-4 border-t border-base-border">
         <button onClick={function () { return setIsCollapsed(!isCollapsed); }} className={"\n            flex items-center p-3 w-full rounded-lg cursor-pointer transition-all duration-200 ease-in-out\n            text-base-content hover:bg-base-300\n            ".concat(isCollapsed ? 'justify-center' : '', "\n          ")}>
          {isCollapsed ? <Icons_1.MenuIcon className="h-6 w-6"/> : <Icons_1.ChevronLeftIcon className="h-6 w-6"/>}
          {!isCollapsed && <span className="ml-4 font-medium">Contraer</span>}
        </button>
      </div>
    </aside>);
};
exports.default = Sidebar;
