

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { SendIcon, AssistantIcon, XIcon, CheckCircleIcon, AlertTriangleIcon, SearchIcon, DownloadIcon, DocumentIcon, ImageIcon, CameraIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';
import { useChat, Message } from '../../contexts/ChatContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAiService } from '../../contexts/AiServiceContext';
import type { AIResponse, TableData, ChartData, Action, FormField, ConfirmationMessage, ImageViewer, FileViewer, VideoPlayer, AudioPlayer, TableComponentData, RecordViewData, ColumnDefinition } from '../../types';

interface AssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const FilterableTable: React.FC<{ data: TableData }> = ({ data }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRows = useMemo(() => {
        if (!searchTerm.trim()) return data.rows;
        return data.rows.filter(row => 
            row.some(cell => 
                String(cell).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [searchTerm, data.rows]);

    if (!data || !data.headers || !data.rows) return null;
    
    return (
        <div className="mt-3 space-y-2">
            <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-neutral" />
                </div>
                <input
                    type="text"
                    placeholder={`Filtrar en ${data.rows.length} filas...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full text-sm pl-9 pr-3 py-1.5 input-style"
                />
            </div>
            <div className="overflow-auto max-h-96 border border-base-border rounded-lg custom-scrollbar">
                <table className="min-w-full text-sm">
                    <thead className="bg-base-100 dark:bg-base-300 sticky top-0 z-10">
                        <tr>
                            {data.headers.map((header, i) => (
                                <th key={i} className="px-3 py-2 text-left font-semibold">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-base-border">
                        {filteredRows.length > 0 ? (
                            filteredRows.map((row, i) => (
                                <tr key={i} className="hover:bg-base-100 dark:hover:bg-base-300/50">
                                    {row.map((cell, j) => (
                                        <td key={j} className="px-3 py-2 whitespace-pre-wrap">{String(cell)}</td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                             <tr>
                                <td colSpan={data.headers.length} className="px-3 py-4 text-center text-neutral">
                                    No se encontraron resultados para "{searchTerm}".
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TableComponent: React.FC<{ data: TableComponentData; onAction: (prompt: string) => void; }> = ({ data, onAction }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return data.data;
        return data.data.filter(row =>
            Object.values(row).some(value =>
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [searchTerm, data.data]);

    const paginatedData = useMemo(() => {
        if (!data.pagination) return filteredData;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredData.slice(startIndex, endIndex);
    }, [currentPage, filteredData, itemsPerPage, data.pagination]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const handleAction = (action: Action, row: Record<string, any>) => {
        const interpolatedPrompt = action.prompt.replace(/\{([^}]+)\}/g, (match, key) => {
            const trimmedKey = key.trim();
            return row[trimmedKey] !== undefined ? String(row[trimmedKey]) : match;
        });
        onAction(interpolatedPrompt);
    };

    return (
        <div className="mt-3 space-y-2">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-neutral" />
                </div>
                <input
                    type="text"
                    placeholder={`Filtrar en ${data.data.length} filas...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full text-sm pl-9 pr-3 py-1.5 input-style"
                />
            </div>
            <div className="overflow-auto max-h-96 border border-base-border rounded-lg custom-scrollbar">
                <table className="min-w-full text-sm">
                    <thead className="bg-base-100 dark:bg-base-300 sticky top-0 z-10">
                        <tr>
                            {data.columns.map((col, i) => (
                                <th key={i} className="px-3 py-2 text-left font-semibold">{col.header}</th>
                            ))}
                             {data.actions && data.actions.length > 0 && (
                                <th className="px-3 py-2 text-left font-semibold">Acciones</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-base-border">
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row, i) => (
                                <tr key={i} className="hover:bg-base-100 dark:hover:bg-base-300/50">
                                    {data.columns.map((col, j) => (
                                        <td key={j} className="px-3 py-2 whitespace-pre-wrap">{String(row[col.accessor])}</td>
                                    ))}
                                    {data.actions && data.actions.length > 0 && (
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                {data.actions.map((action, k) => (
                                                    <button
                                                        key={k}
                                                        onClick={() => handleAction(action, row)}
                                                        className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors 
                                                            ${action.style === 'danger' ? 'bg-error text-white hover:bg-error/80' : 
                                                            action.style === 'secondary' ? 'bg-secondary text-white hover:bg-secondary/80' :
                                                            action.style === 'ghost' ? 'bg-transparent text-primary hover:bg-primary/10 border border-primary' :
                                                            'bg-primary text-white hover:bg-primary-focus'}
                                                        `}
                                                    >
                                                        {action.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={data.columns.length + (data.actions && data.actions.length > 0 ? 1 : 0)} className="px-3 py-4 text-center text-neutral">
                                    No se encontraron resultados para "{searchTerm}".
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {data.pagination && totalPages > 1 && (
                <div className="flex justify-center items-center mt-2 space-x-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm bg-base-300 rounded-md hover:bg-base-100 disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <span className="text-sm">Página {currentPage} de {totalPages}</span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm bg-base-300 rounded-md hover:bg-base-100 disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
            )}
        </div>
    );
};


const BarChartComponent: React.FC<{ data: any[] }> = ({ data }) => {
    const { themeMode } = useTheme();
    const tickColor = themeMode === 'dark' ? '#9CA3AF' : '#6B7280';
    return (
        <div className="mt-3 h-60">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <XAxis dataKey="name" stroke={tickColor} fontSize={12} />
                    <YAxis stroke={tickColor} fontSize={12}/>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-base-200)', border: '1px solid var(--color-base-border)' }}/>
                    <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

const PieChartComponent: React.FC<{ data: any[] }> = ({ data }) => {
    const COLORS = ['var(--color-primary)', 'var(--color-secondary)', 'var(--color-accent)', '#34d399', '#f9a8d4'];
    return (
        <div className="mt-3 h-60">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                         {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-base-200)', border: '1px solid var(--color-base-border)' }}/>
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

const ImageViewerComponent: React.FC<{ data: ImageViewer }> = ({ data }) => (
    <div className="mt-3 flex justify-center p-2 bg-base-100 rounded-lg border border-base-border">
        <img 
            src={data.src} 
            alt={data.alt} 
            className="max-w-full h-auto rounded-md object-contain" 
            style={{ maxWidth: data.width, maxHeight: data.height }} 
        />
    </div>
);

const FileViewerComponent: React.FC<{ data: FileViewer }> = ({ data }) => (
    <div className="mt-3 p-3 border border-base-border rounded-lg flex items-center justify-between bg-base-100">
        <div className="flex items-center space-x-2">
            {data.mimeType?.startsWith('image/') ? <ImageIcon className="h-5 w-5 text-neutral" /> : <DocumentIcon className="h-5 w-5 text-neutral" />}
            <span className="text-sm font-medium">{data.fileName}</span>
        </div>
        {data.downloadable && data.src && (
            <a href={data.src} download={data.fileName} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center space-x-1">
                <DownloadIcon className="h-4 w-4" />
                <span>Descargar</span>
            </a>
        )}
        {!data.downloadable && data.src && (
            <a href={data.src} target="_blank" rel="noopener noreferrer" className="text-info hover:underline flex items-center space-x-1">
                 <span>Abrir</span>
            </a>
        )}
    </div>
);

const VideoPlayerComponent: React.FC<{ data: VideoPlayer }> = ({ data }) => (
    <div className="mt-3 flex justify-center p-2 bg-base-100 rounded-lg border border-base-border">
        <video src={data.src} controls={data.controls} autoPlay={data.autoplay} loop={data.loop} className="max-w-full h-auto rounded-md shadow-md"></video>
    </div>
);

const AudioPlayerComponent: React.FC<{ data: AudioPlayer }> = ({ data }) => (
    <div className="mt-3 flex justify-center p-2 bg-base-100 rounded-lg border border-base-border">
        <audio src={data.src} controls={data.controls} autoPlay={data.autoplay} loop={data.loop} className="w-full max-w-sm"></audio>
    </div>
);

const RecordViewComponent: React.FC<{ data: RecordViewData }> = ({ data }) => (
    <div className="mt-3 p-3 border border-base-border rounded-lg bg-base-100 space-y-2">
        {data.fields.map((field, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
                <span className="font-medium text-neutral">{field.label}:</span>
                <span className="text-base-content">{String(field.value)}</span>
            </div>
        ))}
    </div>
);

const Assistant: React.FC<AssistantProps> = ({ isOpen, onClose }) => {
  const { service, isChatServiceConfigured } = useAiService();
  const { messages, isLoading, sendMessage, setHasUnreadMessage } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  
  const [activeForm, setActiveForm] = useState<{ messageIndex: number; fields: FormField[] } | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});


  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  
  useEffect(() => {
    if (isOpen) {
        // A short delay ensures the slide-up animation completes before scrolling.
        const timerId = setTimeout(() => {
            scrollToBottom();
        }, 350); // Animation duration is 300ms.
        
        return () => clearTimeout(timerId); // Cleanup the timeout if the component unmounts or re-renders
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
    // Find the last message from the AI that contains a form
    const lastAiMessageWithForm = [...messages].reverse().find(msg => msg.sender === 'ai' && (msg.content as AIResponse).form);
    
    if (lastAiMessageWithForm) {
        const messageIndex = messages.indexOf(lastAiMessageWithForm);
        const formContent = (lastAiMessageWithForm.content as AIResponse).form;
        let fields: FormField[] | undefined;

        // Ensure formContent is an array
        if (Array.isArray(formContent)) {
            fields = formContent;
        } else if (formContent && typeof formContent === 'object' && Array.isArray((formContent as any).fields)) {
            // Handle malformed AI response: { title: '...', fields: [...] } if it happens again
            console.warn("AI returned a non-standard form object. Adapting to its structure.");
            fields = (formContent as any).fields;
        }

        if (fields && Array.isArray(fields) && fields.every(f => typeof f === 'object' && f.name && f.label && f.type)) {
            // Only update if the form is different from the current active one
            if (activeForm?.messageIndex !== messageIndex) {
                setActiveForm({ messageIndex, fields });
                const initialValues = fields.reduce((acc, field) => {
                    if (field.type === 'checkbox') {
                        acc[field.name] = field.checked !== undefined ? field.checked : (field.value !== undefined ? !!field.value : false);
                    } else if (field.type === 'hidden' || field.type === 'text' || field.type === 'field') {
                        acc[field.name] = field.value !== undefined ? field.value : '';
                    } else if (field.type === 'select' || field.type === 'combobox') {
                        // For select/combobox, initial value should be the full "value: Label" string from options if it exists,
                        // or the 'selected' attribute if provided, falling back to an empty string.
                        // If selected is "España" and options are ["España: España", ...], we want "España".
                        const selectedVal = field.selected !== undefined ? field.selected : (field.value !== undefined ? field.value : '');
                        const foundOption = field.options?.find(option => option.split(':')[0].trim() === selectedVal);
                        acc[field.name] = foundOption || selectedVal; // Use the full option string if found, otherwise just the value
                    } else if (field.type === 'file_upload') {
                         acc[field.name] = ''; // No interactive file upload in chat form yet
                    }
                    return acc;
                }, {} as Record<string, any>);
                setFormValues(initialValues);
            }
        } else {
            console.warn("AI response contained a 'form' field that was not an array or a recognized object structure:", formContent);
            if (activeForm) {
                setActiveForm(null);
                setFormValues({});
            }
        }
    } else {
        if (activeForm) {
            setActiveForm(null); // Clear form if no longer present in last message
            setFormValues({}); // Also clear form values
        }
    }
  }, [messages, activeForm]);
  
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].sender === 'ai' && !isOpen) {
        setHasUnreadMessage(true);
    }
  }, [messages, isOpen, setHasUnreadMessage]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSend = useCallback(async (prompt: string) => {
    if (prompt.trim() === '' || isLoading) return;
    setInput('');
    await sendMessage(prompt);
  }, [isLoading, sendMessage]);

  const handleActionClick = (actionPrompt: string) => {
    handleSend(actionPrompt);
  };
  
  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const isCheckbox = type === 'checkbox';
      const checked = (e.target as HTMLInputElement).checked;
      setFormValues(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
  };

  const handleFormSubmit = async () => {
      if (!activeForm) return;
      
      // For select/combobox fields, we need to extract the actual value if options were "ID: Name"
      const processedFormValues = { ...formValues };
      activeForm.fields.forEach(field => {
          if (field.type === 'select' || field.type === 'combobox') {
              const selectedValue = formValues[field.name];
              if (typeof selectedValue === 'string' && selectedValue.includes(':')) {
                  // If the value is in "ID: Name" format, extract ID
                  processedFormValues[field.name] = selectedValue.split(':')[0].trim();
              } else if (typeof selectedValue === 'string' && selectedValue === '') {
                  // If no option is selected, ensure it's treated as null or undefined if required by backend
                  processedFormValues[field.name] = null; // Or undefined, depending on API expectation
              }
              // If selectedValue is already just the ID (e.g. from initial 'selected' attr), keep it as is
          }
      });

      const submissionPrompt = `El usuario ha completado el formulario con los siguientes datos: ${JSON.stringify(processedFormValues)}. Procede a crear el registro en la base de datos.`;
      
      setActiveForm(null);
      setFormValues({});
      await sendMessage(submissionPrompt);
  };

  if (!isOpen) return null;

  const assistantContent = () => {
    if (!isChatServiceConfigured()) {
        return (
            <div className="flex flex-col h-full justify-center items-center text-center p-4">
                <h3 className="text-lg font-semibold">Servicio No Configurado</h3>
                <p className="text-neutral mt-2 text-sm">
                    El servicio de IA para el asistente ('{service === 'n8n' ? 'Agente AI' : service}') no está configurado.
                    <br />
                    Por favor, ve a Configuración &gt; Servicios de IA y Autocompletado para seleccionarlo y asegúrate que la API Key/URL del Webhook esté disponible.
                </p>
            </div>
        );
    }
    return (
        <>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                {messages.map((msg, index) => {
                    const isUser = msg.sender === 'user';
                    const content = msg.content;
                    if (isUser && typeof content === 'string') {
                        return (
                          <div key={index} className="flex justify-end animate-slide-in-up">
                            <div className="max-w-lg px-4 py-2 rounded-2xl bg-primary text-white rounded-br-none">{content}</div>
                          </div>
                        );
                    }
                    if (!isUser && typeof content === 'object') {
                        const aiContent = content as AIResponse;
                        const statusDisplay = aiContent.statusDisplay;

                        return (
                          <div key={index} className="flex items-start gap-3 justify-start animate-slide-in-up">
                             <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0"><AssistantIcon className="h-5 w-5 text-white"/></div>
                            <div className="max-w-lg p-3 rounded-2xl bg-base-300 rounded-bl-none w-full">
                                {statusDisplay && (
                                    <div 
                                        role="alert"
                                        aria-live="assertive"
                                        className={`p-4 rounded-lg mb-3 flex items-center gap-3 ${
                                        statusDisplay.icon === 'success' ? 'bg-success/10 text-success' :
                                        statusDisplay.icon === 'error' ? 'bg-error/10 text-error' :
                                        statusDisplay.icon === 'warning' ? 'bg-warning/10 text-warning' :
                                        'bg-info/10 text-info'
                                    }`}>
                                        {statusDisplay.icon === 'success' && <CheckCircleIcon className="h-8 w-8 shrink-0" />}
                                        {(statusDisplay.icon === 'error' || statusDisplay.icon === 'warning') && <AlertTriangleIcon className="h-8 w-8 shrink-0" />}
                                        {statusDisplay.icon === 'info' && <AssistantIcon className="h-8 w-8 shrink-0" />} {/* Reusing AssistantIcon for general info */}
                                        <div>
                                            <h4 className="font-bold text-lg">{statusDisplay.title}</h4>
                                            <p className="text-sm">{statusDisplay.message}</p>
                                        </div>
                                    </div>
                                )}

                                {aiContent.displayText && <div className="prose prose-sm max-w-none prose-zinc dark:prose-invert text-base-content"><ReactMarkdown>{aiContent.displayText}</ReactMarkdown></div>}
                                {aiContent.table && <FilterableTable data={aiContent.table} />}
                                {aiContent.chart && aiContent.chart.type === 'bar' && <BarChartComponent data={aiContent.chart.data} />}
                                {aiContent.chart && aiContent.chart.type === 'pie' && <PieChartComponent data={aiContent.chart.data} />}
                                
                                {aiContent.imageViewer && <ImageViewerComponent data={aiContent.imageViewer} />}
                                {aiContent.fileViewer && <FileViewerComponent data={aiContent.fileViewer} />}
                                {aiContent.videoPlayer && <VideoPlayerComponent data={aiContent.videoPlayer} />}
                                {aiContent.audioPlayer && <AudioPlayerComponent data={aiContent.audioPlayer} />}
                                {aiContent.tableComponent && <TableComponent data={aiContent.tableComponent} onAction={handleActionClick} />}
                                {aiContent.recordView && <RecordViewComponent data={aiContent.recordView} />}
                                {aiContent.list && (
                                    <div className="mt-3 p-2 bg-base-100 rounded-lg border border-base-border">
                                        {aiContent.list.title && <h5 className="font-semibold text-base-content mb-1">{aiContent.list.title}</h5>}
                                        <ul className="list-disc list-inside text-sm text-base-content">
                                            {aiContent.list.items.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}


                                {aiContent.actions && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {aiContent.actions.map((action, i) => (
                                            <button 
                                                key={i} 
                                                onClick={() => handleActionClick(action.prompt)} 
                                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors 
                                                    ${action.style === 'danger' ? 'bg-error text-white hover:bg-error/80' : 
                                                    action.style === 'secondary' ? 'bg-secondary text-white hover:bg-secondary/80' :
                                                    action.style === 'ghost' ? 'bg-transparent text-primary hover:bg-primary/10 border border-primary' : // New ghost style
                                                    'bg-primary text-white hover:bg-primary-focus'}
                                                `}
                                            >
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {aiContent.form && activeForm?.messageIndex === index && (
                                    <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="mt-4 space-y-3 p-3 bg-base-100/50 rounded-lg border border-base-border">
                                        <p className="text-sm font-semibold text-base-content">Por favor, completa el formulario:</p>
                                        {activeForm.fields.map(field => (
                                            <div key={field.name}>
                                                {field.type !== 'hidden' && ( // Don't display hidden fields
                                                    <label htmlFor={field.name} className="block text-xs font-medium mb-1">{field.label}</label>
                                                )}
                                                {(field.type === 'text' || field.type === 'field') && 
                                                    (field.inputType === 'textarea' ? (
                                                        <textarea 
                                                            id={field.name} 
                                                            name={field.name} 
                                                            value={formValues[field.name] || ''} 
                                                            onChange={handleFormInputChange} 
                                                            className="w-full text-sm input-style min-h-[60px]" 
                                                            // FIX: Removed redundant `&& field.type !== 'hidden'` check.
                                                            required={!field.value} 
                                                            placeholder={field.placeholder || ''}
                                                        />
                                                    ) : (
                                                        <input 
                                                            type={field.inputType || 'text'} 
                                                            id={field.name} 
                                                            name={field.name} 
                                                            value={formValues[field.name] || ''} 
                                                            onChange={handleFormInputChange} 
                                                            className="w-full text-sm input-style" 
                                                            // FIX: Removed redundant `&& field.type !== 'hidden'` check.
                                                            required={!field.value} 
                                                            placeholder={field.placeholder || ''}
                                                        />
                                                    ))
                                                }
                                                {(field.type === 'select' || field.type === 'combobox') && (
                                                    <select 
                                                        id={field.name} 
                                                        name={field.name} 
                                                        value={formValues[field.name] || ''} 
                                                        onChange={handleFormInputChange} 
                                                        className="w-full text-sm input-style" 
                                                        // FIX: Removed redundant `&& field.type !== 'hidden'` check.
                                                        required={!field.value}
                                                    >
                                                        <option value="" disabled>{field.placeholder || 'Selecciona...'}</option>
                                                        {field.options?.map(opt => {
                                                            const [val, label] = opt.split(': ', 2);
                                                            return <option key={val} value={val}>{label || val}</option>
                                                        })}
                                                    </select>
                                                )}
                                                {field.type === 'checkbox' && 
                                                    <div className="flex items-center">
                                                        <input 
                                                            type="checkbox" 
                                                            id={field.name} 
                                                            name={field.name} 
                                                            checked={formValues[field.name] || false} 
                                                            onChange={handleFormInputChange} 
                                                            className="rounded text-primary focus:ring-primary border-base-border"
                                                        />
                                                        <label htmlFor={field.name} className="ml-2 block text-sm">{field.label}</label>
                                                    </div>
                                                }
                                                {field.type === 'hidden' && (
                                                    <input type="hidden" id={field.name} name={field.name} value={formValues[field.name] || ''} />
                                                )}
                                                {field.type === 'file_upload' && (
                                                    // Placeholder for file upload - actual interactive upload would require more complex UI
                                                    <div className="flex items-center gap-2 p-2 bg-base-200 rounded-md text-sm text-neutral italic border border-base-border">
                                                        <CameraIcon className="h-4 w-4 shrink-0"/>
                                                        <span>Campo de carga de archivo: "{field.label}" (MimeType: {field.mimeType || 'any'}). La carga interactiva no está disponible directamente en el chat.</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        <button type="submit" className="w-full text-sm font-semibold bg-primary text-white rounded-md py-2 hover:bg-primary-focus transition-colors">
                                            Enviar Datos
                                        </button>
                                    </form>
                                )}
                                {aiContent.suggestions && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {aiContent.suggestions.map((s, i) => (
                                        <button key={i} onClick={() => handleSend(s)} className="px-2.5 py-1 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors">
                                            {s}
                                        </button>
                                    ))}
                                </div>
                                )}
                            </div>
                          </div>
                        );
                    }
                    return null;
                })}
                {isLoading && (
                    <div className="flex items-start gap-3 justify-start animate-slide-in-up">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0"><AssistantIcon className="h-5 w-5 text-white"/></div>
                        <div className="max-w-sm p-3 rounded-2xl bg-base-300 rounded-bl-none">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-neutral animate-pulse"></div>
                                <div className="w-2 h-2 rounded-full bg-neutral animate-pulse [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 rounded-full bg-neutral animate-pulse [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-base-border shrink-0">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
                        placeholder="Ej: ¿Cuántos reportes hay?"
                        className="w-full pl-4 pr-12 py-3 bg-base-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary input-style"
                        disabled={isLoading}
                    />
                    <button onClick={() => handleSend(input)} disabled={isLoading || !input} className="absolute inset-y-0 right-0 flex items-center justify-center w-12 h-full text-primary disabled:text-neutral transition-colors">
                        <SendIcon className="h-6 w-6"/>
                    </button>
                </div>
            </div>
        </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-end p-4" onClick={onClose}>
        <div 
            className="bg-base-200 rounded-xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col animate-slide-in-up" 
            onClick={e => e.stopPropagation()}
        >
            <div className="flex items-center justify-between p-4 border-b border-base-border shrink-0">
                <h2 className="text-lg font-semibold text-base-content">Asistente IA</h2>
                <button onClick={onClose} className="p-1 rounded-full text-neutral hover:bg-base-300">
                    <XIcon className="h-6 w-6" />
                </button>
            </div>
            {assistantContent()}
        </div>
    </div>
  );
};

export default Assistant;