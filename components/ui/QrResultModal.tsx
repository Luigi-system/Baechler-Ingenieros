
import React, { useState, useEffect, useContext } from 'react';
import { pdf } from '@react-pdf/renderer';
import { XIcon, DownloadIcon, EditIcon, ViewIcon, ReportsIcon } from './Icons';
import Spinner from './Spinner';
import PdfViewer from './PdfViewer';
import ServiceReportPdf from '../reports/ServiceReportPdf';
import VisitReportPdf from '../reports/VisitReportPdf';
import { AuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import type { ServiceReport, VisitReport } from '../../types';

interface QrResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportId: number;
    reportType: 'service' | 'visit';
    onEdit: () => void;
}

export const QrResultModal: React.FC<QrResultModalProps> = ({ isOpen, onClose, reportId, reportType, onEdit }) => {
    const { logoUrl } = useTheme();
    const [reportData, setReportData] = useState<any>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && reportId) {
            fetchReport();
        }
        return () => {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        };
    }, [isOpen, reportId]);

    const fetchReport = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const endpoint = reportType === 'service' ? 'reporte-servicio' : 'reporte-visita';
            const res = await fetch(`https://app.lr-system.com/bi/${endpoint}/get/${reportId}`);
            const data = await res.json();
            const report = Array.isArray(data) ? data[0] : (data.data || data);

            if (!report) throw new Error("Reporte no encontrado");

            setReportData(report);
            await generatePdfPreview(report);
        } catch (err: any) {
            console.error("Error fetching report for QR result:", err);
            setError(err.message || "Error al cargar los datos del reporte");
        } finally {
            setIsLoading(false);
        }
    };

    const generatePdfPreview = async (data: any) => {
        try {
            const PdfComponent = reportType === 'service' ? ServiceReportPdf : VisitReportPdf;
            // For service reports, we need to handle specific data formatting
            const enrichedData = { ...data };
            
            const blob = await pdf(
                <PdfComponent 
                    report={enrichedData} 
                    logoUrl={logoUrl || undefined}
                    serial={data.codigo || String(reportId).padStart(4, '0')} 
                />
            ).toBlob();
            
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
        } catch (err) {
            console.error("Error generating PDF in QR Modal:", err);
            setError("No se pudo generar la vista previa del PDF");
        }
    };

    const handleDownload = () => {
        if (!pdfUrl) return;
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `Reporte_${reportType}_${reportId}.pdf`;
        link.click();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-base-200 w-full max-w-5xl h-[90vh] rounded-[2.5rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden relative">
                
                {/* Header Section */}
                <div className="p-6 border-b border-base-border flex justify-between items-center bg-base-300/40">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/20 rounded-2xl text-primary shadow-lg ring-1 ring-primary/20">
                            <ReportsIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-black uppercase tracking-[0.2em] text-sm text-base-content">
                                    Reporte de {reportType === 'service' ? 'Servicio' : 'Visita'}
                                </h3>
                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-lg border border-primary/20">
                                    #{String(reportId).padStart(4, '0')}
                                </span>
                            </div>
                            <p className="text-[10px] text-neutral font-bold uppercase tracking-tight opacity-60">
                                Escaneado y Verificado por Baechler-Ingenieros
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {reportData && (
                            <>
                                <button 
                                    onClick={onEdit}
                                    className="p-3 bg-base-300 hover:bg-primary/20 hover:text-primary text-base-content rounded-2xl transition-all active:scale-95 group border border-base-border"
                                    title="Editar Reporte"
                                >
                                    <EditIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                </button>
                                <button 
                                    onClick={handleDownload}
                                    className="p-3 bg-base-300 hover:bg-success/20 hover:text-success text-base-content rounded-2xl transition-all active:scale-95 group border border-base-border"
                                    title="Descargar PDF"
                                >
                                    <DownloadIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                </button>
                            </>
                        )}
                        <div className="w-[1px] h-8 bg-base-border mx-2"></div>
                        <button 
                            onClick={onClose} 
                            className="p-3 hover:bg-base-300 rounded-2xl transition-all active:scale-90 hover:rotate-90 text-neutral"
                        >
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Content Section (PDF Viewer) */}
                <div className="flex-grow bg-base-300 relative overflow-hidden">
                    {isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                            <Spinner className="h-12 w-12 text-primary" />
                            <p className="text-xs font-black uppercase tracking-widest text-neutral animate-pulse">Generando Documento...</p>
                        </div>
                    ) : error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                            <div className="p-6 bg-error/10 rounded-full mb-4">
                                <XIcon className="h-12 w-12 text-error" />
                            </div>
                            <h4 className="text-lg font-black text-base-content uppercase mb-2">Error de Trazabilidad</h4>
                            <p className="text-sm text-neutral max-w-md">{error}</p>
                            <button 
                                onClick={fetchReport}
                                className="mt-6 px-8 py-3 bg-primary text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20"
                            >
                                Reintentar Sincronización
                            </button>
                        </div>
                    ) : pdfUrl ? (
                        <PdfViewer 
                            file={pdfUrl} 
                            className="bg-base-300" 
                        />
                    ) : null}
                </div>
                
                {/* Footer / Status Bar */}
                <div className="px-6 py-4 bg-base-200 border-t border-base-border flex justify-between items-center">
                    <div className="flex items-center gap-6 opacity-60">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-base-content">Documento Firmado</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <ViewIcon className="h-4 w-4" />
                             <span className="text-[10px] font-black uppercase tracking-wider text-base-content">Solo Lectura Técnico</span>
                        </div>
                    </div>
                    <div className="text-[10px] items-center gap-2 text-neutral hidden md:flex">
                        <span className="font-bold">ID Transacción:</span>
                        <span className="font-mono bg-base-300 px-2 py-0.5 rounded border border-base-border">QR-{reportType.toUpperCase()}-{reportId}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QrResultModal;
