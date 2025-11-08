
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

const calculateCompletion = (report: VisitReport): number => {
    const totalFields = 7;
    let completedFields = 0;
    if (report.fecha) completedFields++;
    if (report.empresa) completedFields++;
    if (report.planta) completedFields++;
    if (report.nombre_encargado) completedFields++;
    if (report.maquinas && report.maquinas.length > 0) completedFields++;
    if (report.sugerencias) completedFields++;
    if (report.firma) completedFields++;
    return (completedFields / totalFields) * 100;
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
                .order('fecha', { ascending: false });

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
    (report.empresa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (report.planta || '').toLowerCase().includes(searchTerm.toLowerCase())
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
          placeholder="Buscar por empresa o planta..."
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Empresa</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Planta</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Completado</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Fecha</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-base-200 divide-y divide-base-border">
                {filteredReports.length > 0 ? filteredReports.map((report) => {
                  const completion = calculateCompletion(report);
                  return (
                  <tr key={report.id} className="hover:bg-base-300">
                    <td className="px-6 py-4 text-sm text-base-content break-words">{report.empresa || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-neutral break-words">{report.planta || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><ProgressCircle percentage={completion} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral">{report.fecha ? new Date(report.fecha + 'T00:00:00Z').toLocaleDateString() : 'N/A'}</td>
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
                    <td colSpan={5} className="text-center py-8 text-neutral">
                        No se encontraron reportes de visita.
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
          reportType="visit"
        />
      )}
    </div>
  );
};

export default VisitReportList;
