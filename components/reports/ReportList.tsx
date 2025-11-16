
import React, { useState, useEffect } from 'react';
import type { ServiceReport } from '../../types';
import { SearchIcon, PlusIcon, EditIcon, ViewIcon, DownloadIcon, MailIcon } from '../ui/Icons';
import { useSupabase } from '../../contexts/SupabaseContext';
import Spinner from '../ui/Spinner';
import { useTheme } from '../../contexts/ThemeContext';
import { generateServiceReport } from '../../services/pdfGenerator';
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
        { name: 'Código', isComplete: !!report.codigo },
        { name: 'Fecha', isComplete: !!report.fecha },
        { name: 'Empresa', isComplete: !!report.empresa_nombre },
        { name: 'Planta', isComplete: !!report.enpresa_planta },
        { name: 'N° Serie de Máquina', isComplete: !!report.maquina_seria },
        { name: 'Problemas Encontrados', isComplete: !!report.problemas_encontraados },
        { name: 'Acciones Realizadas', isComplete: !!report.acciones_realizadas },
        { name: 'Estado de Máquina', isComplete: report.operatio !== undefined && report.operatio !== null },
        { name: 'Nombre del Encargado', isComplete: !!report.encargado_nombre },
        { name: 'Firma de Conformidad', isComplete: !!report.foto_firma },
        { name: 'Reporte Finalizado', isComplete: !!report.estado },
    ];

    const completedCount = fields.filter(f => f.isComplete).length;
    const missingFields = fields.filter(f => !f.isComplete).map(f => f.name);

    return {
        percentage: (completedCount / fields.length) * 100,
        missingFields,
    };
};

