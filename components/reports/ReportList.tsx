import React, { useState, useEffect } from 'react';
import type { ServiceReport } from '../../types';
import { SearchIcon, PlusIcon, EditIcon, ViewIcon, DownloadIcon } from '../ui/Icons';
import { useSupabase } from '../../contexts/SupabaseContext';
import Spinner from '../ui/Spinner';
import { useTheme } from '../../contexts/ThemeContext';
import { generateServiceReport } from '../../services/pdfGenerator';
import PdfViewerModal from '../ui/PdfViewerModal';
import ProgressCircle from '../ui/ProgressCircle';

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
    if (report.foto_firma) completedFields++;

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


  const filteredReports = reports.filter(report => 
    (report.codigo_reporte || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (report.empresa?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBillingStatusInfo = (report: ServiceReport): { className: string; text: string } => {
    if (report.facturado) {
        return {
            className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            text: 'Facturado'
        };
    }
    if (report.no_facturado) {
        return {
            className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            text: 'No Facturado'
        };
    }
    return {
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        text: 'Borrador'
    };
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Reportes de Servicio</h2>
        <button
          onClick={onCreateReport}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Crear Reporte
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por código o cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
        />
      </div>

      {isLoading && <div className="flex justify-center items-center py-8"><Spinner /><span className="ml-2">Cargando reportes...</span></div>}
      {error && <p className="text-red-500 text-center py-8">{error}</p>}
      
      {!isLoading && !error && (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
          <div className="overflow-y-auto max-h-[60vh] relative">
            <table className="w-full table-auto divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Código</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cliente</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Creado Por</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Facturación</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Completado</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado Reporte</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredReports.length > 0 ? filteredReports.map((report) => {
                  const billingStatus = getBillingStatusInfo(report);
                  const completion = calculateCompletion(report);
                  return (
                  <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{report.codigo_reporte || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 break-words">{report.empresa?.nombre || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 break-words">{report.usuario?.nombres || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${billingStatus.className}`}>
                        {billingStatus.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><ProgressCircle percentage={completion} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={!!report.estado} onChange={() => handleStatusToggle(report)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary-dark dark:peer-focus:ring-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-primary"></div>
                            <span className="ml-3 text-sm font-medium">{report.estado ? 'Finalizado' : 'En Progreso'}</span>
                        </label>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{new Date(report.fecha || '').toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button onClick={() => onEditReport(report.id as number)} className="text-primary hover:text-primary-dark p-1 rounded-full hover:bg-primary/10 transition"><EditIcon className="h-5 w-5"/></button>
                      <button 
                        onClick={() => handleViewPDF(report.id as number)} 
                        disabled={pdfViewingId === report.id}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {pdfViewingId === report.id ? <Spinner /> : <ViewIcon className="h-5 w-5"/>}
                      </button>
                      <button 
                        onClick={() => handleDownloadPDF(report.id as number)} 
                        disabled={pdfLoadingId === report.id}
                        className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {pdfLoadingId === report.id ? <Spinner /> : <DownloadIcon className="h-5 w-5"/>}
                      </button>
                    </td>
                  </tr>
                )
                }) : (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">
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
    </div>
  );
};

export default ReportList;