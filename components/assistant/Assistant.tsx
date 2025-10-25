

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { SendIcon, AssistantIcon, XIcon, CheckCircleIcon, AlertTriangleIcon, SearchIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';
import { useChat, Message } from '../../contexts/ChatContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAiService } from '../../contexts/AiServiceContext';
import type { AIResponse, TableData, ChartData, Action, FormField, ConfirmationMessage } from '../../types';

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

const Assistant: React.FC<AssistantProps> = ({ isOpen, onClose }) => {
  const { service, isConfigured } = useAiService();
  const { messages, isLoading, sendMessage, setHasUnreadMessage } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  
  const [activeForm, setActiveForm] = useState<{ messageIndex: number; fields: FormField[] } | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});


  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  
  useEffect(() => {
    scrollToBottom();
    // Find the last message from the AI that contains a form
    const lastAiMessageWithForm = [...messages].reverse().find(msg => msg.sender === 'ai' && (msg.content as AIResponse).form);
    
    if (lastAiMessageWithForm) {
        const messageIndex = messages.indexOf(lastAiMessageWithForm);
        const formContent = (lastAiMessageWithForm.content as AIResponse).form;
        let fields: FormField[] | undefined;

        if (Array.isArray(formContent)) {
            // Standard, correct case
            fields = formContent;
        } else if (formContent && typeof formContent === 'object' && Array.isArray((formContent as any).fields)) {
            // Handle malformed AI response: { title: '...', fields: [...] }
            console.warn("AI returned a non-standard form object. Adapting to its structure.");
            fields = (formContent as any).fields;
        }

        if (fields && Array.isArray(fields) && fields.every(f => typeof f === 'object' && f.name && f.label && f.type)) {
            // Only update if the form is different from the current active one
            if (activeForm?.messageIndex !== messageIndex) {
                setActiveForm({ messageIndex, fields });
                const initialValues = fields.reduce((acc, field) => {
                    acc[field.name] = field.type === 'checkbox' ? false : '';
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
  
  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const isCheckbox = type === 'checkbox';
      const checked = (e.target as HTMLInputElement).checked;
      setFormValues(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
  };

  const handleFormSubmit = async () => {
      if (!activeForm) return;
      
      // For select fields, we need to extract the ID from "ID: Name" format.
      const processedFormValues = { ...formValues };
      activeForm.fields.forEach(field => {
          if (field.type === 'select') {
              const selectedValue = formValues[field.name];
              if (typeof selectedValue === 'string' && selectedValue.includes(':')) {
                  processedFormValues[field.name] = selectedValue.split(':')[0].trim();
              }
          }
      });

      const submissionPrompt = `El usuario ha completado el formulario con los siguientes datos: ${JSON.stringify(processedFormValues)}. Procede a crear el registro en la base de datos.`;
      
      setActiveForm(null);
      setFormValues({});
      await sendMessage(submissionPrompt);
  };

  if (!isOpen) return null;

  const assistantContent = () => {
    if (!isConfigured(service)) {
        return (
            <div className="flex flex-col h-full justify-center items-center text-center p-4">
                <h3 className="text-lg font-semibold">Servicio No Configurado</h3>
                <p className="text-neutral mt-2 text-sm">
                    El servicio de IA ('{service}') no está configurado.
                    <br />
                    Por favor, ve a Configuración &gt; Servicios de IA para seleccionarlo y asegúrate que la API Key esté disponible.
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

                                <div className="prose prose-sm max-w-none prose-zinc dark:prose-invert text-base-content"><ReactMarkdown>{aiContent.displayText}</ReactMarkdown></div>
                                {aiContent.table && <FilterableTable data={aiContent.table} />}
                                {aiContent.chart && aiContent.chart.type === 'bar' && <BarChartComponent data={aiContent.chart.data} />}
                                {aiContent.chart && aiContent.chart.type === 'pie' && <PieChartComponent data={aiContent.chart.data} />}
                                {aiContent.actions && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {aiContent.actions.map((action, i) => (
                                            <button key={i} onClick={() => handleActionClick(action.prompt)} className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-focus transition-colors">
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {aiContent.form && activeForm?.messageIndex === index && (
                                    <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="mt-4 space-y-3 p-3 bg-base-100/50 rounded-lg">
                                        <p className="text-sm font-semibold text-base-content">Por favor, completa el formulario:</p>
                                        {activeForm.fields.map(field => (
                                            <div key={field.name}>
                                                <label htmlFor={field.name} className="block text-xs font-medium mb-1">{field.label}</label>
                                                {field.type === 'text' && <input type="text" id={field.name} name={field.name} value={formValues[field.name] || ''} onChange={handleFormInputChange} className="w-full text-sm input-style" required placeholder={field.placeholder || ''}/>}
                                                {field.type === 'select' && (
                                                    <select id={field.name} name={field.name} value={formValues[field.name] || ''} onChange={handleFormInputChange} className="w-full text-sm input-style" required>
                                                        <option value="" disabled>{field.placeholder || 'Selecciona...'}</option>
                                                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                )}
                                                {field.type === 'checkbox' && <input type="checkbox" id={field.name} name={field.name} checked={formValues[field.name] || false} onChange={handleFormInputChange} className="rounded text-primary focus:ring-primary"/>}
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
