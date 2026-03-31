import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pdf, PDFViewer } from '@react-pdf/renderer';
import VisitReportPdf from './VisitReportPdf';
import ServiceReportPdf from './ServiceReportPdf';
import SignaturePad from '../ui/SignaturePad';
import Spinner from '../ui/Spinner';
import { 
    UserIcon, IdCardIcon, PhoneIcon, CheckCircleIcon, 
    EditIcon, ViewIcon, SearchIcon, SparklesIcon, PlusIcon
} from '../ui/Icons';
import type { VisitReport, ServiceReport, Supervisor } from '../../types';

interface ReportPreviewPageProps {
    type: 'visit' | 'service';
}

type PageState = 'LOADING' | 'DNI_INPUT' | 'REGISTER' | 'PREVIEW' | 'SIGNING' | 'SUCCESS';

const ReportPreviewPage: React.FC<ReportPreviewPageProps> = ({ type }) => {
    const { id } = useParams<{ id: string }>();
    const [pageState, setPageState] = useState<PageState>('LOADING');
    const [report, setReport] = useState<any>(null);
    const [dni, setDni] = useState('');
    const [rememberDni, setRememberDni] = useState(false);
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [identifiedSupervisor, setIdentifiedSupervisor] = useState<Supervisor | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSigned, setIsSigned] = useState(false);
    
    // Registration form state
    const [regData, setRegData] = useState({
        nombres: '',
        apellidos: '',
        celular: ''
    });

    // Fetch initial report and supervisors
    useEffect(() => {
        const savedDni = localStorage.getItem('baechler_dni');
        if (savedDni) {
            setDni(savedDni);
            setRememberDni(true);
        }

        const fetchData = async () => {
            try {
                const ep = type === 'visit' ? 'reporte-visita' : 'reporte-servicio';
                const [repRes, supRes] = await Promise.all([
                    fetch(`https://app.lr-system.com/bi/${ep}/get/${id}`).then(r => r.json()),
                    fetch('https://app.lr-system.com/bi/encargado/getall').then(r => r.json())
                ]);

                const reportData = Array.isArray(repRes) ? repRes[0] : (repRes.data || repRes);
                const supervisorsData = Array.isArray(supRes) ? supRes : (supRes.data || []);

                if (!reportData) throw new Error('Reporte no encontrado');

                setReport(reportData);
                setSupervisors(supervisorsData);
                setPageState('DNI_INPUT');
            } catch (err) {
                console.error(err);
                alert('Error al cargar la información.');
            }
        };
        fetchData();
    }, [id, type]);

    const handleIdentify = async () => {
        if (!dni.trim()) return;
        setIsProcessing(true);
        
        try {
            const supervisor = supervisors.find(s => s.dni === dni.trim());
            
            if (supervisor) {
                if (rememberDni) {
                    localStorage.setItem('baechler_dni', dni.trim());
                } else {
                    localStorage.removeItem('baechler_dni');
                }
                setIdentifiedSupervisor(supervisor);
                await updateReportWithSupervisor(supervisor);
                setPageState('PREVIEW');
            } else {
                setPageState('REGISTER');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        try {
            const newSupervisor = {
                nombres: regData.nombres,
                apellidos: regData.apellidos,
                dni: dni,
                celular: regData.celular,
                nombreEmpresa: report.empresa_nombre || '',
                nombrePlanta: report.empresa_planta || ''
            };

            const res = await fetch('https://app.lr-system.com/bi/encargado/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSupervisor)
            });

            if (!res.ok) throw new Error('No se pudo registrar el encargado');
            const createdSup = await res.json();
            
            if (rememberDni) {
                localStorage.setItem('baechler_dni', dni.trim());
            }
            
            setIdentifiedSupervisor(createdSup);
            await updateReportWithSupervisor(createdSup);
            setPageState('PREVIEW');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const updateReportWithSupervisor = async (sup: Supervisor) => {
        const ep = type === 'visit' ? 'reporte-visita' : 'reporte-servicio';
        const payload = {
            ...report,
            encargado_nombre: `${sup.nombres} ${sup.apellidos || ''}`.trim(),
            encargado_cel: sup.celular?.toString()
        };

        const res = await fetch(`https://app.lr-system.com/bi/${ep}/update/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            setReport(payload);
        }
    };

    const handleSaveSignature = async (signatureB64: string) => {
        setIsProcessing(true);
        try {
            const stripPrefix = (str: string) => str.includes('base64,') ? str.split('base64,')[1] : str;
            const ep = type === 'visit' ? 'reporte-visita' : 'reporte-servicio';
            
            // For the backend we now send the full base64 string with prefix
            const cleanSignature = signatureB64;
            
            // Create the updated PDF
            const pdfBlob = await pdf(
                type === 'visit' 
                ? <VisitReportPdf report={{ ...report, id: Number(id) }} />
                : <ServiceReportPdf report={{ ...report, id: Number(id) }} serial={report.codigo || String(id).padStart(4, '0')} />
            ).toBlob();

            const pdfBase64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string); // Keep full Data URL (base64:pdf...)
                reader.readAsDataURL(pdfBlob);
            });

            const finalPayload = {
                ...report,
                foto_firma: cleanSignature,
                pdf: pdfBase64,
                estado: 1
            };

            const response = await fetch(`https://app.lr-system.com/bi/${ep}/update/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalPayload)
            });

            if (response.ok) {
                setReport(finalPayload);
                setIsSigned(true);
                setPageState('PREVIEW');
            } else {
                throw new Error('Error al guardar la firma.');
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const renderContents = () => {
        switch (pageState) {
            case 'LOADING':
                return (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <Spinner className="h-10 w-10 text-primary" />
                        <p className="text-base-content/70">Cargando reporte...</p>
                    </div>
                );

            case 'DNI_INPUT':
                return (
                    <div className="max-w-md mx-auto bg-base-200 p-8 rounded-3xl shadow-2xl space-y-6 border border-base-border animate-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-2">
                            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <SparklesIcon className="h-10 w-10 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold">Identificación</h2>
                            <p className="text-base-content/60 text-sm">Por favor, ingrese su DNI para acceder al reporte y firmarlo.</p>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="relative">
                                <IdCardIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-base-content/30" />
                                <input 
                                    type="text" 
                                    placeholder="Ingrese su DNI"
                                    value={dni}
                                    onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                    className="w-full pl-12 pr-4 py-4 input-style text-lg tracking-widest font-mono"
                                />
                            </div>
                            <div className="flex items-center gap-2 px-1">
                                <input 
                                    id="rememberDni"
                                    type="checkbox" 
                                    checked={rememberDni}
                                    onChange={(e) => setRememberDni(e.target.checked)}
                                    className="checkbox checkbox-primary checkbox-sm border-base-content/20"
                                />
                                <label htmlFor="rememberDni" className="text-sm cursor-pointer select-none opacity-70 hover:opacity-100 transition-opacity">Recordar mi DNI</label>
                            </div>
                            
                            <button 
                                onClick={handleIdentify}
                                disabled={dni.length < 8 || isProcessing}
                                className="w-full py-4 bg-primary text-primary-content rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
                            >
                                {isProcessing ? <Spinner /> : <SearchIcon className="h-5 w-5" />}
                                Continuar
                            </button>
                        </div>
                    </div>
                );

            case 'REGISTER':
                return (
                    <div className="max-w-md mx-auto bg-base-200 p-8 rounded-3xl shadow-2xl space-y-6 border border-base-border animate-in fade-in duration-300">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold">Registrar Encargado</h2>
                            <p className="text-base-content/60 text-sm">No encontramos su DNI ({dni}). Regístrese para firmar.</p>
                        </div>
                        
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider ml-1 opacity-60">Nombres</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-base-content/30" />
                                    <input 
                                        type="text" required
                                        value={regData.nombres}
                                        onChange={(e) => setRegData(prev => ({ ...prev, nombres: e.target.value }))}
                                        className="w-full pl-12 pr-4 py-3 input-style"
                                        placeholder="Ej. Juan"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider ml-1 opacity-60">Apellidos</label>
                                <input 
                                    type="text" required
                                    value={regData.apellidos}
                                    onChange={(e) => setRegData(prev => ({ ...prev, apellidos: e.target.value }))}
                                    className="w-full px-4 py-3 input-style"
                                    placeholder="Ej. Perez"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider ml-1 opacity-60">Celular</label>
                                <div className="relative">
                                    <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-base-content/30" />
                                    <input 
                                        type="tel" required
                                        value={regData.celular}
                                        onChange={(e) => setRegData(prev => ({ ...prev, celular: e.target.value.replace(/\D/g, '') }))}
                                        className="w-full pl-12 pr-4 py-3 input-style"
                                        placeholder="999888777"
                                    />
                                </div>
                            </div>
                            
                            <button 
                                type="submit"
                                disabled={isProcessing}
                                className="w-full py-4 bg-primary text-primary-content rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 mt-6 shadow-xl shadow-primary/20"
                            >
                                {isProcessing ? <Spinner /> : <PlusIcon className="h-5 w-5" />}
                                Registrarse y Continuar
                            </button>
                        </form>
                    </div>
                );

            case 'PREVIEW':
            case 'SIGNING':
                return (
                    <div className="h-[calc(100vh-120px)] flex flex-col gap-4 animate-in fade-in duration-300">
                        <div className="bg-base-200 p-4 rounded-2xl flex justify-between items-center shadow-lg border border-base-border">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-success/20 text-success rounded-full flex items-center justify-center">
                                    <UserIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-base-content/50 leading-none mb-1">IDENTIFICADO COMO</p>
                                    <p className="font-bold leading-none">{identifiedSupervisor?.nombres} {identifiedSupervisor?.apellidos}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isSigned ? (
                                    <button 
                                        onClick={() => setPageState('SIGNING')}
                                        className="px-6 py-3 bg-primary text-primary-content rounded-xl font-bold hover:scale-105 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                                    >
                                        <EditIcon className="h-5 w-5" />
                                        FIRMAR AHORA
                                    </button>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-xl font-bold text-xs uppercase tracking-widest border border-success/20">
                                            <CheckCircleIcon className="h-4 w-4" />
                                            FIRMADO
                                        </div>
                                        <button 
                                            onClick={() => setPageState('SUCCESS')}
                                            className="px-6 py-3 bg-success text-success-content rounded-xl font-bold hover:scale-105 transition-all shadow-xl shadow-success/20 active:scale-95 flex items-center gap-2"
                                        >
                                            FINALIZAR PROCESO
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 bg-base-300 rounded-2xl overflow-hidden border border-base-border shadow-inner">
                            <PDFViewer width="100%" height="100%" showToolbar={true} className="border-none rounded-2xl">
                                {type === 'visit' 
                                    ? <VisitReportPdf report={{ ...report, id: Number(id) }} />
                                    : <ServiceReportPdf report={{ ...report, id: Number(id) }} serial={report.codigo || String(id).padStart(4, '0')} />
                                }
                            </PDFViewer>
                        </div>

                        {pageState === 'SIGNING' && (
                            <SignaturePad 
                                onSave={handleSaveSignature}
                                onClose={() => setPageState('PREVIEW')}
                            />
                        )}
                        
                        {isProcessing && (
                            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                                <div className="bg-base-100 p-8 rounded-3xl flex flex-col items-center gap-4 shadow-2xl">
                                    <Spinner className="h-12 w-12 text-primary" />
                                    <p className="font-bold">Guardando firma y actualizando documento...</p>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'SUCCESS':
                return (
                    <div className="max-w-md mx-auto bg-base-200 p-10 rounded-3xl shadow-2xl space-y-6 border border-base-border text-center animate-in zoom-in duration-300">
                        <div className="h-24 w-24 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircleIcon className="h-12 w-12" />
                        </div>
                        <h2 className="text-3xl font-bold">¡Hecho!</h2>
                        <p className="text-base-content/60">El reporte ha sido firmado exitosamente y guardado en nuestro servidor.</p>
                        <div className="pt-6">
                            <button 
                                onClick={() => window.close()}
                                className="w-full py-4 bg-base-300 rounded-2xl font-bold hover:bg-base-border transition-colors"
                            >
                                Cerrar Ventana
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-base-100 p-4 md:p-8 flex flex-col items-center justify-center font-sans">
            <div className="w-full max-w-5xl h-full flex flex-col">
                <div className="flex flex-col items-center mb-10 w-full animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="flex flex-col items-center gap-4">
                        <div className="bg-primary p-4 rounded-3xl shadow-2xl shadow-primary/20 hover:scale-110 transition-transform duration-500">
                            <EditIcon className="h-10 w-10 text-primary-content" />
                        </div>
                        <div className="flex flex-col items-center">
                            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-base-content text-center">
                                PREVIEW <span className="text-primary">&</span> FIRMA
                            </h1>
                            <div className="flex items-center gap-4 mt-4 w-full max-w-[400px]">
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-primary/30 to-primary/50"></div>
                                <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.5em] text-neutral opacity-60 whitespace-nowrap">PLATAFORMA TÉCNICA BAECHLER</p>
                                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-primary/30 to-primary/50"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {renderContents()}
            </div>
        </div>
    );
};

export default ReportPreviewPage;
