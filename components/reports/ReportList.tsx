import React, { useState, useEffect, useMemo } from 'react';
import type { ServiceReport } from '../../types';
import {
    SearchIcon, PlusIcon, EditIcon, ViewIcon,
    DownloadIcon, MailIcon, TrashIcon, CheckCircleIcon,
    AlertTriangleIcon, ClockIcon, BriefcaseIcon, MapPinIcon,
    ClipboardCheckIcon, SparklesIcon, DotsVerticalIcon, QrCodeIcon,
    CopyIcon
} from '../ui/Icons';
import Dropdown from '../ui/Dropdown';
import Spinner from '../ui/Spinner';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { pdf } from '@react-pdf/renderer';
import ServiceReportPdf from './ServiceReportPdf';
import PdfViewerModal from '../ui/PdfViewerModal';
import ProgressCircle from '../ui/ProgressCircle';
import EmailModal from '../ui/EmailModal';

interface ReportListProps {
    reportType: 'service' | 'visit';
    onCreateReport: () => void;
    onEditReport: (id: number) => void;
}

const calculateCompletion = (report: ServiceReport): { percentage: number; missingFields: string[] } => {
    const fields = [
        { name: 'Identificador', isComplete: !!report.id },
        { name: 'Fecha', isComplete: !!report.fecha },
        { name: 'Empresa', isComplete: !!report.empresa_nombre },
        { name: 'Planta', isComplete: !!report.empresa_planta },
        { name: 'N° Serie', isComplete: !!report.maquina_serie },
        { name: 'Problemas', isComplete: !!report.problemas_encontrados },
        { name: 'Acciones', isComplete: !!report.acciones_realizadas },
        { name: 'Encargado', isComplete: !!report.encargado_nombre },
        { name: 'Firma', isComplete: !!report.foto_firma },
    ];

    const completedCount = fields.filter(f => f.isComplete).length;
    const missingFields = fields.filter(f => !f.isComplete).map(f => f.name);

    return {
        percentage: (completedCount / fields.length) * 100,
        missingFields,
    };
};

