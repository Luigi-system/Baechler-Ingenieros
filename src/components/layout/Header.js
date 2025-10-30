"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var AuthContext_1 = require("../../contexts/AuthContext");
var ThemeToggle_1 = require("../ui/ThemeToggle");
var Icons_1 = require("../ui/Icons");
var recharts_1 = require("recharts");
// Dummy data for the notification charts
var reportsData = [{ name: 'Creados', value: 12 }, { name: 'Restantes', value: 8 }];
var tasksData = [{ name: 'Completadas', value: 5 }, { name: 'Pendientes', value: 3 }];
var profileData = [{ name: 'Completo', value: 85 }, { name: 'Restante', value: 15 }];
var COLORS = ['var(--color-primary)', 'var(--color-base-300)'];
var Header = function (_a) {
    var onNavigateToProfile = _a.onNavigateToProfile;
    var auth = (0, react_1.useContext)(AuthContext_1.AuthContext);
    var _b = (0, react_1.useState)(false), isProfileMenuOpen = _b[0], setIsProfileMenuOpen = _b[1];
    var _c = (0, react_1.useState)(false), isNotificationsOpen = _c[0], setIsNotificationsOpen = _c[1];
    if (!auth || !auth.user) {
        return null;
    }
    return (<header className="flex items-center justify-between p-4 bg-base-200 border-b border-base-border shadow-sm">
      <div>
        <h1 className="text-xl font-semibold text-base-content">Bienvenido, {auth.user.nombres}</h1>
        <p className="text-sm text-neutral">Rol: {auth.user.roleName}</p>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
            <button onClick={function () { return setIsNotificationsOpen(!isNotificationsOpen); }} className="relative">
                <Icons_1.BellIcon className="h-6 w-6 text-neutral cursor-pointer hover:text-primary"/>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
                </span>
            </button>

            {isNotificationsOpen && (<div className="absolute right-0 mt-2 w-80 bg-base-200 rounded-lg shadow-lg py-2 z-50 border border-base-border" onMouseLeave={function () { return setIsNotificationsOpen(false); }}>
                    <div className="px-4 py-2 border-b border-base-border">
                        <h4 className="font-semibold">Resumen de Actividad</h4>
                    </div>
                    <div className="p-4 grid grid-cols-3 gap-2 text-center">
                        <div className="flex flex-col items-center">
                            <recharts_1.ResponsiveContainer width="100%" height={60}>
                                <recharts_1.PieChart>
                                    <recharts_1.Pie data={reportsData} dataKey="value" cx="50%" cy="50%" innerRadius={18} outerRadius={25} fill="#8884d8" paddingAngle={5}>
                                        {reportsData.map(function (entry, index) { return <recharts_1.Cell key={"cell-".concat(index)} fill={COLORS[index % COLORS.length]}/>; })}
                                    </recharts_1.Pie>
                                </recharts_1.PieChart>
                            </recharts_1.ResponsiveContainer>
                            <p className="text-xs mt-1">12/20 Reportes</p>
                        </div>
                        <div className="flex flex-col items-center">
                             <recharts_1.ResponsiveContainer width="100%" height={60}>
                                <recharts_1.PieChart>
                                    <recharts_1.Pie data={tasksData} dataKey="value" cx="50%" cy="50%" innerRadius={18} outerRadius={25} fill="#82ca9d" paddingAngle={5}>
                                        {tasksData.map(function (entry, index) { return <recharts_1.Cell key={"cell-".concat(index)} fill={COLORS[index % COLORS.length]}/>; })}
                                    </recharts_1.Pie>
                                </recharts_1.PieChart>
                            </recharts_1.ResponsiveContainer>
                             <p className="text-xs mt-1">3 Tareas Pend.</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <recharts_1.ResponsiveContainer width="100%" height={60}>
                                <recharts_1.PieChart>
                                    <recharts_1.Pie data={profileData} dataKey="value" cx="50%" cy="50%" innerRadius={18} outerRadius={25} fill="#ffc658" paddingAngle={5}>
                                        {profileData.map(function (entry, index) { return <recharts_1.Cell key={"cell-".concat(index)} fill={COLORS[index % COLORS.length]}/>; })}
                                    </recharts_1.Pie>
                                </recharts_1.PieChart>
                            </recharts_1.ResponsiveContainer>
                            <p className="text-xs mt-1">Perfil al 85%</p>
                        </div>
                    </div>
                     <div className="px-4 py-3 border-t border-base-border">
                        <div className="flex items-start">
                            <Icons_1.CheckCircleIcon className="h-5 w-5 text-success mr-2 mt-0.5"/>
                            <p className="text-sm">¡Todo está al día! No hay nuevas notificaciones.</p>
                        </div>
                    </div>
                 </div>)}
        </div>
        
        <ThemeToggle_1.default />

        <div className="relative">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={function () { return setIsProfileMenuOpen(!isProfileMenuOpen); }}>
                <img className="h-10 w-10 rounded-full object-cover" src={"https://i.pravatar.cc/150?u=".concat(auth.user.email)} alt="User avatar"/>
                <div>
                  <p className="font-medium text-base-content">{auth.user.nombres}</p>
                  <p className="text-xs text-neutral">{auth.user.email}</p>
                </div>
            </div>
            
            {isProfileMenuOpen && (<div className="absolute right-0 mt-2 w-48 bg-base-200 rounded-md shadow-lg py-1 z-50 border border-base-border" onMouseLeave={function () { return setIsProfileMenuOpen(false); }}>
                    <button onClick={function () { onNavigateToProfile(); setIsProfileMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-base-content hover:bg-base-300">
                        <Icons_1.UserIcon className="h-5 w-5 mr-2"/>
                        Mi Perfil
                    </button>
                    <button onClick={function () { auth.logout(); setIsProfileMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-error hover:bg-base-300">
                      <Icons_1.LogoutIcon className="h-5 w-5 mr-2"/>
                      Cerrar sesión
                    </button>
                </div>)}
        </div>
      </div>
    </header>);
};
exports.default = Header;
