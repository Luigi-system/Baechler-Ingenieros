
import React, { useState, useEffect } from 'react';
import type { VisitReport } from '../../types';
import { SearchIcon, PlusIcon, EditIcon, ViewIcon, DownloadIcon, MailIcon } from '../ui/Icons';
import { useSupabase } from '../../contexts/SupabaseContext';
import Spinner from '../ui/Spinner';
import { useTheme } from '../../contexts/ThemeContext';
import { generateVisitReport } from '../../services/pdfGenerator';
import PdfViewerModal from '../ui/PdfViewerModal';
import ProgressCircle from '../ui/ProgressCircle';
import EmailModal from '../ui/EmailModal';

interface VisitReportListProps {
  onCreateReport: () => void;
  onEditReport: (id: number) => void;
}

const calculateCompletion = (report: VisitReport): { percentage: number; missingFields: string[] } => {
    const fields = [
        { name: 'Código', isComplete: !!report.codigo },
        { name: 'Empresa', isComplete: !!report.empresa_nombre },
        { name: 'Planta', isComplete: !!report.empresa_planta },
        { name: 'Encargado', isComplete: !!report.encargado_nombre },
        { name: 'Máquinas Atendidas', isComplete: !!(report.maquinas && report.maquinas.length > 0) },
        { name: 'Observaciones', isComplete: !!report.observaciones || !!report.fotos_observaciones },
        { name: 'Sugerencias', isComplete: !!report.sugerencias || !!report.fotos_sugerencias },
        { name: 'Firma de Conformidad', isComplete: !!report.foto_firma },
        { name: 'Voltaje Estable', isComplete: report.voltaje_establecido != null },
        { name: 'Línea a Tierra', isComplete: report.linea_a_tierra != null },
        { name: 'Presurización de Cabezal', isComplete: report.presurizacion_de_cabezal != null },
        { name: 'Transformador', isComplete: report.transformador_de_aislamiento != null },
        { name: 'Limpieza de Cabezal', isComplete: report.limpieza_cabezal != null },
        { name: 'Reporte Finalizado', isComplete: report.estado === 'Finalizado' },
    ];

    const completedCount = fields.filter(f => f.isComplete).length;
    const missingFields = fields.filter(f => !f.isComplete).map(f => f.name);

    return {
        percentage: Math.min((completedCount / fields.length) * 100, 100),
        missingFields,
    };
};

