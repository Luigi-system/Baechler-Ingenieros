import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Modal from './Modal';
import Spinner from './Spinner';
import { useTheme } from '../../contexts/ThemeContext';
import { pdf } from '@react-pdf/renderer';
import ServiceReportPdf from '../reports/ServiceReportPdf';
import VisitReportPdf from '../reports/VisitReportPdf';
import type { ServiceReport, VisitReport } from '../../types';
import { SendIcon, PaperclipIcon, XIcon, UserCircleIcon, SearchIcon } from './Icons';
import type { User, Supervisor, EmailSettings } from '../../types';

interface Recipient {
    email: string;
    name: string;
    type: 'user' | 'supervisor';
}

const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
    from: 'luigi.rm.18@gmail.com',
    url: 'https://lr-system.vercel.app/mail',
    method: 'POST',
    headers: {},
};

interface EmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportId: number | null;
    reportType: 'service' | 'visit';
}

const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, reportId, reportType }) => {
    const { logoUrl } = useTheme();

    // Form state
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [attachment, setAttachment] = useState<{ filename: string; content: string } | null>(null);
    
    // UI/Flow state
    const [isLoadingPdf, setIsLoadingPdf] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

    // Search/Suggestions state
    const [searchTerm, setSearchTerm] = useState('');
    const [allPossibleRecipients, setAllPossibleRecipients] = useState<Recipient[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Email Config state
    const [emailConfig, setEmailConfig] = useState<EmailSettings>(DEFAULT_EMAIL_SETTINGS);
    const [configLoaded, setConfigLoaded] = useState(false);


    // Fetch potential recipients (Users, Supervisors)
    useEffect(() => {
        const fetchRecipients = async () => {
            const combined: Recipient[] = [];
            
            try {
                const [userRes, supervisorRes] = await Promise.all([
                    fetch('https://app.lr-system.com/bi/usuarios/getall').then(r => r.json()),
                    fetch('https://app.lr-system.com/bi/encargado/getall').then(r => r.json()),
                ]);

                const users = Array.isArray(userRes) ? userRes : (userRes.data || []);
                combined.push(...users.filter((u: any) => u.email).map((u: any) => ({ name: u.nombres, email: u.email!, type: 'user' as const })));

                const supervisors = Array.isArray(supervisorRes) ? supervisorRes : (supervisorRes.data || []);
                combined.push(...supervisors.filter((s: any) => s.email).map((s: any) => ({ name: `${s.nombres} ${s.apellidos || ''}`.trim(), email: s.email!, type: 'supervisor' as const })));
                
                const uniqueRecipients = Array.from(new Map(combined.map(item => [item.email, item])).values());
                setAllPossibleRecipients(uniqueRecipients);
            } catch (err) {
                console.error("Error fetching recipients:", err);
            }
        };
        fetchRecipients();
    }, []);

    // Main effect to load report data, generate PDF, and fetch email config when modal opens
    useEffect(() => {
        if (!isOpen || !reportId) {
            setRecipients([]); setSubject(''); setBody(''); setAttachment(null); setIsLoadingPdf(false); setFeedback(null);
            return;
        }

        const loadModalData = async () => {
            setIsLoadingPdf(true);
            setFeedback(null);
            setConfigLoaded(false);

            try {
                const reportEndpoint = reportType === 'service' ? 'reporte-servicio' : 'reporte-visita';
                const [reportData, supervisorRes] = await Promise.all([
                    fetch(`https://app.lr-system.com/bi/${reportEndpoint}/get/${reportId}`).then(r => r.json()),
                    fetch('https://app.lr-system.com/bi/encargado/getall').then(r => r.json()),
                ]);

                setEmailConfig(DEFAULT_EMAIL_SETTINGS); // Fallback to default
                setConfigLoaded(true);

                if (reportData.encargado_nombre && supervisorRes) {
                    const supervisors = Array.isArray(supervisorRes) ? supervisorRes : (supervisorRes.data || []);
                    const matchingSupervisor = supervisors.find((s: any) => 
                        `${s.nombres} ${s.apellidos || ''}`.trim().toLowerCase() === reportData.encargado_nombre.trim().toLowerCase() && s.email
                    );
                    if (matchingSupervisor) {
                        setRecipients([{
                            email: matchingSupervisor.email!,
                            name: reportData.encargado_nombre,
                            type: 'supervisor' as const,
                        }]);
                    }
                }

                const reportCode = reportData.codigo || reportId;
                const filename = `reporte-${reportType}-${reportCode}.pdf`;

                const pdfBlob = await pdf(
                    reportType === 'service' ? (
                        <ServiceReportPdf 
                            report={reportData as ServiceReport} 
                            logoUrl={logoUrl || undefined} 
                            serial={String(reportCode)} 
                        />
                    ) : (
                        <VisitReportPdf 
                            report={reportData as VisitReport} 
                            logoUrl={logoUrl || undefined} 
                        />
                    )
                ).toBlob();
                
                const base64Promise = new Promise<string | null>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const res = reader.result as string;
                        resolve(res.split('base64,')[1]);
                    };
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(pdfBlob);
                });
                
                const base64Content = await base64Promise;

                if (base64Content) {
                    setAttachment({ filename, content: base64Content });
                    
                    const reportTitle = reportType === 'service' ? 'Servicio' : 'Visita';
                    setSubject(`Reporte de ${reportTitle}: ${reportCode} - ${reportData.empresa_nombre || ''}`);
                    const reportDate = reportData.fecha || (reportData.created_at ? new Date(reportData.created_at).toLocaleDateString('es-ES') : 'N/A');
                    setBody(`Estimado(a),\n\nAdjunto encontrará el reporte de ${reportTitle} con código ${reportCode} realizado en la fecha ${reportDate}.\n\nSaludos cordiales.`);
                } else {
                    throw new Error("La generación del PDF no pudo ser procesada.");
                }

            } catch (err: any) {
                setFeedback({ type: 'error', message: `No se pudo cargar los datos: ${err.message}` });
            } finally {
                setIsLoadingPdf(false);
            }
        };

        loadModalData();
    }, [isOpen, reportId, reportType, logoUrl]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const handleSend = async () => {
        if (isSending || !configLoaded) return;
        if (recipients.length === 0) {
            setFeedback({ type: 'error', message: 'Por favor, añade al menos un destinatario.' });
            return;
        }

        setIsSending(true);
        setFeedback(null);
        let successCount = 0;
        let errorCount = 0;
        let lastErrorMessage = '';

        const { url } = emailConfig;

        for (const recipient of recipients) {
            try {
                 const payload = {
                    from: emailConfig.from,
                    to: recipient.email,
                    subject: subject,
                    message: body.replace(/\n/g, '<br />'),
                    attachments: attachment ? [
                        {
                            filename: attachment.filename,
                            content: attachment.content,
                        }
                    ] : [],
                };

                console.log('Enviando correo con el siguiente payload:', payload);

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`El servidor respondió con estado ${response.status}: ${errorText}`);
                }
                successCount++;
            } catch (err: any) {
                console.error(`Error sending email to ${recipient.email}:`, err);
                errorCount++;
                lastErrorMessage = err.message;
            }
        }
        
        setIsSending(false);

        if (errorCount > 0) {
            setFeedback({ type: 'error', message: `Se enviaron ${successCount} correos. Fallaron ${errorCount}. Último error: ${lastErrorMessage}` });
        } else {
            setFeedback({ type: 'success', message: `¡${successCount} correo(s) enviado(s) exitosamente!` });
            setTimeout(onClose, 2000);
        }
    };


    const addRecipient = (recipient: Recipient) => {
        if (!recipients.some(r => r.email === recipient.email)) {
            setRecipients([...recipients, recipient]);
        }
        setSearchTerm('');
        setShowSuggestions(false);
    };

    const removeRecipient = (email: string) => {
        setRecipients(recipients.filter(r => r.email !== email));
    };

    const filteredSuggestions = useMemo(() => {
        if (!searchTerm) return [];
        const lowercasedTerm = searchTerm.toLowerCase();
        return allPossibleRecipients.filter(
            p => (p.name.toLowerCase().includes(lowercasedTerm) || p.email.toLowerCase().includes(lowercasedTerm)) && !recipients.some(r => r.email === p.email)
        );
    }, [searchTerm, allPossibleRecipients, recipients]);

    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchTerm.trim() !== '') {
            e.preventDefault();
            const term = searchTerm.trim();
            
            const exactMatch = filteredSuggestions.find(p => p.email.toLowerCase() === term.toLowerCase());
            if (exactMatch) {
                addRecipient(exactMatch);
            } else if (isValidEmail(term)) {
                const newRecipient: Recipient = {
                    email: term,
                    name: term.split('@')[0],
                    type: 'supervisor', // Treat manually added emails as a supervisor type for simplicity
                };
                addRecipient(newRecipient);
            } else {
                setFeedback({ type: 'error', message: 'Por favor, introduce un correo electrónico válido y presiona Enter.' });
                setTimeout(() => setFeedback(null), 3000);
            }
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Enviar Reporte por Correo" maxWidth="max-w-3xl">
            <div className="space-y-4 p-1">
                 <div>
                    <label className="block text-sm font-medium">Para:</label>
                    <div ref={searchRef} className="relative mt-1">
                        <div className="flex flex-wrap gap-2 p-2 border border-base-border rounded-md bg-base-100 min-h-[40px]">
                            {recipients.map(r => (
                                <span key={r.email} className="flex items-center gap-2 bg-primary/10 text-primary text-sm px-2 py-1 rounded-full">
                                    {r.name}
                                    <button onClick={() => removeRecipient(r.email)} className="text-primary hover:text-primary-focus"><XIcon className="h-3 w-3"/></button>
                                </span>
                            ))}
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onFocus={() => setShowSuggestions(true)}
                                onKeyDown={handleSearchKeyDown}
                                placeholder="Buscar o añadir nuevo correo y presionar Enter..."
                                className="flex-grow bg-transparent focus:outline-none text-sm p-1"
                            />
                        </div>
                        {showSuggestions && filteredSuggestions.length > 0 && (
                            <ul className="absolute z-10 w-full mt-1 bg-base-200 border border-base-border rounded-md shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
                                {filteredSuggestions.map(p => (
                                    <li key={p.email} onMouseDown={() => addRecipient(p)} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-base-300">
                                        <UserCircleIcon className="h-5 w-5 text-neutral" />
                                        <div>
                                            <p className="text-sm font-medium">{p.name}</p>
                                            <p className="text-xs text-neutral">{p.email}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div>
                    <label htmlFor="subject" className="block text-sm font-medium">Asunto:</label>
                    <input type="text" id="subject" value={subject} onChange={e => setSubject(e.target.value)} className="mt-1 w-full input-style"/>
                </div>

                <div>
                    <label htmlFor="body" className="block text-sm font-medium">Cuerpo (Message):</label>
                    <textarea id="body" value={body} onChange={e => setBody(e.target.value)} rows={6} className="mt-1 w-full input-style"/>
                </div>

                <div>
                    <label className="block text-sm font-medium">Adjunto:</label>
                    {isLoadingPdf ? (
                        <div className="flex items-center gap-2 mt-2"><Spinner/> <span>Generando PDF...</span></div>
                    ) : attachment ? (
                        <div className="mt-2 flex items-center gap-2 p-2 bg-base-100 border border-base-border rounded-md">
                            <PaperclipIcon className="h-5 w-5 text-neutral"/>
                            <span className="text-sm font-medium">{attachment.filename}</span>
                        </div>
                    ) : (
                        <p className="text-sm text-warning mt-2">No se pudo cargar el archivo adjunto.</p>
                    )}
                </div>

                 {feedback && (
                    <div className={`mt-4 p-3 rounded-md text-sm ${
                        feedback.type === 'success' ? 'bg-success/10 text-success' : 
                        feedback.type === 'error' ? 'bg-error/10 text-error' :
                        'bg-info/10 text-info'
                    }`}>
                        {feedback.message}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <button onClick={onClose} className="bg-base-300 py-2 px-4 rounded-lg hover:bg-neutral/20 transition-colors">Cancelar</button>
                    <button onClick={handleSend} disabled={isSending || isLoadingPdf || !attachment} className="flex items-center gap-2 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors disabled:bg-primary/50">
                        {isSending ? <Spinner /> : <SendIcon className="h-5 w-5"/>}
                        {isSending ? 'Enviando...' : 'Enviar Correo'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default EmailModal;