const ReportList: React.FC<ReportListProps> = ({ reportType, onCreateReport, onEditReport }) => {
  const { supabase } = useSupabase();
  const { logoUrl } = useTheme();
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfLoadingId, setPdfLoadingId] = useState<number | null>(null);
  const [pdfViewingId, setPdfViewingId] = useState<number | null>(null);
  const [pdfViewerUri, setPdfViewerUri] = useState<string | null>(null);
  const [emailModalState, setEmailModalState] = useState<{ isOpen: boolean; reportId: number | null }>({ isOpen: false, reportId: null });
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
        if (!supabase || reportType !== 'service') {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase
                .from('Reporte_Servicio')
                .select('*')
                .order('fecha', { ascending: false });

            if (error) throw error;
            
            setReports(data as ServiceReport[]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    fetchReports();
  }, [supabase, reportType]);
  
  const handleStatusToggle = async (report: ServiceReport) => {
    if (!supabase || !report.id) return;

    const newStatus = !report.estado;

    // Optimistic UI update
    setReports(prevReports => 
        prevReports.map(r => r.id === report.id ? { ...r, estado: newStatus } : r)
    );

    const { error } = await supabase
        .from('Reporte_Servicio')
        .update({ estado: newStatus })
        .eq('id', report.id);

    if (error) {
        // Revert on error
        setReports(prevReports => 
            prevReports.map(r => r.id === report.id ? { ...r, estado: !newStatus } : r)
        );
        alert(`Error al actualizar estado: ${error.message}`);
    }
  };


  const handleDownloadPDF = async (reportId: number) => {
    if (!supabase) {
      alert("La conexión con la base de datos no está disponible.");
      return;
    }
    setPdfLoadingId(reportId);
    try {
      const { data, error } = await supabase
        .from('Reporte_Servicio')
        .select('*')
        .eq('id', reportId)
        .single();
      
      if (error) throw error;

      await generateServiceReport(data as ServiceReport, logoUrl, 'save');

    } catch (err: any) {
      console.error("Error generating PDF:", err);
      alert(`No se pudo generar el PDF: ${err.message}`);
    } finally {
      setPdfLoadingId(null);
    }
  };
  
  const handleViewPDF = async (reportId: number) => {
    if (!supabase) {
      alert("La conexión con la base de datos no está disponible.");
      return;
    }
    setPdfViewingId(reportId);
    try {
      const { data, error } = await supabase
        .from('Reporte_Servicio')
        .select('*')
        .eq('id', reportId)
        .single();
      
      if (error) throw error;

      const pdfDataUri = await generateServiceReport(data as ServiceReport, logoUrl, 'datauristring');
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
    (report.empresa_nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBillingStatusInfo = (report: ServiceReport): { className: string; text: string } => {
    if (report.facturado === true) {
        return {
            className: 'bg-success/10 text-success',
            text: 'Facturado'
        };
    }
    if (report.facturado === false) {
        return {
            className: 'bg-warning/10 text-warning',
            text: 'No Facturado'
        };
    }
    return {
        className: 'bg-base-300 text-neutral',
        text: 'Borrador'
    };
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-base-content">Reportes de Servicio</h2>
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
          placeholder="Buscar por código o cliente..."
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
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Cliente</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Creado Por</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Facturación</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Completado</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Estado</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Fecha</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-base-border">
                        {filteredReports.length > 0 ? filteredReports.map((report) => {
                        const billingStatus = getBillingStatusInfo(report);
                        const { percentage, missingFields } = calculateCompletion(report);
                        return (
                        <tr key={report.id} className="hover:bg-base-300/50 even:bg-base-300/20 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-base-content">{report.codigo || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-neutral break-words">{report.empresa_nombre || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-neutral break-words">{report.usuario_nombre || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${billingStatus.className}`}>
                                {billingStatus.text}
                            </span>
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
                            <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                    onClick={() => handleStatusToggle(report)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-200 ${
                                        report.estado
                                        ? 'bg-success text-white shadow-inner border border-success/80'
                                        : 'bg-base-100 text-neutral border border-base-border shadow-sm hover:bg-base-300'
                                    }`}
                                >
                                    {report.estado ? 'Finalizado' : 'En Progreso'}
                                </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral">{new Date(report.fecha || '').toLocaleDateString('es-ES', { timeZone: 'UTC' })}</td>
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
                            <td colSpan={8} className="text-center py-8 text-neutral">
                                No se encontraron reportes.
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
                    const billingStatus = getBillingStatusInfo(report);
                    const { percentage, missingFields } = calculateCompletion(report);
                    return (
                    <div key={report.id} className="bg-base-200 rounded-lg shadow-md p-4 space-y-3">
                        <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold text-base-content">{report.codigo || 'N/A'}</p>
                            <p className="text-sm text-neutral">{report.empresa_nombre || 'N/A'}</p>
                        </div>
                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${billingStatus.className}`}>
                            {billingStatus.text}
                        </span>
                        </div>
                        
                        <div className="text-sm text-neutral space-y-1">
                            <p><strong>Creado por:</strong> {report.usuario_nombre || 'N/A'}</p>
                            <p><strong>Fecha:</strong> {new Date(report.fecha || '').toLocaleDateString('es-ES', { timeZone: 'UTC' })}</p>
                        </div>

                        <div className="flex justify-between items-center gap-4">
                            <div className="flex-1">
                                <label className="text-xs text-neutral">Completado</label>
                                <div className="group relative inline-flex mt-1">
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
                            </div>
                            <div className="flex-1 text-right">
                                <button
                                    onClick={() => handleStatusToggle(report)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-200 ${
                                        report.estado
                                        ? 'bg-success text-white shadow-inner border border-success/80'
                                        : 'bg-base-100 text-neutral border border-base-border shadow-sm hover:bg-base-300'
                                    }`}
                                >
                                    {report.estado ? 'Finalizado' : 'En Progreso'}
                                </button>
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
                    )
                }) : (
                    <div className="text-center py-8 text-neutral bg-base-200 rounded-lg">
                        No se encontraron reportes.
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
          reportType="service"
        />
      )}
    </div>
  );
};

export default ReportList;
