

import React, { useContext, useState } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';
import { BellIcon, LogoutIcon, UserIcon, CheckCircleIcon, MenuIcon, QrCodeIcon, ChevronDownIcon } from '../ui/Icons';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import QrScannerModal from '../ui/QrScannerModal';
import QrResultModal from '../ui/QrResultModal';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
    onNavigateToProfile: () => void;
    onToggleMobileSidebar: () => void;
    onEditReport: (id: number, type: 'service' | 'visit') => void;
    title?: string;
    subtitle?: string;
    children?: React.ReactNode;
}

// Dummy data for the notification charts
const reportsData = [{ name: 'Creados', value: 12 }, { name: 'Restantes', value: 8 }];
const tasksData = [{ name: 'Completadas', value: 5 }, { name: 'Pendientes', value: 3 }];
const profileData = [{ name: 'Completo', value: 85 }, { name: 'Restante', value: 15 }];
const COLORS = ['var(--color-primary)', 'var(--color-base-300)'];

const Header: React.FC<HeaderProps> = ({ onNavigateToProfile, onToggleMobileSidebar, onEditReport, title, subtitle, children }) => {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
    const [isQrResultOpen, setIsQrResultOpen] = useState(false);
    const [scannedData, setScannedData] = useState<{ type: 'service' | 'visit'; id: number } | null>(null);

    const handleScanSuccess = (data: { type: 'service' | 'visit'; id: number }) => {
        setScannedData(data);
        setIsQrResultOpen(true);
        setIsQrScannerOpen(false);
    };

    if (!auth || !auth.user) {
        return null;
    }

    return (
        <header className="flex items-center h-16 sm:h-20 px-2 sm:px-4 bg-base-200 border-b border-base-border shadow-sm sticky top-0 z-[50]">
            <div className="flex items-center gap-1 sm:gap-2 overflow-hidden shrink-0 max-w-[30%] xs:max-w-none">
                <button onClick={onToggleMobileSidebar} className="lg:hidden p-1.5 sm:p-2 -ml-1 text-neutral hover:bg-base-300 rounded-xl transition-colors shrink-0">
                    <MenuIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                <div className="flex flex-col min-w-0 transition-all">
                    <h1 className="text-[11px] sm:text-xl font-black text-base-content truncate uppercase tracking-tight sm:tracking-normal">
                        {title || (auth.user.nombres.split(' ')[0])}
                    </h1>
                    {subtitle ? (
                        <p className="text-[8px] sm:text-xs text-neutral truncate font-bold uppercase tracking-tight opacity-70 hidden xs:block">{subtitle}</p>
                    ) : (
                        <p className="hidden md:block text-xs text-neutral font-medium">Rol: {auth.user.roleName}</p>
                    )}
                </div>
            </div>

            {children && (
                <div className="flex-1 flex justify-center px-1 sm:px-4 min-w-0">
                    <div className="w-full max-w-lg min-w-0">
                        {children}
                    </div>
                </div>
            )}

            <div className="flex items-center gap-1.5 sm:gap-4 ml-auto flex-nowrap h-full">
                <div className="flex items-center h-full">
                    <button
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        className="relative p-1.5 sm:p-2 text-neutral hover:text-primary transition-colors hover:bg-base-300/50 rounded-xl shrink-0"
                    >
                        <BellIcon className="h-5 w-5 cursor-pointer" />
                        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error"></span>
                        </span>
                    </button>

                    {isNotificationsOpen && (
                        <div
                            className="absolute right-0 top-16 mt-2 w-80 bg-base-200 rounded-2xl shadow-2xl py-2 z-[60] border border-base-border animate-in fade-in slide-in-from-top-4 duration-300"
                            onMouseLeave={() => setIsNotificationsOpen(false)}
                        >
                            <div className="px-5 py-4 border-b border-base-border bg-base-300/30">
                                <h4 className="font-black uppercase tracking-widest text-xs text-base-content flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    Resumen de Actividad
                                </h4>
                            </div>
                            <div className="p-4 grid grid-cols-3 gap-2 text-center">
                                <div className="flex flex-col items-center">
                                    <ResponsiveContainer width="100%" height={60}>
                                        <PieChart>
                                            <Pie data={reportsData} dataKey="value" cx="50%" cy="50%" innerRadius={18} outerRadius={25} fill="#8884d8" paddingAngle={5}>
                                                {reportsData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <p className="text-[10px] uppercase font-black mt-1 text-base-content opacity-70">12/20 Reportes</p>
                                </div>
                                <div className="flex flex-col items-center">
                                    <ResponsiveContainer width="100%" height={60}>
                                        <PieChart>
                                            <Pie data={tasksData} dataKey="value" cx="50%" cy="50%" innerRadius={18} outerRadius={25} fill="#82ca9d" paddingAngle={5}>
                                                {tasksData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <p className="text-[10px] uppercase font-black mt-1 text-base-content opacity-70">3 Pendientes</p>
                                </div>
                                <div className="flex flex-col items-center">
                                    <ResponsiveContainer width="100%" height={60}>
                                        <PieChart>
                                            <Pie data={profileData} dataKey="value" cx="50%" cy="50%" innerRadius={18} outerRadius={25} fill="#ffc658" paddingAngle={5}>
                                                {profileData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <p className="text-[10px] uppercase font-black mt-1 text-base-content opacity-70">Perfil 85%</p>
                                </div>
                            </div>
                            <div className="px-5 py-4 border-t border-base-border bg-base-300/10">
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="h-5 w-5 text-success shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-base-content">¡Todo al día!</p>
                                        <p className="text-[10px] text-neutral mt-0.5">No hay nuevas notificaciones de mantenimiento.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setIsQrScannerOpen(true)}
                    className="p-1.5 sm:p-2 text-neutral hover:text-primary transition-all duration-300 bg-base-300/50 rounded-xl hover:bg-primary/20 group border border-transparent hover:border-primary/30 shrink-0"
                    title="Escanear QR de Reporte"
                >
                    <QrCodeIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </button>

                <div className="flex items-center h-full shrink-0">
                    <ThemeToggle />
                </div>

                <div className="h-8 w-[1px] bg-base-border/50 mx-1 hidden sm:block"></div>

                <div className="relative group shrink-0">
                    <div
                        className="flex items-center gap-2 sm:gap-3 cursor-pointer p-1 sm:p-1.5 hover:bg-base-300/50 rounded-xl transition-all duration-300"
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    >
                        <div className="relative h-9 w-9 shrink-0 aspect-square">
                            <img
                                className="h-9 w-9 w-full h-full rounded-full object-cover border-2 border-primary/20 ring-4 ring-primary/5 shadow-lg group-hover:scale-105 transition-transform shrink-0 aspect-square"
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.user.email}`}
                                alt="User avatar"
                            />
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-base-200 shadow-sm"></div>
                        </div>
                        <div className="hidden md:block">
                            <p className="text-xs font-black uppercase tracking-wider text-base-content leading-tight">{auth.user.nombres.split(' ')[0]}</p>
                            <p className="text-[10px] text-neutral font-bold opacity-70 leading-tight uppercase tracking-tighter">{auth.user.roleName}</p>
                        </div>
                        <ChevronDownIcon className={`h-4 w-4 text-neutral transition-transform duration-300 shrink-0 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {isProfileMenuOpen && (
                        <div
                            className="absolute right-0 top-14 mt-2 w-56 bg-base-200 rounded-2xl shadow-2xl py-2 z-[60] border border-base-border animate-in fade-in slide-in-from-top-4 duration-300"
                            onMouseLeave={() => setIsProfileMenuOpen(false)}
                        >
                            <div className="px-4 py-3 border-b border-base-border bg-base-300/20 mb-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral opacity-60">Gestionar Cuenta</p>
                            </div>
                            <button
                                onClick={() => { onNavigateToProfile(); setIsProfileMenuOpen(false); }}
                                className="w-[calc(100%-1rem)] mx-2 text-left flex items-center px-3 py-2.5 text-xs font-bold text-base-content hover:bg-primary/10 hover:text-primary rounded-xl transition-colors group"
                            >
                                <UserIcon className="h-5 w-5 mr-3 opacity-60 group-hover:opacity-100" />
                                Mi Perfil Técnico
                            </button>
                            <div className="h-[1px] bg-base-border/50 my-1 mx-4"></div>
                            <button
                                onClick={() => { auth.logout(); setIsProfileMenuOpen(false); }}
                                className="w-[calc(100%-1rem)] mx-2 text-left flex items-center px-3 py-2.5 text-xs font-bold text-error hover:bg-error/10 rounded-xl transition-colors group"
                            >
                                <LogoutIcon className="h-5 w-5 mr-3 opacity-60 group-hover:opacity-100" />
                                Cerrar Sesión Activa
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isQrScannerOpen && (
                <QrScannerModal
                    isOpen={isQrScannerOpen}
                    onClose={() => setIsQrScannerOpen(false)}
                    onScan={handleScanSuccess}
                />
            )}

            {isQrResultOpen && scannedData && (
                <QrResultModal
                    isOpen={isQrResultOpen}
                    onClose={() => setIsQrResultOpen(false)}
                    reportId={scannedData.id}
                    reportType={scannedData.type}
                    onEdit={() => {
                        onEditReport(scannedData.id, scannedData.type);
                        setIsQrResultOpen(false);
                    }}
                />
            )}
        </header>
    );
};

export default Header;