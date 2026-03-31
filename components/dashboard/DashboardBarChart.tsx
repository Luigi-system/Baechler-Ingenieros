
import React from 'react';
import ReactECharts from 'echarts-for-react';
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
    const isDark = themeMode === 'dark';

    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-sm text-neutral">No hay datos disponibles para mostrar.</div>;
    }

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderColor: isDark ? '#4B5563' : '#E5E7EB',
            textStyle: { color: isDark ? '#F3F4F6' : '#111827' },
            padding: [10, 14],
            borderRadius: 8
        },
        grid: {
            left: '3%',
            right: '10%',
            top: '5%',
            bottom: '5%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: isDark ? '#374151' : '#E5E7EB', type: 'dashed' } },
            axisLabel: { color: isDark ? '#9CA3AF' : '#6B7280', fontSize: 10 }
        },
        yAxis: {
            type: 'category',
            data: data.map(d => d.name),
            axisLine: { lineStyle: { color: isDark ? '#374151' : '#E5E7EB' } },
            axisLabel: { 
                color: isDark ? '#9CA3AF' : '#6B7280', 
                fontSize: 10,
                width: 100,
                overflow: 'break'
            }
        },
        series: [
            {
                name: 'Reportes',
                type: 'bar',
                data: data.map(d => d.value),
                itemStyle: {
                    color: '#fbbf24', // Secondary
                    borderRadius: [0, 5, 5, 0]
                },
                barWidth: 20,
                showBackground: true,
                backgroundStyle: {
                    color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    borderRadius: [0, 5, 5, 0]
                }
            }
        ]
    };

    return (
        <ReactECharts 
            option={option} 
            style={{ height: '250px', width: '100%' }}
            notMerge={true}
            lazyUpdate={true}
        />
    );
};

export default DashboardBarChart;