const VisitReportList: React.FC<VisitReportListProps> = ({ onCreateReport, onEditReport }) => {
  const { supabase } = useSupabase();
  const { logoUrl } = useTheme();
  const [reports, setReports] = useState<VisitReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfLoadingId, setPdfLoadingId] = useState<number | null>(null);
  const [pdfViewingId, setPdfViewingId] = useState<number | null>(null);
  const [pdfViewerUri, setPdfViewerUri] = useState<string | null>(null);
  const [emailModalState, setEmailModalState] = useState<{ isOpen: boolean; reportId: number | null }>({ isOpen: false, reportId: null });
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
        if (!supabase) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase
                .from('Reporte_Visita')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReports(data as VisitReport[]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    fetchReports();
  }, [supabase]);

  const handleStatusToggle = async (report: VisitReport) => {
    if (!supabase || !report.id) return;

    const newStatus = report.estado === 'Finalizado' ? 'En Progreso' : 'Finalizado';

    // Optimistic UI update
    setReports(prevReports => 
        prevReports.map(r => r.id === report.id ? { ...r, estado: newStatus } : r)
    );

    const { error } = await supabase
        .from('Reporte_Visita')
        .update({ estado: newStatus })
        .eq('id', report.id);

    if (error) {
        // Revert on error
        const oldStatus = newStatus === 'Finalizado' ? 'En Progreso' : 'Finalizado';
        setReports(prevReports => 
            prevReports.map(r => r.id === report.id ? { ...r, estado: oldStatus } : r)
        );
        alert(`Error al actualizar estado: ${error.message}`);
    }
  };

  const handleDownloadPDF = async (reportId: number) => {
    if (!supabase) return;
    setPdfLoadingId(reportId);
    try {
      const { data, error } = await supabase
        .from('Reporte_Visita')
        .select('*')
        .eq('id', reportId)
        .single();
      
      if (error) throw error;
      await generateVisitReport(data as VisitReport, logoUrl, 'save');
    } catch (err: any) {
      console.error("Error generating PDF:", err);
      alert(`No se pudo generar el PDF: ${err.message}`);
    } finally {
      setPdfLoadingId(null);
    }
  };
  
  const handleViewPDF = async (reportId: number) => {
    if (!supabase) return;
    setPdfViewingId(reportId);
    try {
      const { data, error } = await supabase
        .from('Reporte_Visita')
        .select('*')
        .eq('id', reportId)
        .single();
      
      if (error) throw error;
      const pdfDataUri = await generateVisitReport(data as VisitReport, logoUrl, 'datauristring');
      if (pdfDataUri) {
        setPdfViewerUri(pdfDataUri as string);
      }
    } catch (err: any) {
      console.error("Error generating PDF for viewing:", err);
      alert(`No se pudo generar el PDF: ${err.message}`);
    } finally {
      setPdfViewingId(null);
    }
  };
  
  const handleSendEmail = (reportId: number) => {
    setEmailModalState({ isOpen: true, reportId });
  };

  const filteredReports = reports.filter(report => 
    (report.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (report.empresa_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (report.empresa_planta || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-base-content">Reportes de Visita</h2>
        <button
          onClick={onCreateReport}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-focus focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Crear Reporte
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-neutral" />
        </div>
        <input
          type="text"
          placeholder="Buscar por código, empresa o planta..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 sm:text-sm input-style"
        />
      </div>

      {isLoading && <div className="flex justify-center items-center py-8"><Spinner /><span className="ml-2">Cargando reportes...</span></div>}
      {error && <p className="text-error text-center py-8">{error}</p>}
      
      {!isLoading && !error && (
        <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-base-200 shadow-lg rounded-xl overflow-hidden">
                <div className="overflow-y-auto max-h-[60vh] relative custom-scrollbar">
                    <table className="w-full table-auto">
                    <thead className="bg-base-300 sticky top-0 z-10">
                        <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Código</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Empresa</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Planta</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Estado</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Completado</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Fecha Creación</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-base-border">
                        {filteredReports.length > 0 ? filteredReports.map((report) => {
                        const { percentage, missingFields } = calculateCompletion(report);
                        return (
                        <tr key={report.id} className="hover:bg-base-300/50 even:bg-base-300/20 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-base-content break-words">{report.codigo || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm font-medium text-base-content break-words">{report.empresa_nombre || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-neutral break-words">{report.empresa_planta || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                    onClick={() => handleStatusToggle(report)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-200 ${
                                        report.estado === 'Finalizado'
                                        ? 'bg-success text-white shadow-inner border border-success/80'
                                        : 'bg-base-100 text-neutral border border-base-border shadow-sm hover:bg-base-300'
                                    }`}
                                >
                                    {report.estado || 'En Progreso'}
                                </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="group relative w-8 h-8">
                                    <ProgressCircle percentage={percentage} />
                                    {missingFields.length > 0 && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-base-300 text-base-content text-xs rounded py-2 px-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 shadow-lg">
                                            <p className="font-bold border-b border-base-border pb-1 mb-1">Falta completar:</p>
                                            <ul className="list-disc list-inside text-left">
                                                {missingFields.map(field => <li key={field}>{field}</li>)}
                                            </ul>
                                            <div className="absolute left-1/2 -translate-x-1/2 bottom-[-4px] w-2 h-2 bg-base-300 transform rotate-45"></div>
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral">{report.created_at ? new Date(report.created_at).toLocaleDateString('es-ES') : 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button onClick={() => onEditReport(report.id as number)} className="text-primary hover:text-primary-focus p-1 rounded-full hover:bg-primary/10 transition"><EditIcon className="h-5 w-5"/></button>
                            <button 
                                onClick={() => handleViewPDF(report.id as number)} 
                                disabled={pdfViewingId === report.id}
                                className="text-info hover:text-info/80 p-1 rounded-full hover:bg-info/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {pdfViewingId === report.id ? <Spinner /> : <ViewIcon className="h-5 w-5"/>}
                            </button>
                            <button 
                                onClick={() => handleDownloadPDF(report.id as number)} 
                                disabled={pdfLoadingId === report.id}
                                className="text-success hover:text-success/80 p-1 rounded-full hover:bg-success/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {pdfLoadingId === report.id ? <Spinner /> : <DownloadIcon className="h-5 w-5"/>}
                            </button>
                            <button 
                                onClick={() => handleSendEmail(report.id as number)}
                                className="text-accent hover:text-accent/80 p-1 rounded-full hover:bg-accent/10 transition"
                                title="Enviar por Email"
                            >
                                <MailIcon className="h-5 w-5"/>
                            </button>
                            </td>
                        </tr>
                        )
                        }) : (
                        <tr>
                            <td colSpan={7} className="text-center py-8 text-neutral">
                                No se encontraron reportes de visita.
                            </td>
                        </tr>
                        )}
                    </tbody>
                    </table>
                </div>
            </div>
            
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {filteredReports.length > 0 ? filteredReports.map((report) => {
                    const { percentage, missingFields } = calculateCompletion(report);
                    return (
                        <div key={report.id} className="bg-base-200 rounded-lg shadow-md p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-base-content">{report.codigo || 'N/A'}</p>
                                    <p className="text-sm text-neutral">{report.empresa_nombre || 'N/A'}</p>
                                    <p className="text-xs text-neutral">{report.empresa_planta || 'N/A'}</p>
                                </div>
                                <button
                                    onClick={() => handleStatusToggle(report)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-200 whitespace-nowrap ${
                                        report.estado === 'Finalizado'
                                        ? 'bg-success text-white shadow-inner border border-success/80'
                                        : 'bg-base-100 text-neutral border border-base-border shadow-sm hover:bg-base-300'
                                    }`}
                                >
                                    {report.estado || 'En Progreso'}
                                </button>
                            </div>
                             <div className="flex justify-between items-center gap-4">
                                <div>
                                    <p className="text-sm text-neutral"><strong>Fecha:</strong> {report.created_at ? new Date(report.created_at).toLocaleDateString('es-ES') : 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                    <label className="text-xs text-neutral">Completado</label>
                                    <div className="group relative inline-flex mt-1">
                                        <ProgressCircle percentage={percentage} />
                                        {missingFields.length > 0 && (
                                            <div className="absolute bottom-full right-0 mb-2 w-48 bg-base-300 text-base-content text-xs rounded py-2 px-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 shadow-lg">
                                                <p className="font-bold border-b border-base-border pb-1 mb-1">Falta completar:</p>
                                                <ul className="list-disc list-inside text-left">
                                                    {missingFields.map(field => <li key={field}>{field}</li>)}
                                                </ul>
                                                <div className="absolute right-3 bottom-[-4px] w-2 h-2 bg-base-300 transform rotate-45"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="border-t border-base-border pt-3 flex justify-end space-x-2">
                                <button onClick={() => onEditReport(report.id as number)} className="text-primary hover:text-primary-focus p-2 rounded-full hover:bg-primary/10 transition"><EditIcon className="h-5 w-5"/></button>
                                <button onClick={() => handleViewPDF(report.id as number)} disabled={pdfViewingId === report.id} className="text-info hover:text-info/80 p-2 rounded-full hover:bg-info/10 transition disabled:opacity-50">
                                    {pdfViewingId === report.id ? <Spinner /> : <ViewIcon className="h-5 w-5"/>}
                                </button>
                                <button onClick={() => handleDownloadPDF(report.id as number)} disabled={pdfLoadingId === report.id} className="text-success hover:text-success/80 p-2 rounded-full hover:bg-success/10 transition disabled:opacity-50">
                                    {pdfLoadingId === report.id ? <Spinner /> : <DownloadIcon className="h-5 w-5"/>}
                                </button>
                                <button onClick={() => handleSendEmail(report.id as number)} className="text-accent hover:text-accent/80 p-2 rounded-full hover:bg-accent/10 transition">
                                    <MailIcon className="h-5 w-5"/>
                                </button>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-8 text-neutral bg-base-200 rounded-lg">
                        No se encontraron reportes de visita.
                    </div>
                )}
            </div>
        </>
      )}
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
          reportType="visit"
        />
      )}
    </div>
  );
};

export default VisitReportList;
