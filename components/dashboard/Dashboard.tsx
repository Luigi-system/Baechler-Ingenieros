
import React, { useState, useEffect } from 'react';
import StatCard from './StatCard';
import ReportsChart from './ReportsChart';
import { ReportsIcon, UsersIcon, CheckCircleIcon, ClockIcon, BuildingIcon, CogIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';
import type { ServiceReport } from '../../types';
import DashboardPieChart from './DashboardPieChart';
import DashboardBarChart from './DashboardBarChart';

interface DashboardStats {
    totalReports: number;
    activeUsers: number;
    completedServices: number;
    pendingReports: number;
}

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentReports, setRecentReports] = useState<ServiceReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // New states for expanded data
    const [topTechnician, setTopTechnician] = useState<{ name: string; count: number } | null>(null);
    const [topClient, setTopClient] = useState<{ name: string; count: number } | null>(null);
    const [reportsByStatus, setReportsByStatus] = useState<{ name: string; value: number }[]>([]);
    const [topClientsChartData, setTopClientsChartData] = useState<{ name: string; value: number }[]>([]);
    const [frequentMachines, setFrequentMachines] = useState<{ name: string; count: number }[]>([]);


    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);

            try {
                // --- Parallel Fetches from REST API ---
                const [
                    usersRes,
                    serviceReportsRes,
                    visitReportsRes
                ] = await Promise.all([
                    fetch('https://app.lr-system.com/bi/usuarios/getall').then(r => r.json()),
                    fetch('https://app.lr-system.com/bi/reporte-servicio/getall').then(r => r.json()),
                    fetch('https://app.lr-system.com/bi/reporte-visita/getall').then(r => r.json()),
                ]);

                const allUsers = Array.isArray(usersRes) ? usersRes : (usersRes.data || []);
                const allServiceReports = Array.isArray(serviceReportsRes) ? serviceReportsRes : (serviceReportsRes.data || []);
                const allVisitReports = Array.isArray(visitReportsRes) ? visitReportsRes : (visitReportsRes.data || []);

                // --- Process Base Stats ---
                const completedServices = allServiceReports.filter((r: any) => r.facturado === true || r.facturado === 1).length;
                const pendingReports = allServiceReports.length - completedServices;

                const currentStats = {
                    totalReports: allServiceReports.length + allVisitReports.length,
                    activeUsers: allUsers.length,
                    completedServices: completedServices,
                    pendingReports: pendingReports
                };
                setStats(currentStats);
                
                // Recent reports (combined or just service for now)
                const sortedReports = [...allServiceReports].sort((a: any, b: any) => 
                    new Date(b.created_at || b.fecha).getTime() - new Date(a.created_at || a.fecha).getTime()
                ).slice(0, 3);
                setRecentReports(sortedReports);
                
                // --- Process Expanded Data ---
                // 1. Reports by Status
                const finalizados = allServiceReports.filter((r: any) => r.estado === true || r.estado === 1 || r.estado === 'Finalizado').length;
                const enProgreso = allServiceReports.length - finalizados;
                setReportsByStatus([
                    { name: 'Finalizados', value: finalizados },
                    { name: 'En Progreso', value: enProgreso },
                ]);

                // 2. Top Client & Technician
                const clientCounts = allServiceReports.reduce((acc: Record<string, number>, { empresa_nombre }: any) => {
                    if (empresa_nombre) acc[empresa_nombre] = (acc[empresa_nombre] || 0) + 1;
                    return acc;
                }, {});

                const technicianCounts = allServiceReports.reduce((acc: Record<string, number>, { usuario_nombre }: any) => {
                    if (usuario_nombre) acc[usuario_nombre] = (acc[usuario_nombre] || 0) + 1;
                    return acc;
                }, {});

                const [topClientEntry] = Object.entries(clientCounts).sort(([, a], [, b]) => (b as number) - (a as number));
                const [topTechnicianEntry] = Object.entries(technicianCounts).sort(([, a], [, b]) => (b as number) - (a as number));

                setTopClient(topClientEntry ? { name: topClientEntry[0], count: topClientEntry[1] as number } : null);
                setTopTechnician(topTechnicianEntry ? { name: topTechnicianEntry[0], count: topTechnicianEntry[1] as number } : null);

                // 3. Top 5 Clients for Bar Chart
                setTopClientsChartData(
                    Object.entries(clientCounts).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 5).map(([name, value]) => ({ name, value: value as number }))
                );

                // 4. Top 5 Machines
                const machineCounts = allServiceReports.reduce((acc: Record<string, number>, { maquina_serie }: any) => {
                    if (maquina_serie) acc[maquina_serie] = (acc[maquina_serie] || 0) + 1;
                    return acc;
                }, {});

                const top5Machines = Object.entries(machineCounts).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 5).map(([name, count]) => ({ name, count: count as number }));
               setFrequentMachines(top5Machines);
                
            } catch (error: any) {
                console.error("Error fetching dashboard data:", error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Spinner />
                <span className="ml-2">Cargando dashboard...</span>
            </div>
        );
    }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-base-content">Dashboard</h2>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-6">
        <StatCard title="Total" value={stats?.totalReports.toLocaleString() ?? '0'} icon={<ReportsIcon className="h-6 w-6 md:h-8 md:w-8 text-white"/>} color="bg-info" className="p-3 md:p-6"/>
        <StatCard title="Usuarios" value={stats?.activeUsers.toLocaleString() ?? '0'} icon={<UsersIcon className="h-6 w-6 md:h-8 md:w-8 text-white"/>} color="bg-success" className="p-3 md:p-6"/>
        <StatCard title="Facturado" value={stats?.completedServices.toLocaleString() ?? '0'} icon={<CheckCircleIcon className="h-6 w-6 md:h-8 md:w-8 text-white"/>} color="bg-primary" className="p-3 md:p-6"/>
        <StatCard title="Pendiente" value={stats?.pendingReports.toLocaleString() ?? '0'} icon={<ClockIcon className="h-6 w-6 md:h-8 md:w-8 text-white"/>} color="bg-warning" className="p-3 md:p-6"/>
        <div className="col-span-1 md:col-span-1"><StatCard title="Top Técnico" value={topTechnician?.name || 'N/A'} subValue={`${topTechnician?.count || 0} rpt`} icon={<UsersIcon className="h-6 w-6 md:h-8 md:w-8 text-white"/>} color="bg-accent" className="p-3 md:p-6 h-full"/></div>
        <div className="col-span-1 md:col-span-1"><StatCard title="Top Cliente" value={topClient?.name || 'N/A'} subValue={`${topClient?.count || 0} rpt`} icon={<BuildingIcon className="h-6 w-6 md:h-8 md:w-8 text-white"/>} color="bg-secondary" className="p-3 md:p-6 h-full"/></div>
      </div>

      {/* Charts and other widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-base-200 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-base-content">Resumen de Reportes (Últimos 6 meses)</h3>
          <div className="h-80">
            <ReportsChart />
          </div>
        </div>
        <div className="bg-base-200 p-6 rounded-xl shadow-lg flex items-center justify-center opacity-50">
            <p className="text-neutral italic text-center">Panel de Insights (Desactivado)</p>
        </div>
        
        <div className="lg:col-span-1 bg-base-200 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-base-content">Top 5 Clientes por Reportes</h3>
            <DashboardBarChart data={topClientsChartData} />
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-base-200 p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-base-content">Reportes por Estado</h3>
                <DashboardPieChart data={reportsByStatus} />
            </div>
            <div className="bg-base-200 p-6 rounded-xl shadow-lg">
               <h3 className="text-xl font-semibold mb-4 text-base-content">Máquinas con Servicio Frecuente</h3>
               {frequentMachines.length > 0 ? (
                <ul className="space-y-3 mt-2 custom-scrollbar overflow-y-auto max-h-48 pr-2">
                  {frequentMachines.map(machine => (
                      <li key={machine.name} className="flex items-center justify-between text-sm p-2 rounded-md bg-base-100">
                          <div className="flex items-center gap-2">
                            <CogIcon className="h-5 w-5 text-neutral"/>
                            <span className="font-medium text-base-content">{machine.name}</span>
                          </div>
                          <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full text-xs">{machine.count}</span>
                      </li>
                  ))}
               </ul>
               ) : (
                 <p className="text-sm text-neutral mt-4">No hay datos de máquinas para analizar.</p>
               )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
