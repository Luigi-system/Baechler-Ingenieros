

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Modal from './Modal';
import Spinner from './Spinner';
import { useSupabase } from '../../contexts/SupabaseContext';
import { useTheme } from '../../contexts/ThemeContext';
import { generateServiceReport, generateVisitReport } from '../../services/pdfGenerator';
import { SendIcon, PaperclipIcon, XIcon, UserCircleIcon, SearchIcon } from './Icons';
import type { User, Supervisor } from '../../types';

interface Recipient {
    email: string;
    name: string;
    type: 'user' | 'supervisor';
}

interface EmailSettingsData {
    from: string;
    url: string;
}

const DEFAULT_EMAIL_SETTINGS: EmailSettingsData = {
    from: 'luigi.rm.18@gmail.com',
    url: 'https://lr-system.vercel.app/mail',
};

interface EmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportId: number | null;
    reportType: 'service' | 'visit';
}

const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, reportId, reportType }) => {
    const { supabase } = useSupabase();
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
    const [emailConfig, setEmailConfig] = useState<EmailSettingsData>(DEFAULT_EMAIL_SETTINGS);
    const [configLoaded, setConfigLoaded] = useState(false);


    // Fetch potential recipients (Users, Supervisors)
    useEffect(() => {
        const fetchRecipients = async () => {
            if (!supabase) return;
            const combined: Recipient[] = [];
            
            const { data: users } = await supabase.from('Usuarios').select('nombres, email');
            if (users) {
                combined.push(...users.filter(u => u.email).map(u => ({ name: u.nombres, email: u.email!, type: 'user' as const })));
            }

            const { data: supervisors } = await supabase.from('Encargado').select('nombre, apellido, email');
            if (supervisors) {
                combined.push(...supervisors.filter(s => s.email).map(s => ({ name: `${s.nombre} ${s.apellido || ''}`.trim(), email: s.email!, type: 'supervisor' as const })));
            }
            
            const uniqueRecipients = Array.from(new Map(combined.map(item => [item.email, item])).values());
            setAllPossibleRecipients(uniqueRecipients);
        };
        fetchRecipients();
    }, [supabase]);

    // Main effect to load report data, generate PDF, and fetch email config when modal opens
    useEffect(() => {
        if (!isOpen || !reportId || !supabase) {
            // Reset state when modal is closed or not ready
            setRecipients([]); setSubject(''); setBody(''); setAttachment(null); setIsLoadingPdf(false); setFeedback(null);
            return;
        }

        const loadModalData = async () => {
            setIsLoadingPdf(true);
            setFeedback(null);
            setConfigLoaded(false);

            try {
                // Fetch email settings and report data in parallel
                const [emailSettingsRes] = await Promise.all([
                    supabase.from('Configuracion').select('value').eq('key', 'email_settings').is('id_usuario', null).maybeSingle(),
                ]);

                // Process email settings
                if (emailSettingsRes.error) {
                    console.warn("Could not fetch email settings, using defaults.", emailSettingsRes.error.message);
                    setFeedback({ type: 'info', message: 'Usando configuración de correo por defecto. Puede cambiarla en Ajustes > Integraciones.' });
                } else if (emailSettingsRes.data?.value) {
                    setEmailConfig({ ...DEFAULT_EMAIL_SETTINGS, ...JSON.parse(emailSettingsRes.data.value as string) });
                } else {
                     setFeedback({ type: 'info', message: 'No se encontró configuración de correo. Puede añadirla en Ajustes > Integraciones.' });
                }
                setConfigLoaded(true);


                // Process report data and generate PDF
                const tableName = reportType === 'service' ? 'Reporte_Servicio' : 'Reporte_Visita';
                const { data: reportData, error: reportError } = await supabase.from(tableName).select('*, empresa:Empresa(*), encargado:Encargado(*), usuario:Usuarios(nombres)').eq('id', reportId).single();
                if (reportError) throw reportError;

                const generator = reportType === 'service' ? generateServiceReport : generateVisitReport;
                const pdfDataUri = await generator(reportData as any, logoUrl, 'datauristring');
                
                const reportCode = (reportData as any).codigo_reporte || reportId;
                const filename = `reporte-${reportType}-${reportCode}.pdf`;

                if (pdfDataUri) {
                    const base64Content = (pdfDataUri as string).split('base64,')[1];
                    setAttachment({ filename, content: base64Content });
                    
                    const reportTitle = reportType === 'service' ? 'Servicio' : 'Visita';
                    setSubject(`Reporte de ${reportTitle}: ${reportCode} - ${(reportData as any).empresa?.nombre || ''}`);
                    setBody(`Estimado(a),\n\nAdjunto encontrará el reporte de ${reportTitle} con código ${reportCode} realizado en la fecha ${(reportData as any).fecha}.\n\nSaludos cordiales.`);

                    // Pre-fill recipient if available
                    if ((reportData as any).encargado?.email) {
                        const supervisorRecipient: Recipient = {
                            email: (reportData as any).encargado.email,
                            name: `${(reportData as any).encargado.nombre} ${(reportData as any).encargado.apellido || ''}`.trim(),
                            type: 'supervisor' as const,
                        };
                        setRecipients([supervisorRecipient]);
                    }
                }

            } catch (err: any) {
                setFeedback({ type: 'error', message: `No se pudo cargar los datos: ${err.message}` });
            } finally {
                setIsLoadingPdf(false);
            }
        };

        loadModalData();
    }, [isOpen, reportId, reportType, supabase, logoUrl]);
    
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
        if (isSending || !attachment || !configLoaded) return;
        if (recipients.length === 0) {
            setFeedback({ type: 'error', message: 'Por favor, añade al menos un destinatario.' });
            return;
        }

        setIsSending(true);
        setFeedback(null);
        let successCount = 0;
        let errorCount = 0;
        let lastErrorMessage = '';

        for (const recipient of recipients) {
            try {
                 const payload = {
                    from: emailConfig.from,
                    to: recipient.email,
                    subject: subject,
                    message: body,
                    attachments: attachment ? [
                        {
                            filename: attachment.filename,
                            content: attachment.content,
                            encoding: "base64",
                        }
                    ] : [],
                };

                 const response = await fetch(emailConfig.url, {
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
                                placeholder="Buscar por nombre o email..."
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