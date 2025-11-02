import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import { Type } from "@google/genai";
import { useSupabase } from '../../contexts/SupabaseContext';
import { AuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAiService } from '../../contexts/AiServiceContext';
import { generateVisitReport } from '../../services/pdfGenerator';
import type { VisitReport, Company, Plant, Supervisor, Machine } from '../../types';
import { BackIcon, SaveIcon, ViewIcon, EyeOffIcon, SparklesIcon, UploadIcon, UserPlusIcon, SearchIcon, PlusIcon, TrashIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';
import ImageUpload from '../ui/ImageUpload';
import Modal from '../ui/Modal';
import CompanyForm from '../management/companies/CompanyForm';
import PlantForm from '../management/plants/PlantForm';
import SupervisorForm from '../management/supervisors/SupervisorForm';

interface ReportFormProps {
  reportId?: string | null;
  onBack: () => void;
}

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

const VisitReportForm: React.FC<ReportFormProps> = ({ reportId, onBack }) => {
    const { supabase } = useSupabase();
    const auth = useContext(AuthContext);
    const { logoUrl } = useTheme();
    const { service, geminiClient, openaiClient, isConfigured } = useAiService();

    const [formData, setFormData] = useState<Partial<VisitReport>>({ fecha: new Date().toISOString().split('T')[0] });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Relational Data
    const [companies, setCompanies] = useState<Company[]>([]);
    const [plants, setPlants] = useState<Plant[]>([]);
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [machines, setMachines] = useState<Machine[]>([]);
    
    // File states
    const [fotosObservaciones, setFotosObservaciones] = useState<File[]>([]);
    const [fotosSugerencias, setFotosSugerencias] = useState<File[]>([]);
    const [fotoFirma, setFotoFirma] = useState<File[]>([]);
    const [selectedMaquinas, setSelectedMaquinas] = useState<{ machine: Machine, observaciones: string }[]>([]);

    // UI States
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isSimulatorVisible, setIsSimulatorVisible] = useState(true);
    const [pdfPreviewUri, setPdfPreviewUri] = useState<string | null>(null);
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const debounceTimeout = useRef<number | null>(null);
    const [isPlantsLoading, setIsPlantsLoading] = useState(false);
    const [isSupervisorsLoading, setIsSupervisorsLoading] = useState(false);
    
    // AI States
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    // Autocomplete/Modal States
    const [companySearchText, setCompanySearchText] = useState('');
    const [plantSearchText, setPlantSearchText] = useState('');
    const [supervisorSearchText, setSupervisorSearchText] = useState('');
    const [machineSearch, setMachineSearch] = useState('');
    
    const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
    const [showPlantSuggestions, setShowPlantSuggestions] = useState(false);
    const [showSupervisorSuggestions, setShowSupervisorSuggestions] = useState(false);
    const [showMachineSuggestions, setShowMachineSuggestions] = useState(false);
    
    const [isNewCompanyModalOpen, setIsNewCompanyModalOpen] = useState(false);
    const [isCompanySearchModalOpen, setIsCompanySearchModalOpen] = useState(false);
    const [isNewPlantModalOpen, setIsNewPlantModalOpen] = useState(false);
    const [isPlantSearchModalOpen, setIsPlantSearchModalOpen] = useState(false);
    const [isNewSupervisorModalOpen, setIsNewSupervisorModalOpen] = useState(false);
    const [isSupervisorSearchModalOpen, setIsSupervisorSearchModalOpen] = useState(false);

    const fetchDropdownData = useCallback(async () => {
        if (!supabase) return { companies: [], plants: [], supervisors: [], machines: [] };
        try {
            const [companyRes, plantRes, supervisorRes, machineRes] = await Promise.all([
                supabase.from('Empresa').select('*'),
                supabase.from('Planta').select('*'),
                supabase.from('Encargado').select('*'),
                supabase.from('Maquinas').select('*'),
            ]);
            if (companyRes.error) throw companyRes.error;
            if (plantRes.error) throw plantRes.error;
            if (supervisorRes.error) throw supervisorRes.error;
            if (machineRes.error) throw machineRes.error;
            
            setCompanies(companyRes.data);
            setPlants(plantRes.data);
            setSupervisors(supervisorRes.data);
            setMachines(machineRes.data);
            return { companies: companyRes.data, plants: plantRes.data, supervisors: supervisorRes.data, machines: machineRes.data };
        } catch (error: any) {
             console.error("Error fetching dropdown data", error);
             return { companies: [], plants: [], supervisors: [], machines: [] };
        }
    }, [supabase]);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsDataLoading(true);
            const { companies, plants, supervisors, machines } = await fetchDropdownData();

            if (reportId && supabase) {
                const { data: reportData, error } = await supabase.from('Reporte_Visita').select('*').eq('id', reportId).single();
                if (error) {
                    console.error("Error fetching visit report for editing:", error);
                } else if (reportData) {
                    setFormData(reportData);
                    
                    if (reportData.maquinas && Array.isArray(reportData.maquinas)) {
                        const parsedMaquinas = reportData.maquinas.map(maquinaString => {
                            const [machinePart, ...obsParts] = maquinaString.split(': ');
                            const observaciones = obsParts.join(': ');
                            const serie = machinePart.split(' - ')[0];
                            const machine = machines.find(m => m.serie === serie);
                            if (machine) {
                                return { machine, observaciones };
                            }
                            return null;
                        }).filter((item): item is { machine: Machine; observaciones: string } => item !== null);
                        setSelectedMaquinas(parsedMaquinas);
                    }
                    
                    const company = companies.find(c => (c.nombre || '').toLowerCase() === (reportData.empresa || '').toLowerCase());
                    if (company) {
                        setCompanySearchText(company.nombre);
                        const plant = plants.find(p => p.id_empresa === company.id && (p.nombre || '').toLowerCase() === (reportData.planta || '').toLowerCase());
                        if(plant) {
                            setPlantSearchText(plant.nombre);
                             const supervisor = supervisors.find(s => 
                                (s.nombreEmpresa || '').toLowerCase() === (company.nombre || '').toLowerCase() && 
                                (s.nombrePlanta || '').toLowerCase() === (plant.nombre || '').toLowerCase() &&
                                `${s.nombre || ''} ${s.apellido || ''}`.trim().toLowerCase() === (reportData.nombre_encargado || '').toLowerCase()
                            );
                            if(supervisor) setSupervisorSearchText(`${supervisor.nombre} ${supervisor.apellido || ''}`);
                        }
                    }
                }
            }
            setIsDataLoading(false);
        };
        fetchInitialData();
    }, [supabase, reportId, fetchDropdownData]);

    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        
        setIsPdfLoading(true);
        debounceTimeout.current = window.setTimeout(async () => {
            try {
                const [fotosObservacionesBase64, fotosSugerenciasBase64, fotoFirmaBase64] = await Promise.all([
                    Promise.all(fotosObservaciones.map(fileToBase64)),
                    Promise.all(fotosSugerencias.map(fileToBase64)),
                    fotoFirma[0] ? fileToBase64(fotoFirma[0]) : Promise.resolve(undefined),
                ]);

                const enrichedData: VisitReport = {
                    ...formData,
                    selected_maquinas_pdf: selectedMaquinas.map(item => ({
                        machineLabel: `${item.machine.serie} - ${item.machine.modelo || ''} (${item.machine.marca || 'S/M'})`,
                        observations: item.observaciones,
                    })),
                    usuario: { nombres: auth?.user?.nombres || 'N/A' },
                    fotosObservacionesBase64,
                    fotosSugerenciasBase64,
                    fotoFirmaBase64,
                };
                const uri = await generateVisitReport(enrichedData, logoUrl, 'datauristring');
                setPdfPreviewUri(uri as string);
            } catch (e) {
                console.error("Error generating PDF preview:", e);
                setPdfPreviewUri(null);
            } finally {
                 setIsPdfLoading(false);
            }
        }, 500);
    }, [formData, selectedMaquinas, logoUrl, auth?.user, fotosObservaciones, fotosSugerencias, fotoFirma]);

    // Memoized lists for suggestions
    const companySuggestions = useMemo(() => companySearchText ? companies.filter(c => (c.nombre || '').toLowerCase().includes(companySearchText.toLowerCase())).slice(0, 5) : [], [companySearchText, companies]);
    const filteredPlants = useMemo(() => plants.filter(p => p.id_empresa === formData.form_id_empresa), [plants, formData.form_id_empresa]);
    const plantSuggestions = useMemo(() => plantSearchText ? filteredPlants.filter(p => (p.nombre || '').toLowerCase().includes(plantSearchText.toLowerCase())).slice(0, 5) : [], [plantSearchText, filteredPlants]);
    
    const filteredSupervisors = useMemo(() => {
        if (!formData.form_id_empresa || !formData.form_id_planta) return [];
        const company = companies.find(c => c.id === formData.form_id_empresa);
        const plant = plants.find(p => p.id === formData.form_id_planta);
        if (!company || !plant) return [];
        return supervisors.filter(s => (s.nombreEmpresa || '').toLowerCase() === (company.nombre || '').toLowerCase() && (s.nombrePlanta || '').toLowerCase() === (plant.nombre || '').toLowerCase());
    }, [formData.form_id_empresa, formData.form_id_planta, companies, plants, supervisors]);
    
    const supervisorSuggestions = useMemo(() => supervisorSearchText ? filteredSupervisors.filter(s => `${s.nombre || ''} ${s.apellido || ''}`.toLowerCase().includes(supervisorSearchText.toLowerCase())).slice(0, 5) : [], [supervisorSearchText, filteredSupervisors]);

    const availableMachinesForPlant = useMemo(() => {
        if (!formData.form_id_planta) return [];
        return machines.filter(m => m.id_planta === formData.form_id_planta);
    }, [machines, formData.form_id_planta]);

    const machineSuggestions = useMemo(() => {
        if (!machineSearch) return [];
        const selectedMachineIds = new Set(selectedMaquinas.map(m => m.machine.id));
        return availableMachinesForPlant.filter(m => 
            !selectedMachineIds.has(m.id) &&
            (m.serie.toLowerCase().includes(machineSearch.toLowerCase()) || 
             (m.modelo || '').toLowerCase().includes(machineSearch.toLowerCase()))
        ).slice(0, 5);
    }, [machineSearch, availableMachinesForPlant, selectedMaquinas]);


    // Handlers
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
    }, []);
    
    const handleSelectCompany = useCallback((company: Company) => {
        setIsPlantsLoading(true);
        setFormData(prev => ({
            ...prev,
            form_id_empresa: company.id,
            empresa: company.nombre,
            cliente: company.nombre,
            form_id_planta: undefined,
            planta: undefined,
            form_id_encargado: undefined,
            nombre_encargado: undefined,
            celular_encargado: undefined,
            email_encargado: undefined
        }));
        setCompanySearchText(company.nombre);
        setPlantSearchText('');
        setSupervisorSearchText('');
        setShowCompanySuggestions(false);
        setIsCompanySearchModalOpen(false);
        setTimeout(() => setIsPlantsLoading(false), 300);
    }, []);

    const handleSelectPlant = useCallback((plant: Plant) => {
        setIsSupervisorsLoading(true);
        setFormData(prev => ({
            ...prev,
            form_id_planta: plant.id,
            planta: plant.nombre,
            form_id_encargado: undefined,
            nombre_encargado: undefined,
            celular_encargado: undefined,
            email_encargado: undefined
        }));
        setPlantSearchText(plant.nombre);
        setSupervisorSearchText('');
        setShowPlantSuggestions(false);
        setIsPlantSearchModalOpen(false);
        setTimeout(() => setIsSupervisorsLoading(false), 300);
    }, []);

    const handleSelectSupervisor = useCallback((supervisor: Supervisor) => {
        setFormData(prev => ({
            ...prev,
            form_id_encargado: supervisor.id,
            nombre_encargado: `${supervisor.nombre} ${supervisor.apellido || ''}`.trim(),
            celular_encargado: supervisor.celular?.toString(),
            email_encargado: supervisor.email
        }));
        setSupervisorSearchText(`${supervisor.nombre} ${supervisor.apellido || ''}`.trim());
        setShowSupervisorSuggestions(false);
        setIsSupervisorSearchModalOpen(false);
    }, []);

    const handleCompanySaved = useCallback(async (newCompany: Company) => {
        await fetchDropdownData();
        handleSelectCompany(newCompany);
        setIsNewCompanyModalOpen(false);
    }, [fetchDropdownData, handleSelectCompany]);
    
    const handlePlantSaved = useCallback(async (newPlant: Plant) => {
        await fetchDropdownData();
        handleSelectPlant(newPlant);
        setIsNewPlantModalOpen(false);
    }, [fetchDropdownData, handleSelectPlant]);

    const handleSupervisorSaved = useCallback(async (newSupervisor: Supervisor) => {
        await fetchDropdownData();
        handleSelectSupervisor(newSupervisor);
        setIsNewSupervisorModalOpen(false);
    }, [fetchDropdownData, handleSelectSupervisor]);

    const handleAiFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        // AI logic remains the same
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (!supabase) return;

        const payload: Partial<VisitReport> = { 
            ...formData, 
             maquinas: selectedMaquinas.map(item => `${item.machine.serie} - ${item.machine.modelo || ''}: ${item.observaciones}`),
        };
        
        delete payload.form_id_empresa;
        delete payload.form_id_planta;
        delete payload.form_id_encargado;

        const request = reportId
            ? supabase.from('Reporte_Visita').update(payload).eq('id', reportId)
            : supabase.from('Reporte_Visita').insert(payload);

        const { error } = await request.select().single();
        
        setIsSubmitting(false);
        if (error) {
            alert("Error al guardar el reporte: " + error.message);
        } else {
            alert("¡Reporte de visita guardado exitosamente!");
            onBack();
        }
    };
    
    const selectedCompanyForNewSupervisor = useMemo(() => companies.find(c => c.id === formData.form_id_empresa), [formData.form_id_empresa, companies]);
    const selectedPlantForNewSupervisor = useMemo(() => plants.find(p => p.id === formData.form_id_planta), [formData.form_id_planta, plants]);

    if (isDataLoading) return <div className="flex justify-center items-center h-full"><Spinner /> Cargando datos...</div>

  return (
    <div className="flex h-full gap-4">
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
             <div className="flex items-center mb-6">
                <button onClick={onBack} className="p-2 mr-4 rounded-full hover:bg-base-300 transition"><BackIcon className="h-6 w-6" /></button>
                <h2 className="text-3xl font-bold">{reportId ? 'Editar Reporte de Visita' : 'Crear Reporte de Visita'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-base-200 p-6 rounded-xl shadow-lg">
                    <div className="flex items-start"><SparklesIcon className="h-8 w-8 text-primary mr-3 shrink-0"/><div><h3 className="font-bold text-lg text-primary">Autocompletado con IA</h3><p className="text-sm text-neutral">Sube una orden de trabajo (PDF/Imagen) para rellenar campos.</p></div></div>
                    <div className="mt-4">
                    <label htmlFor="ai-file-upload" className="relative cursor-pointer bg-base-200 rounded-md font-medium text-primary hover:text-primary-focus focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                        <div className="flex items-center justify-center w-full px-6 py-4 border-2 border-base-border border-dashed rounded-md"><UploadIcon className="h-8 w-8 text-neutral mr-3" /><span className="text-neutral">{fileName || "Haz clic para subir un documento"}</span></div>
                        <input id="ai-file-upload" name="ai-file-upload" type="file" className="sr-only" onChange={handleAiFileChange} accept="image/*,application/pdf" disabled={isAiLoading || !isConfigured(service)}/>
                    </label>
                    {isAiLoading && <div className="mt-2 flex items-center"><Spinner /><span className="ml-2">La IA está analizando tu documento...</span></div>}
                    {aiError && <p className="mt-2 text-sm text-error">{aiError}</p>}
                    </div>
                </div>
                
                <div className="bg-base-200 p-6 rounded-xl shadow-lg space-y-4">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Información General</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label htmlFor="fecha" className="block text-sm font-medium">Fecha</label><input type="date" name="fecha" value={formData.fecha || ''} onChange={handleChange} required className="mt-1 block w-full input-style" /></div>
                        <div className="grid grid-cols-2 gap-2">
                             <div><label htmlFor="hora_ingreso" className="block text-sm font-medium">Hora Ingreso</label><input type="time" name="hora_ingreso" value={formData.hora_ingreso || ''} onChange={handleChange} className="mt-1 block w-full input-style" /></div>
                            <div><label htmlFor="hora_salida" className="block text-sm font-medium">Hora Salida</label><input type="time" name="hora_salida" value={formData.hora_salida || ''} onChange={handleChange} className="mt-1 block w-full input-style" /></div>
                        </div>
                         {/* Empresa */}
                        <div>
                            <label htmlFor="company-search" className="block text-sm font-medium">Empresa</label>
                            <div onBlur={() => setTimeout(() => setShowCompanySuggestions(false), 100)}>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="relative flex-grow">
                                        <input id="company-search" type="text" value={companySearchText} onChange={(e) => setCompanySearchText(e.target.value)} onFocus={() => setShowCompanySuggestions(true)} placeholder="Escribir o buscar empresa..." className="w-full input-style" autoComplete="off" />
                                        {showCompanySuggestions && companySuggestions.length > 0 && (
                                            <ul className="absolute z-20 w-full bg-base-200 border border-base-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg custom-scrollbar">
                                                {companySuggestions.map(c => <li key={c.id} onMouseDown={() => handleSelectCompany(c)} className="px-3 py-2 cursor-pointer hover:bg-base-300">{c.nombre}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => setIsNewCompanyModalOpen(true)} className="p-2.5 rounded-md hover:bg-base-300 transition" title="Crear Nueva Empresa"><UserPlusIcon className="h-5 w-5"/></button>
                                    <button type="button" onClick={() => setIsCompanySearchModalOpen(true)} className="p-2.5 rounded-md hover:bg-base-300 transition" title="Buscar Empresa"><SearchIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        </div>
                        {/* Planta */}
                        <div>
                            <label htmlFor="plant-search" className="block text-sm font-medium flex items-center gap-2">Planta / Sede {isPlantsLoading && <Spinner />}</label>
                            <div onBlur={() => setTimeout(() => setShowPlantSuggestions(false), 100)}>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="relative flex-grow">
                                        <input id="plant-search" type="text" value={plantSearchText} onChange={(e) => setPlantSearchText(e.target.value)} onFocus={() => setShowPlantSuggestions(true)} disabled={!formData.form_id_empresa} placeholder="Seleccionar Planta" className="w-full input-style" autoComplete="off" />
                                        {showPlantSuggestions && plantSuggestions.length > 0 && (
                                            <ul className="absolute z-20 w-full bg-base-200 border border-base-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg custom-scrollbar">
                                                {plantSuggestions.map(p => <li key={p.id} onMouseDown={() => handleSelectPlant(p)} className="px-3 py-2 cursor-pointer hover:bg-base-300">{p.nombre}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => setIsNewPlantModalOpen(true)} disabled={!formData.form_id_empresa} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50" title="Crear Nueva Planta"><PlusIcon className="h-5 w-5"/></button>
                                    <button type="button" onClick={() => setIsPlantSearchModalOpen(true)} disabled={!formData.form_id_empresa} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50" title="Buscar Planta"><SearchIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-base-200 p-6 rounded-xl shadow-lg space-y-4">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Información de Contactos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {/* Encargado */}
                        <div>
                            <label htmlFor="supervisor-search" className="block text-sm font-medium flex items-center gap-2">Encargado de Planta {isSupervisorsLoading && <Spinner />}</label>
                            <div onBlur={() => setTimeout(() => setShowSupervisorSuggestions(false), 100)}>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="relative flex-grow">
                                        <input id="supervisor-search" type="text" value={supervisorSearchText} onChange={(e) => setSupervisorSearchText(e.target.value)} onFocus={() => setShowSupervisorSuggestions(true)} disabled={!formData.form_id_planta} placeholder="Escribir o buscar encargado..." className="w-full input-style" autoComplete="off" />
                                        {showSupervisorSuggestions && supervisorSuggestions.length > 0 && (
                                            <ul className="absolute z-10 w-full bg-base-200 border border-base-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg custom-scrollbar">
                                                {supervisorSuggestions.map(s => <li key={s.id} onMouseDown={() => handleSelectSupervisor(s)} className="p-3 cursor-pointer hover:bg-base-300">{s.nombre} {s.apellido}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => setIsNewSupervisorModalOpen(true)} disabled={!formData.form_id_planta} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50" title="Crear Nuevo Encargado"><UserPlusIcon className="h-5 w-5"/></button>
                                    <button type="button" onClick={() => setIsSupervisorSearchModalOpen(true)} disabled={!formData.form_id_planta} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50" title="Buscar Encargado"><SearchIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        </div>
                        <div><label className="block text-sm font-medium text-neutral">Datos del Encargado</label><input type="text" value={`Cel: ${formData.celular_encargado || 'N/A'} | Email: ${formData.email_encargado || 'N/A'}`} disabled className="mt-1 block w-full input-style bg-base-300"/></div>
                        <div><label htmlFor="nombre_operador" className="block text-sm font-medium">Nombre Operador</label><input type="text" name="nombre_operador" value={formData.nombre_operador || ''} onChange={handleChange} className="mt-1 block w-full input-style" /></div>
                        <div><label htmlFor="celular_operador" className="block text-sm font-medium">Celular Operador</label><input type="text" name="celular_operador" value={formData.celular_operador || ''} onChange={handleChange} className="mt-1 block w-full input-style" /></div>
                    </div>
                </div>

                <div className="bg-base-200 p-6 rounded-xl shadow-lg space-y-4">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Detalles Técnicos</h3>
                    <div>
                        <label className="block text-sm font-medium">Checklist Técnico</label>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {['voltaje_establecido', 'presurizacion', 'transformador'].map(field => (
                                <div key={field} className="flex items-center">
                                    <input id={field} name={field} type="checkbox" checked={!!(formData as any)[field]} onChange={handleChange} className="h-4 w-4 text-primary focus:ring-primary border-base-border rounded" />
                                    <label htmlFor={field} className="ml-2 block text-sm capitalize">{field.replace(/_/g, ' ')}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="machine-search" className="block text-sm font-medium">Máquinas Atendidas</label>
                        <div onBlur={() => setTimeout(() => setShowMachineSuggestions(false), 100)}>
                            <div className="relative mt-1">
                                <input 
                                    id="machine-search"
                                    type="text"
                                    value={machineSearch}
                                    onChange={e => setMachineSearch(e.target.value)}
                                    onFocus={() => setShowMachineSuggestions(true)}
                                    placeholder="Buscar máquina por serie o modelo para añadir..."
                                    className="w-full input-style"
                                    disabled={!formData.form_id_planta}
                                />
                                {showMachineSuggestions && machineSuggestions.length > 0 && (
                                    <ul className="absolute z-20 w-full bg-base-200 border border-base-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg custom-scrollbar">
                                        {machineSuggestions.map(machine => (
                                            <li 
                                                key={machine.id} 
                                                onMouseDown={() => {
                                                    setSelectedMaquinas(prev => [...prev, { machine, observaciones: '' }]);
                                                    setMachineSearch('');
                                                }}
                                                className="px-3 py-2 cursor-pointer hover:bg-base-300"
                                            >
                                                {machine.serie} - {machine.modelo}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                        
                        <div className="mt-4 space-y-4">
                            {selectedMaquinas.map((item, index) => (
                                <div key={item.machine.id} className="p-3 bg-base-100 rounded-lg border border-base-border">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{item.machine.serie} - {item.machine.modelo}</p>
                                            <p className="text-xs text-neutral">{item.machine.marca}</p>
                                        </div>
                                        <button type="button" onClick={() => setSelectedMaquinas(prev => prev.filter((_, i) => i !== index))} className="text-error hover:text-error/80 p-1">
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <textarea
                                        placeholder="Añadir observaciones para esta máquina..."
                                        value={item.observaciones}
                                        onChange={e => {
                                            const newObs = e.target.value;
                                            setSelectedMaquinas(prev => prev.map((m, i) => i === index ? { ...m, observaciones: newObs } : m));
                                        }}
                                        className="mt-2 block w-full input-style text-sm"
                                        rows={2}
                                    />
                                </div>
                            ))}
                            {selectedMaquinas.length === 0 && (
                                <p className="text-sm text-neutral text-center py-4">No se han añadido máquinas.</p>
                            )}
                        </div>
                    </div>
                    <div><label htmlFor="sugerencias" className="block text-sm font-medium">Sugerencias</label><textarea name="sugerencias" rows={3} value={formData.sugerencias || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea><ImageUpload id="fotos-sugerencias" label="" files={fotosSugerencias} onFilesChange={setFotosSugerencias} /></div>
                    <div><ImageUpload id="fotos-observaciones" label="Fotos Generales / Observaciones" files={fotosObservaciones} onFilesChange={setFotosObservaciones} /></div>
                </div>
                
                 <div className="bg-base-200 p-6 rounded-xl shadow-lg">
                     <h3 className="text-xl font-semibold border-b border-base-border pb-2">Conformidad del Cliente</h3>
                     <p className="text-sm mt-2 text-neutral">La firma corresponde al Encargado de Planta seleccionado.</p>
                     <ImageUpload id="foto-firma" label="Firma de Conformidad" files={fotoFirma} onFilesChange={setFotoFirma} multiple={false} />
                </div>

                <div className="flex justify-end items-center pt-4 gap-4">
                    <button type="button" onClick={onBack} className="bg-base-300 py-2 px-4 rounded-lg hover:bg-neutral/20 transition-colors">Cancelar</button>
                    <button type="submit" disabled={isSubmitting} className="bg-primary text-white py-2 px-6 rounded-lg hover:bg-primary-focus transition-colors disabled:bg-primary/50 flex items-center gap-2">
                        {isSubmitting && <Spinner />}
                        <SaveIcon className="h-5 w-5" />
                        {isSubmitting ? 'Guardando...' : 'Guardar Reporte'}
                    </button>
                </div>
            </form>
        </div>

        <div className={`relative transition-all duration-300 ease-in-out ${isSimulatorVisible ? 'w-1/2' : 'w-12'}`}>
            <div className="sticky top-0 h-full flex flex-col bg-base-300/50 rounded-lg shadow-inner">
                <div className="flex-shrink-0 p-2 bg-base-200 rounded-t-lg border-b border-base-border">
                     <button onClick={() => setIsSimulatorVisible(!isSimulatorVisible)} className="p-2 rounded-full hover:bg-base-300" title={isSimulatorVisible ? "Ocultar Previsualización" : "Mostrar Previsualización"}>
                        {isSimulatorVisible ? <EyeOffIcon className="h-5 w-5" /> : <ViewIcon className="h-5 w-5" />}
                    </button>
                </div>
                
                {isSimulatorVisible && (
                    <div className="flex-grow p-2 relative">
                        {isPdfLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10"><Spinner/></div>}
                        {pdfPreviewUri ? (
                             <iframe src={pdfPreviewUri} title="PDF Preview" className="w-full h-full border-0 rounded-b-lg"/>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral">
                                <p>La previsualización aparecerá aquí.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Modals */}
        <Modal isOpen={isNewCompanyModalOpen} onClose={() => setIsNewCompanyModalOpen(false)} title="Añadir Nueva Empresa"><CompanyForm company={null} onSave={handleCompanySaved} onCancel={() => setIsNewCompanyModalOpen(false)}/></Modal>
        <Modal isOpen={isCompanySearchModalOpen} onClose={() => setIsCompanySearchModalOpen(false)} title="Buscar Empresa"><ul className="max-h-80 overflow-y-auto divide-y divide-base-border custom-scrollbar">{companies.map(c => <li key={c.id} onClick={() => handleSelectCompany(c)} className="p-3 cursor-pointer hover:bg-base-300">{c.nombre}</li>)}</ul></Modal>
        
        <Modal isOpen={isNewPlantModalOpen} onClose={() => setIsNewPlantModalOpen(false)} title="Añadir Nueva Planta"><PlantForm plant={null} onSave={handlePlantSaved} onCancel={() => setIsNewPlantModalOpen(false)}/></Modal>
        <Modal isOpen={isPlantSearchModalOpen} onClose={() => setIsPlantSearchModalOpen(false)} title="Buscar Planta"><ul className="max-h-80 overflow-y-auto divide-y divide-base-border custom-scrollbar">{filteredPlants.map(p => <li key={p.id} onClick={() => handleSelectPlant(p)} className="p-3 cursor-pointer hover:bg-base-300">{p.nombre}</li>)}</ul></Modal>

        <Modal isOpen={isNewSupervisorModalOpen} onClose={() => setIsNewSupervisorModalOpen(false)} title="Añadir Nuevo Encargado"><SupervisorForm supervisor={null} onSave={handleSupervisorSaved} onCancel={() => setIsNewSupervisorModalOpen(false)} defaultCompanyName={selectedCompanyForNewSupervisor?.nombre} defaultPlantName={selectedPlantForNewSupervisor?.nombre} /></Modal>
        <Modal isOpen={isSupervisorSearchModalOpen} onClose={() => setIsSupervisorSearchModalOpen(false)} title="Buscar Encargado"><ul className="max-h-80 overflow-y-auto divide-y divide-base-border custom-scrollbar">{filteredSupervisors.map(s => <li key={s.id} onClick={() => handleSelectSupervisor(s)} className="p-3 cursor-pointer hover:bg-base-300">{s.nombre} {s.apellido}</li>)}</ul></Modal>
    </div>
  );
};

export default VisitReportForm;