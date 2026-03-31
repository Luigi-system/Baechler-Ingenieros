import React, { useState, useEffect, useMemo } from 'react';
import type { VisitReport } from '../../types';
import { 
    SearchIcon, PlusIcon, EditIcon, ViewIcon, 
    DownloadIcon, MailIcon, ClipboardCheckIcon,
    BriefcaseIcon, MapPinIcon, ClockIcon, TrashIcon,
    AlertTriangleIcon, DotsVerticalIcon
} from '../ui/Icons';
import Spinner from '../ui/Spinner';
import { useTheme } from '../../contexts/ThemeContext';
import { pdf } from '@react-pdf/renderer';
import VisitReportPdf from './VisitReportPdf';
import PdfViewerModal from '../ui/PdfViewerModal';
import ProgressCircle from '../ui/ProgressCircle';
import EmailModal from '../ui/EmailModal';
import Dropdown from '../ui/Dropdown';

interface VisitReportListProps {
  onCreateReport: () => void;
  onEditReport: (id: number) => void;
}

const calculateCompletion = (report: VisitReport): { percentage: number; missingFields: string[] } => {
    const fields = [
        { name: 'Identificador', isComplete: !!report.id },
        { name: 'Empresa', isComplete: !!report.empresa_nombre },
        { name: 'Planta', isComplete: !!report.empresa_planta },
        { name: 'Encargado', isComplete: !!report.encargado_nombre },
        { name: 'Máquinas', isComplete: !!report.maquinas && (Array.isArray(report.maquinas) ? report.maquinas.length > 0 : true) },
        { name: 'Observaciones', isComplete: !!report.observaciones },
        { name: 'Firma', isComplete: !!report.foto_firma },
    ];

    const completedCount = fields.filter(f => f.isComplete).length;
    const missingFields = fields.filter(f => !f.isComplete).map(f => f.name);

    return {
        percentage: Math.min((completedCount / fields.length) * 100, 100),
        missingFields,
    };
};