const ReportList: React.FC<ReportListProps> = ({ reportType, onCreateReport, onEditReport }) => {
    const { logoUrl } = useTheme();
    const { addNotification, confirm } = useNotification();
    const [reports, setReports] = useState<ServiceReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pdfLoadingId, setPdfLoadingId] = useState<number | null>(null);
    const [pdfViewingId, setPdfViewingId] = useState<number | null>(null);
    const [pdfViewerUri, setPdfViewerUri] = useState<string | null>(null);
    const [emailModalState, setEmailModalState] = useState<{ isOpen: boolean; reportId: number | null }>({ isOpen: false, reportId: null });
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchReports = async () => {
        if (reportType !== 'service') {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('https://app.lr-system.com/bi/reporte-servicio/getall');
            const data = await res.json();
            setReports(Array.isArray(data) ? data : (data.data || []));
        } catch (err: any) {
            setError(err.message || 'Error al conectar con la API');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [reportType]);

    const handleStatusToggle = async (report: ServiceReport) => {
        if (!report.id) return;

        const newStatus = report.estado ? 0 : 1; 
        try {
            const res = await fetch(`https://app.lr-system.com/bi/reporte-servicio/update/${report.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: newStatus })
            });

            if (!res.ok) throw new Error('Error al actualizar estado');

            setReports(prev => prev.map(r => r.id === report.id ? { ...r, estado: newStatus === 1 } : r));
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Error', message: err.message });
        }
    };

    const handleDelete = async (id: number) => {
        confirm({
            title: '¿Eliminar reporte?',
            message: '¿Estás seguro de que quieres eliminar este reporte? Esta acción no se puede deshacer.',
            onConfirm: async () => {
                try {
                    const res = await fetch(`https://app.lr-system.com/bi/reporte-servicio/delete/${id}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error('Error al eliminar');
                    addNotification({ type: 'success', title: 'Eliminado', message: 'Reporte eliminado correctamente' });
                    await fetchReports();
                } catch (err: any) {
                    addNotification({ type: 'error', title: 'Error', message: err.message });
                }
            }
        });
    };

    const handleDownloadPDF = async (reportId: number) => {
        setPdfLoadingId(reportId);
        try {
            const res = await fetch(`https://app.lr-system.com/bi/reporte-servicio/get/${reportId}`);
            const data = await res.json();
            const reportData = Array.isArray(data) ? data[0] : (data.data || data);
            
            const pdfBlob = await pdf(
                <ServiceReportPdf 
                    report={{ ...reportData, id: reportId } as ServiceReport} 
                    logoUrl={logoUrl || undefined} 
                    serial={reportData.codigo || String(reportId).padStart(4, '0')} 
                />
            ).toBlob();
            
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Reporte_${reportData.codigo || reportId}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error("Error in Download PDF List:", err);
            addNotification({ type: 'error', title: 'Error', message: `No se pudo generar el PDF: ${err.message}` });
        } finally {
            setPdfLoadingId(null);
        }
    };

    const handleViewPDF = async (reportId: number) => {
        setPdfViewingId(reportId);
        try {
            const res = await fetch(`https://app.lr-system.com/bi/reporte-servicio/get/${reportId}`);
            const data = await res.json();
            let reportData = Array.isArray(data) ? data[0] : (data.data || data);
            
            // FETCH LATEST COMPANY DATA using by-nombre to fill in RUC, Distrito, Dirección if they are missing
            if (reportData.empresa_nombre) {
                try {
                    const companyByRes = await fetch(`https://app.lr-system.com/bi/empresas/by-nombre/${encodeURIComponent(reportData.empresa_nombre)}`).then(r => r.json());
                    const companyData = Array.isArray(companyByRes) ? companyByRes[0] : (Array.isArray(companyByRes.data) ? companyByRes.data[0] : (companyByRes.data || companyByRes));
                    if (companyData && companyData.id) {
                        reportData = {
                            ...reportData,
                            empresa_ruc: reportData.empresa_ruc || companyData.ruc || (companyData as any).numero_doc || '',
                            empresa_distrito: reportData.empresa_distrito || companyData.distrito || '',
                            empresa_direccion: reportData.empresa_direccion || companyData.direccion || '',
                        };
                    }
                } catch (err) {
                    console.warn("Could not fetch latest company data, using report data only", err);
                }
            }

            // Always regenerate to ensure latest ID/QR layout is used
            const pdfBlob = await pdf(
                <ServiceReportPdf 
                    report={{ ...reportData, id: reportId } as ServiceReport} 
                    logoUrl={logoUrl || undefined} 
                    serial={reportData.codigo || String(reportId).padStart(4, '0')} 
                />
            ).toBlob();
            
            const blobUrl = URL.createObjectURL(pdfBlob);
            setPdfViewerUri(blobUrl);
        } catch (err: any) {
            console.error("Error in View PDF List:", err);
            addNotification({ type: 'error', title: 'Error', message: `No se pudo visualizar el PDF: ${err.message}` });
        } finally {
            setPdfViewingId(null);
        }
    };

    useEffect(() => {
        return () => {
            if (pdfViewerUri && pdfViewerUri.startsWith('blob:')) {
                URL.revokeObjectURL(pdfViewerUri);
            }
        };
    }, [pdfViewerUri]);

    const handleSendEmail = (reportId: number) => {
        setEmailModalState({ isOpen: true, reportId });
    };

    const handleCopyLink = (reportId: number) => {
        const link = `${window.location.origin}/preview/reporte-servicio/${reportId}`;
        navigator.clipboard.writeText(link)
            .then(() => addNotification({ type: 'success', title: 'Copiado', message: 'Enlace de firma copiado al portapapeles' }))
            .catch(err => addNotification({ type: 'error', title: 'Error', message: 'Error al copiar enlace: ' + err }));
    };

    const filteredReports = useMemo(() => {
        return reports.filter(report =>
            (String(report.id) || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (report.empresa_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (report.usuario_nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [reports, searchTerm]);

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-base-200/50 p-4 rounded-2xl border border-base-border">
                <div className="flex-1 relative">
                    <SearchIcon className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-neutral" />
                    <input
                        type="text"
                        placeholder="Buscar reporte..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                    />
                </div>
                <button
                    onClick={onCreateReport}
                    className="flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 text-sm font-black text-white bg-primary rounded-xl hover:bg-primary-focus transition-all shadow-lg shadow-primary/20 active:scale-95 whitespace-nowrap uppercase tracking-widest"
                >
                    <PlusIcon className="h-4 w-4" />
                    <span>Nuevo Reporte</span>
                </button>
            </div>

            {/* List Content */}
            {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Spinner className="h-10 w-10 text-primary mb-2" />
                    <p className="text-[10px] text-neutral animate-pulse font-black uppercase tracking-[0.3em]">Sincronizando Archivos...</p>
                </div>
            ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center text-error p-8 border border-error/20 rounded-2xl bg-error/5 border-dashed">
                    <AlertTriangleIcon className="h-12 w-12 mb-4 opacity-30" />
                    <p className="font-bold text-center text-sm">{error}</p>
                    <button onClick={fetchReports} className="mt-4 px-8 py-2 bg-error text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-error/80">Reintentar</button>
                </div>
            ) : (
                <div className="bg-base-200 border border-base-border shadow-sm rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0">
                    <div className="overflow-auto flex-1 custom-scrollbar">
                        {/* Desktop View Table */}
                        <table className="hidden lg:table w-full text-left border-collapse min-w-[1000px]">
                            <thead className="bg-base-300 border-b border-base-border sticky top-0 z-20">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-neutral uppercase tracking-widest">Código / Ref</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-neutral uppercase tracking-widest">Localización / Cliente</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-neutral uppercase tracking-widest">Asignación</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-neutral uppercase tracking-widest">Progreso</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-neutral uppercase tracking-widest">Estado</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-neutral uppercase tracking-widest text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-base-border">
                                {filteredReports.length > 0 ? filteredReports.map((report) => {
                                    const { percentage, missingFields } = calculateCompletion(report);
                                    return (
                                        <tr 
                                            key={report.id} 
                                            onClick={() => onEditReport(report.id as number)}
                                            className="hover:bg-primary/5 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-base-content leading-tight group-hover:text-primary transition-colors">
                                                        #{String(report.id).padStart(4, '0')}
                                                    </span>
                                                    <span className="text-[10px] text-neutral font-bold flex items-center gap-1">
                                                        <ClockIcon className="h-3 w-3" />
                                                        {new Date(report.fecha || '').toLocaleDateString('es-ES', { timeZone: 'UTC' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 bg-base-300 rounded-xl flex items-center justify-center text-neutral shrink-0 border border-base-border">
                                                        <BriefcaseIcon className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-bold text-base-content truncate">{report.empresa_nombre || 'Sin Empresa'}</span>
                                                        <span className="text-[10px] text-neutral flex items-center gap-1 truncate font-medium">
                                                            <MapPinIcon className="h-3 w-3 opacity-50" />
                                                            {report.empresa_planta || 'Sin Planta'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-base-content leading-none mb-1">{report.usuario_nombre || 'Sistema'}</span>
                                                    <span className="px-2 py-0.5 bg-success/10 text-success text-[9px] font-black rounded uppercase w-fit tracking-tighter">Técnico</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="group/prog relative flex items-center gap-2">
                                                    <div className="w-8 h-8">
                                                        <ProgressCircle percentage={percentage} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-neutral">{Math.round(percentage)}%</span>
                                                    {missingFields.length > 0 && (
                                                        <div className="absolute bottom-full left-0 mb-3 w-48 bg-base-300 text-base-content text-[10px] rounded-xl py-3 px-4 pointer-events-none opacity-0 group-hover/prog:opacity-100 transition-all duration-300 z-30 shadow-2xl border border-base-border backdrop-blur">
                                                            <p className="font-black border-b border-base-border pb-1.5 mb-2 uppercase tracking-widest text-primary">Incompleto:</p>
                                                            <ul className="space-y-1">
                                                                {missingFields.map(field => <li key={field} className="flex items-center gap-1.5 font-bold"><div className="h-1 w-1 bg-primary rounded-full" />{field}</li>)}
                                                            </ul>
                                                            <div className="absolute left-4 -bottom-1 w-2 h-2 bg-base-300 border-r border-b border-base-border transform rotate-45"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleStatusToggle(report); }}
                                                    className={`flex items-center gap-1.5 px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest transition-all border outline-none ${report.estado
                                                            ? 'bg-success/10 text-success border-success/30 hover:bg-success hover:text-white'
                                                            : 'bg-warning/10 text-warning border-warning/30 hover:bg-warning hover:text-white'
                                                        }`}
                                                >
                                                    {report.estado ? <CheckCircleIcon className="h-3.5 w-3.5" /> : <ClockIcon className="h-3.5 w-3.5" />}
                                                    {report.estado ? 'Finalizado' : 'En Proceso'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <Dropdown 
                                                    items={[
                                                        { 
                                                            id: 'sign', 
                                                            label: 'Firmar Reporte', 
                                                            icon: <ClipboardCheckIcon />, 
                                                            onClick: () => window.open(`${window.location.origin}/preview/reporte-servicio/${report.id}`, '_blank') 
                                                        },
                                                        { 
                                                            id: 'copy-link', 
                                                            label: 'Copiar enlace para firmar', 
                                                            icon: <CopyIcon />, 
                                                            onClick: () => handleCopyLink(report.id as number) 
                                                        },
                                                        { 
                                                            id: 'edit', 
                                                            label: 'Editar Datos', 
                                                            icon: <EditIcon />, 
                                                            onClick: () => onEditReport(report.id as number) 
                                                        },
                                                        { 
                                                            id: 'view', 
                                                            label: 'Ver PDF', 
                                                            icon: <ViewIcon />, 
                                                            onClick: () => handleViewPDF(report.id as number) 
                                                        },
                                                        { 
                                                            id: 'download', 
                                                            label: 'Descargar PDF', 
                                                            icon: <DownloadIcon />, 
                                                            onClick: () => handleDownloadPDF(report.id as number) 
                                                        },
                                                        { 
                                                            id: 'email', 
                                                            label: 'Enviar por Email', 
                                                            icon: <MailIcon />, 
                                                            onClick: () => handleSendEmail(report.id as number)
                                                        },
                                                        { 
                                                            id: 'delete', 
                                                            label: 'Eliminar Reporte', 
                                                            icon: <TrashIcon />, 
                                                            variant: 'danger',
                                                            onClick: () => handleDelete(report.id as number) 
                                                        }
                                                    ]}
                                                />
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center opacity-20">
                                                <BriefcaseIcon className="h-16 w-16 mb-4" />
                                                <p className="text-sm font-black uppercase tracking-[0.4em] text-neutral">Sin Reportes Registrados</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Mobile View Cards */}
                        <div className="lg:hidden divide-y divide-base-border">
                            {filteredReports.length > 0 ? filteredReports.map((report) => {
                                const { percentage } = calculateCompletion(report);
                                return (
                                    <div 
                                        key={report.id} 
                                        onClick={() => onEditReport(report.id as number)}
                                        className="p-4 space-y-4 hover:bg-primary/5 transition-colors group cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <span className="text-base font-black text-base-content leading-tight truncate max-w-[200px]">
                                                    #{String(report.id).padStart(4, '0')}
                                                </span>
                                                <span className="text-[10px] text-neutral font-bold flex items-center gap-1">
                                                    <ClockIcon className="h-3 w-3" />
                                                    {new Date(report.fecha || '').toLocaleDateString('es-ES', { timeZone: 'UTC' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleStatusToggle(report)}
                                                    className={`px-2 py-1 text-[8px] font-black rounded-full uppercase tracking-widest border ${report.estado ? 'bg-success/10 text-success border-success/30' : 'bg-warning/10 text-warning border-warning/30'}`}
                                                >
                                                    {report.estado ? 'Finalizado' : 'Pendiente'}
                                                </button>
                                                <Dropdown 
                                                    items={[
                                                        { id: 'sign', label: 'Firmar', icon: <ClipboardCheckIcon />, onClick: () => window.open(`${window.location.origin}/preview/reporte-servicio/${report.id}`, '_blank') },
                                                        { id: 'copy-link', label: 'Copiar enlace', icon: <CopyIcon />, onClick: () => handleCopyLink(report.id as number) },
                                                        { id: 'edit', label: 'Editar', icon: <EditIcon />, onClick: () => onEditReport(report.id as number) },
                                                        { id: 'view', label: 'Ver PDF', icon: <ViewIcon />, onClick: () => handleViewPDF(report.id as number) },
                                                        { id: 'download', label: 'Descargar', icon: <DownloadIcon />, onClick: () => handleDownloadPDF(report.id as number) },
                                                        { id: 'delete', label: 'Eliminar', icon: <TrashIcon />, variant: 'danger', onClick: () => handleDelete(report.id as number) }
                                                    ]}
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 bg-base-300/30 p-2 rounded-xl">
                                            <div className="h-10 w-10 bg-base-300 rounded-lg flex items-center justify-center text-neutral shrink-0">
                                                <BriefcaseIcon className="h-5 w-5" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-bold text-base-content truncate">{report.empresa_nombre || 'Sin Empresa'}</span>
                                                <span className="text-[10px] text-neutral flex items-center gap-1 truncate uppercase font-black">
                                                    <MapPinIcon className="h-3 w-3" />
                                                    {report.empresa_planta || 'Sin Planta'}
                                                </span>
                                            </div>
                                            <div className="ml-auto w-10 h-10 shrink-0">
                                                <ProgressCircle percentage={percentage} />
                                            </div>
                                        </div>


                                    </div>
                                );
                            }) : (
                                <div className="py-20 text-center opacity-20">
                                    <BriefcaseIcon className="h-12 w-12 mx-auto mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Sin Reportes</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {pdfViewerUri && (
                <PdfViewerModal
                    pdfDataUri={pdfViewerUri}
                    onClose={() => setPdfViewerUri(null)}
                />
            )}
            {emailModalState.isOpen && (
                <EmailModal
                    isOpen={emailModalState.isOpen}
                    onClose={() => setEmailModalState({ isOpen: false, reportId: null })}
                    reportId={emailModalState.reportId}
                    reportType="service"
                />
            )}
        </div>
    );
};

export default ReportList;
