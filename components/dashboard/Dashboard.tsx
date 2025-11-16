
import React, { useState, useEffect } from 'react';
import StatCard from './StatCard';
import ReportsChart from './ReportsChart';
import { ReportsIcon, UsersIcon, CheckCircleIcon, ClockIcon, BuildingIcon, CogIcon } from '../ui/Icons';
import { useSupabase } from '../../contexts/SupabaseContext';
import Spinner from '../ui/Spinner';
import type { ServiceReport } from '../../types';
import AiInsights from './AiInsights';
import DashboardPieChart from './DashboardPieChart';
import DashboardBarChart from './DashboardBarChart';

interface DashboardStats {
    totalReports: number;
    activeUsers: number;
    completedServices: number;
    pendingReports: number;
}

const Dashboard: React.FC = () => {
    const { supabase } = useSupabase();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentReports, setRecentReports] = useState<ServiceReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // New states for expanded data
    const [topTechnician, setTopTechnician] = useState<{ name: string; count: number } | null>(null);
    const [topClient, setTopClient] = useState<{ name: string; count: number } | null>(null);
    const [reportsByStatus, setReportsByStatus] = useState<{ name: string; value: number }[]>([]);
    const [topClientsChartData, setTopClientsChartData] = useState<{ name: string; value: number }[]>([]);
    const [frequentMachines, setFrequentMachines] = useState<{ name: string; count: number }[]>([]);
    const [aiPromptData, setAiPromptData] = useState<string>('');


    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!supabase) return;
            setIsLoading(true);

            try {
                // --- Parallel Fetches for Speed ---
                const [
                    totalReportsRes,
                    activeUsersRes,
                    completedServicesRes,
                    pendingReportsRes,
                    recentReportsRes,
                    allServiceReportsRes
                ] = await Promise.all([
                    supabase.from('Reporte_Servicio').select('id', { count: 'exact', head: true }),
                    supabase.from('Usuarios').select('id', { count: 'exact', head: true }),
                    supabase.from('Reporte_Servicio').select('id', { count: 'exact', head: true }).eq('facturado', true),
                    supabase.from('Reporte_Servicio').select('id', { count: 'exact', head: true }).is('facturado', false),
                    supabase.from('Reporte_Servicio').select('id, created_at, codigo, usuario_nombre').order('created_at', { ascending: false }).limit(3),
                    supabase.from('Reporte_Servicio').select('id, empresa_nombre, usuario_nombre, estado, maquina_seria')
                ]);

                // --- Process Base Stats ---
                const currentStats = {
                    totalReports: totalReportsRes.count ?? 0,
                    activeUsers: activeUsersRes.count ?? 0,
                    completedServices: completedServicesRes.count ?? 0,
                    pendingReports: pendingReportsRes.count ?? 0
                };
                setStats(currentStats);
                if (recentReportsRes.data) setRecentReports(recentReportsRes.data as ServiceReport[]);
                
                // --- Process Expanded Data from allServiceReportsRes ---
                if (allServiceReportsRes.error) throw allServiceReportsRes.error;
                const allServiceReports = allServiceReportsRes.data || [];

                // 1. Reports by Status (Finalizado vs En Progreso)
                const finalizados = allServiceReports.filter(r => r.estado).length;
                const enProgreso = allServiceReports.length - finalizados;
                setReportsByStatus([
                    { name: 'Finalizados', value: finalizados },
                    { name: 'En Progreso', value: enProgreso },
                ]);

                // 2. Top Client & Technician (frequency count)
                // FIX: Untyped function calls may not accept type arguments. The generic type argument was removed from .reduce() and the accumulator 'acc' was explicitly typed in the callback to resolve this.
                const clientCounts = allServiceReports.reduce((acc: Record<string, number>, { empresa_nombre }) => {
                    if (empresa_nombre) acc[empresa_nombre] = (acc[empresa_nombre] || 0) + 1;
                    return acc;
                }, {});

                // FIX: Untyped function calls may not accept type arguments. The generic type argument was removed from .reduce() and the accumulator 'acc' was explicitly typed in the callback to resolve this.
                const technicianCounts = allServiceReports.reduce((acc: Record<string, number>, { usuario_nombre }) => {
                    if (usuario_nombre) acc[usuario_nombre] = (acc[usuario_nombre] || 0) + 1;
                    return acc;
                }, {});

                // FIX: Cast sort comparison values to Number to ensure correct arithmetic operation.
                const [topClientEntry] = Object.entries(clientCounts).sort(([, a], [, b]) => Number(b) - Number(a));
                const [topTechnicianEntry] = Object.entries(technicianCounts).sort(([, a], [, b]) => Number(b) - Number(a));

                setTopClient(topClientEntry ? { name: topClientEntry[0], count: topClientEntry[1] } : null);
                setTopTechnician(topTechnicianEntry ? { name: topTechnicianEntry[0], count: topTechnicianEntry[1] } : null);

                // 3. Top 5 Clients for Bar Chart
                setTopClientsChartData(
                    Object.entries(clientCounts).sort(([, a], [, b]) => Number(b) - Number(a)).slice(0, 5).map(([name, value]) => ({ name, value }))
                );

                // 4. Top 5 Machines for List
                // FIX: Untyped function calls may not accept type arguments. The generic type argument was removed from .reduce() and the accumulator 'acc' was explicitly typed in the callback to resolve this.
                const machineCounts = allServiceReports.reduce((acc: Record<string, number>, { maquina_seria }) => {
                    if (maquina_seria) acc[maquina_seria] = (acc[maquina_seria] || 0) + 1;
                    return acc;
                }, {});

                const top5Machines = Object.entries(machineCounts).sort(([, a], [, b]) => Number(b) - Number(a)).slice(0, 5).map(([name, count]) => ({ name, count }));
                
                // 5. Prepare summary for AI Insights
                const summaryForAI = `Total de reportes: ${currentStats.totalReports}, Reportes pendientes de facturación: ${currentStats.pendingReports}, Cliente principal: ${topClientEntry ? `${topClientEntry[0]} (${topClientEntry[1]} reportes)` : 'N/A'}, Técnico más activo: ${topTechnicianEntry ? `${topTechnicianEntry[0]} (${topTechnicianEntry[1]} reportes)` : 'N/A'}, Máquinas con más fallas: ${top5Machines.map(m => `${m.name} (${m.count} veces)`).join(', ')}.`;
                setAiPromptData(summaryForAI);


            } catch (error: any) {
                console.error("Error fetching dashboard data:", error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [supabase]);

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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <StatCard title="Reportes Totales" value={stats?.totalReports.toLocaleString() ?? '0'} icon={<ReportsIcon className="h-8 w-8 text-white"/>} color="bg-info"/>
        <StatCard title="Usuarios Activos" value={stats?.activeUsers.toLocaleString() ?? '0'} icon={<UsersIcon className="h-8 w-8 text-white"/>} color="bg-success"/>
        <StatCard title="Servicios Facturados" value={stats?.completedServices.toLocaleString() ?? '0'} icon={<CheckCircleIcon className="h-8 w-8 text-white"/>} color="bg-primary"/>
        <StatCard title="Pendientes de Factura" value={stats?.pendingReports.toLocaleString() ?? '0'} icon={<ClockIcon className="h-8 w-8 text-white"/>} color="bg-warning"/>
        <StatCard title="Técnico más Activo" value={topTechnician?.name || 'N/A'} subValue={`${topTechnician?.count || 0} reportes`} icon={<UsersIcon className="h-8 w-8 text-white"/>} color="bg-accent"/>
        <StatCard title="Cliente Principal" value={topClient?.name || 'N/A'} subValue={`${topClient?.count || 0} reportes`} icon={<BuildingIcon className="h-8 w-8 text-white"/>} color="bg-secondary"/>
      </div>

      {/* Charts and other widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-base-200 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-base-content">Resumen de Reportes (Últimos 6 meses)</h3>
          <div className="h-80">
            <ReportsChart />
          </div>
        </div>
        <div className="bg-base-200 p-6 rounded-xl shadow-lg">
            <AiInsights summary={aiPromptData} />
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