const VisitReportList: React.FC<VisitReportListProps> = ({ onCreateReport, onEditReport }) => {
  const { logoUrl } = useTheme();
  const [reports, setReports] = useState<VisitReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfLoadingId, setPdfLoadingId] = useState<number | null>(null);
  const [pdfViewingId, setPdfViewingId] = useState<number | null>(null);
  const [pdfViewerUri, setPdfViewerUri] = useState<string | null>(null);
  const [emailModalState, setEmailModalState] = useState<{ isOpen: boolean; reportId: number | null }>({ isOpen: false, reportId: null });
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const response = await fetch('https://app.lr-system.com/bi/reporte-visita/getall');
        const data = await response.json();
        setReports(Array.isArray(data) ? data : (data.data || []));
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleStatusToggle = async (report: VisitReport) => {
    if (!report.id) return;
    const newStatus = report.estado === 1 ? 0 : 1;
    try {
        const response = await fetch(`https://app.lr-system.com/bi/reporte-visita/update/${report.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: newStatus })
        });
        if (!response.ok) throw new Error('Error al actualizar');
        setReports(prev => prev.map(r => r.id === report.id ? { ...r, estado: newStatus } : r));
    } catch (err: any) {
        alert(err.message);
    }
  };

  const handleDownloadPDF = async (reportId: number) => {
    setPdfLoadingId(reportId);
    try {
      const response = await fetch(`https://app.lr-system.com/bi/reporte-visita/get/${reportId}`);
      const data = await response.json();
      const report = Array.isArray(data) ? data[0] : (data.data || data);

      const pdfBlob = await pdf(
        <VisitReportPdf report={report as VisitReport} logoUrl={logoUrl || undefined} />
      ).toBlob();
      
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Visita_${String(reportId).padStart(4, '0')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setPdfLoadingId(null);
    }
  };
  
  const handleViewPDF = async (reportId: number) => {
    setPdfViewingId(reportId);
    try {
      const response = await fetch(`https://app.lr-system.com/bi/reporte-visita/get/${reportId}`);
      const data = await response.json();
      const report = Array.isArray(data) ? data[0] : (data.data || data);

      if (report.pdf && report.pdf.startsWith('data:application/pdf')) {
          setPdfViewerUri(report.pdf);
          return;
      }

      const pdfBlob = await pdf(
        <VisitReportPdf report={report as VisitReport} logoUrl={logoUrl || undefined} />
      ).toBlob();
      
      const blobUrl = URL.createObjectURL(pdfBlob);
      setPdfViewerUri(blobUrl);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setPdfViewingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta visita?')) return;
    try {
        const res = await fetch(`https://app.lr-system.com/bi/reporte-visita/delete/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Error al eliminar');
        fetchReports();
    } catch (err: any) {
        alert(err.message);
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

  const filteredReports = useMemo(() => {
    return reports.filter(report => 
        (String(report.id) || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.empresa_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.empresa_planta || '').toLowerCase().includes(searchTerm.toLowerCase())
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
                  placeholder="Buscar visita..."
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
              <span>Nueva Visita</span>
          </button>
      </div>

      {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10">
              <Spinner className="h-10 w-10 text-primary mb-2" />
              <p className="text-[10px] text-neutral font-black uppercase tracking-widest animate-pulse">Cargando Visitas...</p>
          </div>
      ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-error p-8 border border-error/20 rounded-2xl bg-error/5">
              <AlertTriangleIcon className="h-10 w-10 mb-4 opacity-50" />
              <p className="font-bold text-center text-sm">{error}</p>
              <button onClick={fetchReports} className="mt-4 px-6 py-2 bg-error text-white rounded-xl uppercase text-[10px] font-black tracking-widest">Reintentar</button>
          </div>
      ) : (
          <div className="bg-base-200 border border-base-border shadow-sm rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0">
              <div className="overflow-auto flex-1 custom-scrollbar">
                  {/* Desktop View */}
                  <table className="hidden lg:table w-full text-left border-collapse min-w-[1000px]">
                      <thead className="bg-base-300 border-b border-base-border sticky top-0 z-20">
                          <tr>
                              <th className="px-6 py-4 text-[10px] font-black text-neutral uppercase tracking-widest">Código / Ref</th>
                              <th className="px-6 py-4 text-[10px] font-black text-neutral uppercase tracking-widest">Empresa / Planta</th>
                              <th className="px-6 py-4 text-[10px] font-black text-neutral uppercase tracking-widest">Progreso</th>
                              <th className="px-6 py-4 text-[10px] font-black text-neutral uppercase tracking-widest">Estado</th>
                              <th className="px-6 py-4 text-[10px] font-black text-neutral uppercase tracking-widest">Fecha</th>
                              <th className="px-6 py-4 text-[10px] font-black text-neutral uppercase tracking-widest text-right">Acciones</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-base-border">
                          {filteredReports.map((report) => {
                              const { percentage, missingFields } = calculateCompletion(report);
                              return (
                                  <tr key={report.id} className="hover:bg-primary/5 transition-colors group">
                                      <td className="px-6 py-4">
                                          <span className="text-sm font-black text-base-content leading-tight group-hover:text-primary transition-colors">
                                              #{String(report.id).padStart(4, '0')}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-3">
                                              <div className="h-9 w-9 bg-base-300 rounded-xl flex items-center justify-center text-neutral shrink-0 border border-base-border">
                                                  <BriefcaseIcon className="h-4 w-4" />
                                              </div>
                                              <div className="flex flex-col min-w-0">
                                                  <span className="text-sm font-bold text-base-content truncate">{report.empresa_nombre || 'S/E'}</span>
                                                  <span className="text-[10px] text-neutral flex items-center gap-1 truncate font-medium uppercase">
                                                      <MapPinIcon className="h-3 w-3 opacity-50" />
                                                      {report.empresa_planta || 'S/P'}
                                                  </span>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4">
                                          <div className="group/prog relative flex items-center gap-2">
                                              <div className="w-8 h-8"><ProgressCircle percentage={percentage} /></div>
                                              <span className="text-[10px] font-black text-neutral">{Math.round(percentage)}%</span>
                                              {missingFields.length > 0 && (
                                                  <div className="absolute bottom-full left-0 mb-3 w-48 bg-base-300 text-base-content text-[10px] rounded-xl py-3 px-4 pointer-events-none opacity-0 group-hover/prog:opacity-100 transition-all duration-300 z-30 shadow-2xl border border-base-border backdrop-blur">
                                                      <p className="font-black border-b border-base-border pb-1.5 mb-2 uppercase tracking-widest text-primary">Incompleto:</p>
                                                      <ul className="space-y-1">
                                                          {missingFields.map(field => <li key={field} className="flex items-center gap-1.5 font-bold"><div className="h-1 w-1 bg-primary rounded-full" />{field}</li>)}
                                                      </ul>
                                                      <div className="absolute left-4 -bottom-1 w-2 h-2 bg-base-300 transform rotate-45 border-r border-b border-base-border"></div>
                                                  </div>
                                              )}
                                          </div>
                                      </td>
                                      <td className="px-6 py-4">
                                          <button
                                              onClick={() => handleStatusToggle(report)}
                                              className={`flex items-center gap-1.5 px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest transition-all border outline-none ${report.estado === 1
                                                      ? 'bg-success/10 text-success border-success/30 hover:bg-success hover:text-white'
                                                      : 'bg-warning/10 text-warning border-warning/30 hover:bg-warning hover:text-white'
                                              }`}
                                          >
                                              {report.estado === 1 ? <ClipboardCheckIcon className="h-3.5 w-3.5" /> : <ClockIcon className="h-3.5 w-3.5" />}
                                              {report.estado === 1 ? 'Finalizado' : 'En Proceso'}
                                          </button>
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className="text-[10px] text-neutral font-bold flex items-center gap-1">
                                              <ClockIcon className="h-3 w-3" />
                                              {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <Dropdown 
                                            items={[
                                                { id: 'sign', label: 'Firmar Reporte', icon: <ClipboardCheckIcon />, onClick: () => window.open(`${window.location.origin}/preview/reporte-visita/${report.id}`, '_blank') },
                                                { id: 'edit', label: 'Editar Datos', icon: <EditIcon />, onClick: () => onEditReport(report.id as number) },
                                                { id: 'view', label: 'Ver PDF', icon: <ViewIcon />, onClick: () => handleViewPDF(report.id as number) },
                                                { id: 'download', label: 'Descargar PDF', icon: <DownloadIcon />, onClick: () => handleDownloadPDF(report.id as number) },
                                                { id: 'email', label: 'Enviar Email', icon: <MailIcon />, onClick: () => handleSendEmail(report.id as number) },
                                                { id: 'delete', label: 'Eliminar', icon: <TrashIcon />, variant: 'danger', onClick: () => handleDelete(report.id as number) }
                                            ]}
                                          />
                                      </td>
                                  </tr>
                              );
                          })}
                          {filteredReports.length === 0 && (
                              <tr><td colSpan={6} className="py-20 text-center opacity-30 text-xs font-black uppercase tracking-widest">Sin Visitas</td></tr>
                          )}
                      </tbody>
                  </table>

                  {/* Mobile View */}
                  <div className="lg:hidden divide-y divide-base-border">
                      {filteredReports.map((report) => {
                          const { percentage } = calculateCompletion(report);
                          return (
                              <div key={report.id} className="p-4 space-y-4 hover:bg-primary/5 transition-colors group">
                                  <div className="flex justify-between items-start">
                                      <div className="flex flex-col">
                                          <span className="text-base font-black text-base-content leading-tight truncate max-w-[200px]">
                                              #{String(report.id).padStart(4, '0')}
                                          </span>
                                          <span className="text-[10px] text-neutral font-bold flex items-center gap-1">
                                              <ClockIcon className="h-3 w-3" />
                                              {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}
                                          </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button onClick={() => handleStatusToggle(report)} className={`px-2 py-1 text-[8px] font-black rounded-full uppercase border ${report.estado === 1 ? 'bg-success/10 text-success border-success/30' : 'bg-warning/10 text-warning border-warning/30'}`}>
                                            {report.estado === 1 ? 'Finalizado' : 'Pendiente'}
                                        </button>
                                        <Dropdown 
                                            items={[
                                                { id: 'sign', label: 'Firmar', icon: <ClipboardCheckIcon />, onClick: () => window.open(`${window.location.origin}/preview/reporte-visita/${report.id}`, '_blank') },
                                                { id: 'edit', label: 'Editar', icon: <EditIcon />, onClick: () => onEditReport(report.id as number) },
                                                { id: 'view', label: 'Ver PDF', icon: <ViewIcon />, onClick: () => handleViewPDF(report.id as number) },
                                                { id: 'download', label: 'Descargar', icon: <DownloadIcon />, onClick: () => handleDownloadPDF(report.id as number) },
                                                { id: 'delete', label: 'Eliminar', icon: <TrashIcon />, variant: 'danger', onClick: () => handleDelete(report.id as number) }
                                            ]}
                                        />
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-3 bg-base-300/30 p-2 rounded-xl">
                                      <div className="h-10 w-10 bg-base-300 rounded-lg flex items-center justify-center text-neutral shrink-0"><BriefcaseIcon className="h-5 w-5" /></div>
                                      <div className="flex flex-col min-w-0">
                                          <span className="text-sm font-bold text-base-content truncate">{report.empresa_nombre || 'S/E'}</span>
                                          <span className="text-[10px] text-neutral font-black uppercase truncate">{report.empresa_planta || 'S/P'}</span>
                                      </div>
                                      <div className="ml-auto w-10 h-10 shrink-0"><ProgressCircle percentage={percentage} /></div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      )}

      {pdfViewerUri && <PdfViewerModal pdfDataUri={pdfViewerUri} onClose={() => setPdfViewerUri(null)} />}
      {emailModalState.isOpen && <EmailModal isOpen={emailModalState.isOpen} onClose={() => setEmailModalState({ isOpen: false, reportId: null })} reportId={emailModalState.reportId} reportType="visit" />}
    </div>
  );
};

export default VisitReportList;
