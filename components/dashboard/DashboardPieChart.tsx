
import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ChartData {
    name: string;
    value: number;
}

interface DashboardPieChartProps {
    data: ChartData[];
}

const DashboardPieChart: React.FC<DashboardPieChartProps> = ({ data }) => {
    const { themeMode } = useTheme();
    const isDark = themeMode === 'dark';

    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-sm text-neutral">No hay datos disponibles para mostrar.</div>;
    }

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderColor: isDark ? '#4B5563' : '#E5E7EB',
            textStyle: { color: isDark ? '#F3F4F6' : '#111827' },
            padding: [10, 14],
            borderRadius: 8,
            formatter: '{b}: <span style="font-weight:bold">{c}</span> ({d}%)'
        },
        legend: {
            bottom: '0%',
            left: 'center',
            textStyle: { color: isDark ? '#9CA3AF' : '#4B5563', fontSize: 11 },
            icon: 'circle',
            itemGap: 15
        },
        series: [
            {
                name: 'Estado de Reportes',
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: isDark ? '#111827' : '#fff',
                    borderWidth: 2
                },
                label: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 14,
                        fontWeight: 'bold',
                        color: isDark ? '#F3F4F6' : '#111827'
                    }
                },
                labelLine: {
                    show: false
                },
                data: data.map((item, index) => ({
                    ...item,
                    itemStyle: {
                        color: ['#10b981', '#f59e0b', '#0ea5e9', '#8b5cf6'][index % 4]
                    }
                }))
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

export default DashboardPieChart;
