
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';

interface ChartData {
    name: string;
    value: number;
}

interface DashboardBarChartProps {
    data: ChartData[];
}

const DashboardBarChart: React.FC<DashboardBarChartProps> = ({ data }) => {
  const { themeMode } = useTheme();
  const tickColor = themeMode === 'dark' ? '#9CA3AF' : '#6B7280';
  
  if (!data || data.length === 0) {
      return <div className="flex items-center justify-center h-full text-sm text-neutral">No hay datos disponibles para mostrar.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-base-border)" />
        <XAxis type="number" stroke={tickColor} fontSize={10} allowDecimals={false} />
        <YAxis 
            type="category" 
            dataKey="name" 
            stroke={tickColor} 
            fontSize={10} 
            width={80} 
            tick={{ textAnchor: 'end' }}
            interval={0}
        />
        <Tooltip 
            cursor={{ fill: 'var(--color-base-300)' }}
            contentStyle={{ 
                backgroundColor: 'var(--color-base-200)', 
                border: '1px solid var(--color-base-border)',
                borderRadius: '0.5rem'
            }} 
        />
        <Bar dataKey="value" name="Reportes" fill="var(--color-secondary)" radius={[0, 4, 4, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DashboardBarChart;
