
import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../../contexts/ThemeContext';
import Spinner from '../ui/Spinner';

interface ChartData {
    name: string;
    service: number;
    visit: number;
}

const ReportsChart: React.FC = () => {
    const { themeMode } = useTheme();
    const [data, setData] = useState<ChartData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchChartData = async () => {
            setIsLoading(true);

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
                const [serviceRes, visitRes] = await Promise.all([
                    fetch('https://app.lr-system.com/bi/reporte-servicio/getall').then(r => r.json()),
                    fetch('https://app.lr-system.com/bi/reporte-visita/getall').then(r => r.json()),
                ]);

                const serviceReports = Array.isArray(serviceRes) ? serviceRes : (serviceRes.data || []);
                const visitReports = Array.isArray(visitRes) ? visitRes : (visitRes.data || []);
                
                serviceReports.forEach((report: any) => {
                    const reportDate = new Date(report.fecha);
                    if (reportDate >= sixMonthsAgo) {
                        const monthName = reportDate.toLocaleString('default', { month: 'short' });
                        const monthIndex = lastSixMonths.findIndex(m => m.name === monthName);
                        if (monthIndex > -1) lastSixMonths[monthIndex].service++;
                    }
                });

                visitReports.forEach((report: any) => {
                    const reportDate = new Date(report.fecha || report.created_at);
                    if (reportDate >= sixMonthsAgo) {
                        const monthName = reportDate.toLocaleString('default', { month: 'short' });
                        const monthIndex = lastSixMonths.findIndex(m => m.name === monthName);
                        if (monthIndex > -1) lastSixMonths[monthIndex].visit++;
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
    }, []);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    }

    const isDark = themeMode === 'dark';
    
    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderColor: isDark ? '#4B5563' : '#E5E7EB',
            textStyle: { color: isDark ? '#F3F4F6' : '#111827' },
            padding: [12, 16],
            borderRadius: 8,
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.1)'
        },
        legend: {
            data: ['Reportes de Servicio', 'Reportes de Visita'],
            textStyle: { color: isDark ? '#9CA3AF' : '#4B5563', fontSize: 12 },
            bottom: 0,
            icon: 'circle'
        },
        grid: {
            left: '3%',
            right: '4%',
            top: '10%',
            bottom: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: data.map(d => d.name),
            axisLine: { lineStyle: { color: isDark ? '#374151' : '#E5E7EB' } },
            axisLabel: { color: isDark ? '#9CA3AF' : '#6B7280', margin: 15 }
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: isDark ? '#374151' : '#E5E7EB', type: 'dashed' } },
            axisLabel: { color: isDark ? '#9CA3AF' : '#6B7280' }
        },
        series: [
            {
                name: 'Reportes de Servicio',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                itemStyle: { color: '#0061e0' }, // Primary
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(0, 97, 224, 0.4)' },
                            { offset: 1, color: 'rgba(0, 97, 224, 0)' }
                        ]
                    }
                },
                data: data.map(d => d.service)
            },
            {
                name: 'Reportes de Visita',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                itemStyle: { color: '#fbbf24' }, // Yellow/Secondary
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(251, 191, 36, 0.4)' },
                            { offset: 1, color: 'rgba(251, 191, 36, 0)' }
                        ]
                    }
                },
                data: data.map(d => d.visit)
            }
        ]
    };

    return (
        <ReactECharts 
            option={option} 
            style={{ height: '320px', width: '100%' }}
            notMerge={true}
            lazyUpdate={true}
        />
    );
};

export default ReportsChart;