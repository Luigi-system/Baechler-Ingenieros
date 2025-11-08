
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

const calculateCompletion = (report: ServiceReport): number => {
    const totalFields = 10;
    let completedFields = 0;

    if (report.codigo_reporte) completedFields++;
    if (report.fecha) completedFields++;
    if (report.id_empresa) completedFields++;
    if (report.nombre_planta) completedFields++;
    if (report.serie_maquina) completedFields++;
    if (report.problemas_encontrados) completedFields++;
    if (report.acciones_realizadas) completedFields++;
    if (report.operativo || report.inoperativo || report.en_prueba) completedFields++;
    if (report.nombre_firmante) completedFields++;
    if (report.foto_firma_url) completedFields++;

    return (completedFields / totalFields) * 100;
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
                .select('*, empresa:Empresa(nombre), usuario:Usuarios(nombres)')
                .order('fecha', { ascending: false });

            if (error) throw error;

            const formattedData = data.map((item: any) => ({
                ...item,
                empresa: (Array.isArray(item.empresa) ? item.empresa[0] : item.empresa) || null,
                usuario: (Array.isArray(item.usuario) ? item.usuario[0] : item.usuario) || null,
                nombre_firmante: item.nombre_usuario,
            }));
            setReports(formattedData as ServiceReport[]);
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
        .select('*, empresa:Empresa(*), encargado:Encargado(*), usuario:Usuarios(nombres)')
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
        .select('*, empresa:Empresa(*), encargado:Encargado(*), usuario:Usuarios(nombres)')
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
    (report.codigo_reporte || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (report.empresa?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBillingStatusInfo = (report: ServiceReport): { className: string; text: string } => {
    if (report.facturado) {
        return {
            className: 'bg-success/10 text-success',
            text: 'Facturado'
        };
    }
    if (report.no_facturado) {
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
        <div className="bg-base-200 shadow-lg rounded-xl overflow-hidden">
          <div className="overflow-y-auto max-h-[60vh] relative custom-scrollbar">
            <table className="w-full table-auto divide-y divide-base-border">
              <thead className="bg-base-300 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Código</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Cliente</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Creado Por</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Facturación</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Completado</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Estado Reporte</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Fecha</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-base-200 divide-y divide-base-border">
                {filteredReports.length > 0 ? filteredReports.map((report) => {
                  const billingStatus = getBillingStatusInfo(report);
                  const completion = calculateCompletion(report);
                  return (
                  <tr key={report.id} className="hover:bg-base-300">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-base-content">{report.codigo_reporte || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-neutral break-words">{report.empresa?.nombre || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-neutral break-words">{report.usuario?.nombres || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${billingStatus.className}`}>
                        {billingStatus.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><ProgressCircle percentage={completion} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={!!report.estado} onChange={() => handleStatusToggle(report)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-base-300 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary-focus peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-base-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            <span className="ml-3 text-sm font-medium">{report.estado ? 'Finalizado' : 'En Progreso'}</span>
                        </label>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral">{new Date(report.fecha || '').toLocaleDateString()}</td>
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
