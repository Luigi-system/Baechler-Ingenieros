
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface ChartData {
    name: string;
    value: number;
}

interface DashboardPieChartProps {
    data: ChartData[];
}

const COLORS = ['var(--color-success)', 'var(--color-warning)', 'var(--color-info)', 'var(--color-accent)'];

const DashboardPieChart: React.FC<DashboardPieChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
      return <div className="flex items-center justify-center h-full text-sm text-neutral">No hay datos disponibles para mostrar.</div>;
  }
  
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie 
            data={data} 
            dataKey="value" 
            nameKey="name" 
            cx="50%" 
            cy="50%" 
            outerRadius={80} 
            labelLine={false}
            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                return (
                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12px" fontWeight="bold">
                        {`${(percent * 100).toFixed(0)}%`}
                    </text>
                );
            }}
        >
          {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: 'var(--color-base-200)', border: '1px solid var(--color-base-border)' }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default DashboardPieChart;
