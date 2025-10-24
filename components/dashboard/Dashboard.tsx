import React, { useState, useEffect } from 'react';
import StatCard from './StatCard';
import ReportsChart from './ReportsChart';
import { ReportsIcon, UsersIcon, CheckCircleIcon, ClockIcon } from '../ui/Icons';
import { useSupabase } from '../../contexts/SupabaseContext';
import Spinner from '../ui/Spinner';
import type { ServiceReport } from '../../types';

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

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!supabase) return;
            setIsLoading(true);

            try {
                const [
                    totalReportsRes,
                    activeUsersRes,
                    completedServicesRes,
                    pendingReportsRes,
                    recentReportsRes,
                ] = await Promise.all([
                    supabase.from('Reporte_Servicio').select('id', { count: 'exact', head: true }),
                    supabase.from('Usuarios').select('id', { count: 'exact', head: true }),
                    supabase.from('Reporte_Servicio').select('id', { count: 'exact', head: true }).eq('facturado', true),
                    supabase.from('Reporte_Servicio').select('id', { count: 'exact', head: true }).eq('no_facturado', true),
                    supabase.from('Reporte_Servicio').select('*, empresa:Empresa(nombre), usuario:Usuarios(nombres)').order('created_at', { ascending: false }).limit(3)
                ]);

                setStats({
                    totalReports: totalReportsRes.count ?? 0,
                    activeUsers: activeUsersRes.count ?? 0,
                    completedServices: completedServicesRes.count ?? 0,
                    pendingReports: pendingReportsRes.count ?? 0
                });
                
                if (recentReportsRes.data) {
                    setRecentReports(recentReportsRes.data as ServiceReport[]);
                }

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
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Reportes Totales" 
          value={stats?.totalReports.toLocaleString() ?? '0'} 
          icon={<ReportsIcon className="h-8 w-8 text-white"/>} 
          color="bg-blue-500"
        />
        <StatCard 
          title="Usuarios Activos" 
          value={stats?.activeUsers.toLocaleString() ?? '0'} 
          icon={<UsersIcon className="h-8 w-8 text-white"/>}
          color="bg-green-500"
        />
        <StatCard 
          title="Servicios Completados" 
          value={stats?.completedServices.toLocaleString() ?? '0'}
          icon={<CheckCircleIcon className="h-8 w-8 text-white"/>}
          color="bg-indigo-500"
        />
        <StatCard 
          title="Reportes Pendientes" 
          value={stats?.pendingReports.toLocaleString() ?? '0'}
          icon={<ClockIcon className="h-8 w-8 text-white"/>}
          color="bg-yellow-500"
        />
      </div>

      {/* Charts and other widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Resumen de Reportes (Últimos 6 meses)</h3>
          <div className="h-80">
            <ReportsChart />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
           <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Actividad Reciente</h3>
           {recentReports.length > 0 ? (
            <ul className="space-y-4">
              {recentReports.map(report => (
                  <li key={report.id} className="flex items-start">
                      <div className="flex-shrink-0"><CheckCircleIcon className="h-5 w-5 text-green-500 mt-1"/></div>
                      <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {/* FIX: Removed 'as any' type assertion for 'report.usuario' as the 'ServiceReport' type has been updated with the correct property definition. */}
                            {report.usuario?.nombres ?? 'Usuario desconocido'} creó el reporte #{report.codigo_reporte}.
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(report.created_at ?? '').toLocaleDateString()}
                          </p>
                      </div>
                  </li>
              ))}
           </ul>
           ) : (
             <p className="text-sm text-gray-500 dark:text-gray-400">No hay actividad reciente.</p>
           )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;