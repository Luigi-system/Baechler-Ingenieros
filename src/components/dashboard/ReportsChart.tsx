
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useSupabase } from '../../contexts/SupabaseContext';
import Spinner from '../ui/Spinner';

interface ChartData {
    name: string;
    service: number;
    visit: number;
}

const ReportsChart: React.FC = () => {
  const { themeMode } = useTheme();
  const { supabase } = useSupabase();
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
        if (!supabase) return;
        setIsLoading(true);

        // 1. Get last 6 months
        const today = new Date();
        const lastSixMonths: ChartData[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            lastSixMonths.push({
                name: d.toLocaleString('default', { month: 'short' }),
                service: 0,
                visit: 0,
            });
        }
        const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

        try {
            // 2. Fetch service reports
            const { data: reports, error } = await supabase
                .from('Reporte_Servicio')
                .select('fecha')
                .gte('fecha', sixMonthsAgo.toISOString().split('T')[0]);
            
            if (error) throw error;
            
            // 3. Process data
            reports.forEach(report => {
                const reportDate = new Date(report.fecha);
                const monthName = reportDate.toLocaleString('default', { month: 'short' });
                const monthIndex = lastSixMonths.findIndex(m => m.name === monthName);
                if (monthIndex > -1) {
                    lastSixMonths[monthIndex].service++;
                }
            });

            setData(lastSixMonths);

        } catch (error: any) {
            console.error("Error fetching chart data:", error.message);
        } finally {
            setIsLoading(false);
        }
    };
    fetchChartData();
  }, [supabase]);


  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Spinner /></div>;
  }
  
  const tickColor = themeMode === 'dark' ? '#9CA3AF' : '#6B7280';
  const gridColor = themeMode === 'dark' ? '#374151' : '#E5E7EB';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="colorService" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorVisit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="name" stroke={tickColor} />
        <YAxis stroke={tickColor} />
        <Tooltip
          contentStyle={{
            backgroundColor: themeMode === 'dark' ? '#1F2937' : '#FFFFFF',
            borderColor: themeMode === 'dark' ? '#4B5563' : '#E5E7EB',
          }}
        />
        <Legend />
        <Area type="monotone" dataKey="service" name="Reportes de Servicio" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorService)" />
        <Area type="monotone" dataKey="visit" name="Reportes de Visita" stroke="var(--color-secondary)" fillOpacity={1} fill="url(#colorVisit)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ReportsChart;