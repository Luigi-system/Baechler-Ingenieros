import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { UploadIcon, SparklesIcon, BackIcon, ImageIcon, CameraIcon, XIcon, UserPlusIcon, SearchIcon, PlusIcon, DownloadIcon, ViewIcon, EyeOffIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';
import Modal from '../ui/Modal';
import CompanyForm from '../management/companies/CompanyForm';
import MachineForm from '../management/machines/MachineForm';
import PlantForm from '../management/plants/PlantForm';
import SupervisorForm from '../management/supervisors/SupervisorForm';
import { useSupabase } from '../../contexts/SupabaseContext';
import { AuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { generateServiceReport } from '../../services/pdfGenerator';
import type { ServiceReport, Company, Plant, Machine, Supervisor } from '../../types';

interface ReportFormProps {
  reportId?: string | null;
  onBack: () => void;
}

// Helper: Reusable Image Upload Component
const ImageUpload: React.FC<{ id: string; label: string; files: File[]; onFilesChange: (files: File[]) => void; multiple?: boolean; }> = ({ id, label, files, onFilesChange, multiple = true }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            onFilesChange(multiple ? [...files, ...newFiles] : newFiles);
        }
    };
    const removeFile = (index: number) => {
        onFilesChange(files.filter((_, i) => i !== index));
    };
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <div className="flex items-center gap-4">
                <label htmlFor={id} className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-primary hover:text-primary-dark p-2 border border-gray-300 dark:border-gray-600">
                    <div className="flex items-center gap-2 px-2">
                        <ImageIcon className="h-5 w-5" />
                        <span>{multiple ? 'Añadir Fotos' : 'Subir Foto'}</span>
                    </div>
                    <input id={id} name={id} type="file" className="sr-only" onChange={handleFileChange} accept="image/*" multiple={multiple} />
                </label>
                 <div className="flex flex-wrap gap-2">
                    {files.map((file, index) => (
                        <div key={index} className="relative">
                            <img src={URL.createObjectURL(file)} alt="preview" className="h-16 w-16 rounded-md object-cover" />
                            <button onClick={() => removeFile(index)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><XIcon className="h-3 w-3" /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Main Form Component
const ReportForm: React.FC<ReportFormProps> = ({ reportId, onBack }) => {
    const { supabase } = useSupabase();
    const auth = useContext(AuthContext);
    const { logoUrl } = useTheme();

    const [formData, setFormData] = useState<Partial<ServiceReport>>({ fecha: new Date().toISOString().split('T')[0], estado: false });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    
    // Relational Data
    const [companies, setCompanies] = useState<Company[]>([]);
    const [plants, setPlants] = useState<Plant[]>([]);
    const [machines, setMachines] = useState<Machine[]>([]);
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    
    // File states
    const [fotosProblemas, setFotosProblemas] = useState<File[]>([]);
    const [fotosAcciones, setFotosAcciones] = useState<File[]>([]);
    const [fotosObservaciones, setFotosObservaciones] = useState<File[]>([]);
    const [fotoFirma, setFotoFirma] = useState<File[]>([]);

    // UI States
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [aiError, setAiError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isPlantsLoading, setIsPlantsLoading] = useState(false);
    const [isMachinesAndSupervisorsLoading, setIsMachinesAndSupervisorsLoading] = useState(false);

    // Simulator States
    const [isSimulatorVisible, setIsSimulatorVisible] = useState(true);
    const [pdfPreviewUri, setPdfPreviewUri] = useState<string | null>(null);
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const debounceTimeout = useRef<number | null>(null);

    // Autocomplete/Modal States
    const [companySearchText, setCompanySearchText] = useState('');
    const [plantSearchText, setPlantSearchText] = useState('');
    const [machineSearchText, setMachineSearchText] = useState('');
    const [supervisorSearchText, setSupervisorSearchText] = useState('');
    
    const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
    const [showPlantSuggestions, setShowPlantSuggestions] = useState(false);
    const [showMachineSuggestions, setShowMachineSuggestions] = useState(false);
    const [showSupervisorSuggestions, setShowSupervisorSuggestions] = useState(false);
    
    const [isNewCompanyModalOpen, setIsNewCompanyModalOpen] = useState(false);
    const [isCompanySearchModalOpen, setIsCompanySearchModalOpen] = useState(false);
    const [isNewPlantModalOpen, setIsNewPlantModalOpen] = useState(false);
    const [isPlantSearchModalOpen, setIsPlantSearchModalOpen] = useState(false);
    const [isNewMachineModalOpen, setIsNewMachineModalOpen] = useState(false);
    const [isMachineSearchModalOpen, setIsMachineSearchModalOpen] = useState(false);
    const [isNewSupervisorModalOpen, setIsNewSupervisorModalOpen] = useState(false);
    const [isSupervisorSearchModalOpen, setIsSupervisorSearchModalOpen] = useState(false);
    
    const fetchDropdownData = useCallback(async () => {
        if (!supabase) return { companies: [], plants: [], machines: [], supervisors: [] };
        try {
            const [companyRes, plantRes, machineRes, supervisorRes] = await Promise.all([
                supabase.from('Empresa').select('*'),
                supabase.from('Planta').select('*'),
                supabase.from('Maquinas').select('*'),
                supabase.from('Encargado').select('*'),
            ]);
            if (companyRes.error) throw companyRes.error;
            if (plantRes.error) throw plantRes.error;
            if (machineRes.error) throw machineRes.error;
            if (supervisorRes.error) throw supervisorRes.error;
            
            setCompanies(companyRes.data);
            setPlants(plantRes.data);
            setMachines(machineRes.data);
            setSupervisors(supervisorRes.data);
            return { companies: companyRes.data, plants: plantRes.data, machines: machineRes.data, supervisors: supervisorRes.data };
        } catch (error: any) {
             console.error("Error fetching dropdown data", error);
             return { companies: [], plants: [], machines: [], supervisors: [] };
        }
    }, [supabase]);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!supabase) return;
            setIsDataLoading(true);

            const { companies, plants, machines, supervisors } = await fetchDropdownData();

            if (reportId) {
                const { data: reportData, error } = await supabase
                    .from('Reporte_Servicio')
                    .select('*')
                    .eq('id', reportId)
                    .single();

                if (error) {
                    console.error("Error fetching report for editing:", error);
                    alert("No se pudo cargar el reporte para editar.");
                } else if (reportData) {
                    const matchingPlant = plants.find(p => 
                        p.id_empresa === reportData.id_empresa && 
                        p.nombre === reportData.nombre_planta
                    );
                    
                    const formDataToSet: Partial<ServiceReport> = { ...reportData, id_planta: matchingPlant?.id };

                    if (reportData.operativo) formDataToSet.estado_maquina = 'operativo';
                    else if (reportData.inoperativo) formDataToSet.estado_maquina = 'inoperativo';
                    else if (reportData.en_prueba) formDataToSet.estado_maquina = 'en_prueba';
                    
                    if (reportData.con_garantia) formDataToSet.estado_garantia = 'con_garantia';
                    else if (reportData.sin_garantia) formDataToSet.estado_garantia = 'sin_garantia';

                    if (reportData.facturado) formDataToSet.estado_facturacion = 'facturado';
                    else if (reportData.no_facturado) formDataToSet.estado_facturacion = 'no_facturado';
                    
                    formDataToSet.nombre_firmante = reportData.nombre_usuario;
                    formDataToSet.celular_firmante = reportData.celular_usuario;

                    setFormData(formDataToSet);

                    const company = companies.find(c => c.id === reportData.id_empresa);
                    if (company) setCompanySearchText(company.nombre);
                    if (matchingPlant) setPlantSearchText(matchingPlant.nombre);
                    if (reportData.serie_maquina) setMachineSearchText(reportData.serie_maquina);
                    const supervisor = supervisors.find(s => s.id === reportData.id_encargado);
                    if (supervisor) setSupervisorSearchText(`${supervisor.nombre} ${supervisor.apellido || ''}`);
                }
            }
            setIsDataLoading(false);
        };
        fetchInitialData();
    }, [supabase, reportId, fetchDropdownData]);
    
    // PDF Preview Generation (Debounced)
    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        
        setIsPdfLoading(true);
        debounceTimeout.current = window.setTimeout(async () => {
            try {
                const enrichedData: ServiceReport = {
                    ...formData,
                    empresa: companies.find(c => c.id === formData.id_empresa) ?? null,
                    encargado: supervisors.find(s => s.id === formData.id_encargado) ?? null,
                    usuario: { nombres: auth?.user?.nombres ?? 'N/A' }
                };
                const uri = await generateServiceReport(enrichedData, logoUrl, 'datauristring');
                setPdfPreviewUri(uri as string);
            } catch (e) {
                console.error("Error generating PDF preview:", e);
                setPdfPreviewUri(null); // Clear preview on error
            } finally {
                 setIsPdfLoading(false);
            }
        }, 500);
    }, [formData, companies, supervisors, logoUrl, auth?.user]);


    // Memoized lists for dependent dropdowns and suggestions
    const filteredPlants = useMemo(() => plants.filter(p => p.id_empresa === formData.id_empresa), [plants, formData.id_empresa]);
    const filteredMachines = useMemo(() => machines.filter(m => m.id_planta === formData.id_planta), [machines, formData.id_planta]);
    const filteredSupervisors = useMemo(() => supervisors.filter(s => s.id_planta === formData.id_planta), [supervisors, formData.id_planta]);
    
    const companySuggestions = useMemo(() => companySearchText ? companies.filter(c => (c.nombre || '').toLowerCase().includes(companySearchText.toLowerCase())).slice(0, 5) : [], [companySearchText, companies]);
    const plantSuggestions = useMemo(() => plantSearchText ? filteredPlants.filter(p => (p.nombre || '').toLowerCase().includes(plantSearchText.toLowerCase())).slice(0, 5) : [], [plantSearchText, filteredPlants]);
    const machineSuggestions = useMemo(() => machineSearchText ? filteredMachines.filter(m => (m.serie || '').toLowerCase().includes(machineSearchText.toLowerCase())).slice(0, 5) : [], [machineSearchText, filteredMachines]);
    const supervisorSuggestions = useMemo(() => supervisorSearchText ? filteredSupervisors.filter(s => `${s.nombre || ''} ${s.apellido || ''}`.toLowerCase().includes(supervisorSearchText.toLowerCase())).slice(0, 5) : [], [supervisorSearchText, filteredSupervisors]);

    // Handlers
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
             setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    }, []);
    
    const handleRadioChange = useCallback((name: string, value: string) => setFormData(prev => ({...prev, [name]: value})), []);

    const handleSelectCompany = useCallback((company: Company) => {
        setIsPlantsLoading(true);
        setFormData(prev => ({ ...prev, id_empresa: company.id, id_planta: undefined, serie_maquina: undefined, modelo_maquina: undefined, marca_maquina: undefined, linea_maquina: undefined, id_encargado: undefined }));
        setCompanySearchText(company.nombre);
        setPlantSearchText(''); setMachineSearchText(''); setSupervisorSearchText('');
        setShowCompanySuggestions(false);
        setIsCompanySearchModalOpen(false);
        setTimeout(() => setIsPlantsLoading(false), 300);
    }, []);
    
    const handleSelectPlant = useCallback((plant: Plant) => {
        setIsMachinesAndSupervisorsLoading(true);
        setFormData(prev => ({...prev, id_planta: plant.id, serie_maquina: undefined, modelo_maquina: undefined, marca_maquina: undefined, linea_maquina: undefined, id_encargado: undefined }));
        setPlantSearchText(plant.nombre);
        setMachineSearchText(''); setSupervisorSearchText('');
        setShowPlantSuggestions(false);
        setIsPlantSearchModalOpen(false);
        setTimeout(() => setIsMachinesAndSupervisorsLoading(false), 300);
    }, []);
    
    const handleSelectMachine = useCallback((machine: Machine) => {
        setFormData(prev => ({ ...prev, serie_maquina: machine.serie, modelo_maquina: machine.modelo, marca_maquina: machine.marca, linea_maquina: machine.linea }));
        setMachineSearchText(machine.serie);
        setShowMachineSuggestions(false);
        setIsMachineSearchModalOpen(false);
    }, []);

    const handleSelectSupervisor = useCallback((supervisor: Supervisor) => {
        setFormData(prev => ({ ...prev, id_encargado: supervisor.id }));
        setSupervisorSearchText(`${supervisor.nombre} ${supervisor.apellido || ''}`);
        setShowSupervisorSuggestions(false);
        setIsSupervisorSearchModalOpen(false);
    }, []);

    const handleCompanySaved = useCallback(async (newCompany: Company) => {
        await fetchDropdownData(); handleSelectCompany(newCompany); setIsNewCompanyModalOpen(false);
    }, [fetchDropdownData, handleSelectCompany]);
    
    const handlePlantSaved = useCallback(async (newPlant: Plant) => {
        await fetchDropdownData(); handleSelectPlant(newPlant); setIsNewPlantModalOpen(false);
    }, [fetchDropdownData, handleSelectPlant]);

    const handleMachineSaved = useCallback(async (newMachine: Machine) => {
        await fetchDropdownData(); handleSelectMachine(newMachine); setIsNewMachineModalOpen(false);
    }, [fetchDropdownData, handleSelectMachine]);

    const handleSupervisorSaved = useCallback(async (newSupervisor: Supervisor) => {
        await fetchDropdownData(); handleSelectSupervisor(newSupervisor); setIsNewSupervisorModalOpen(false);
    }, [fetchDropdownData, handleSelectSupervisor]);

    const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });

    const handleAiFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsAiLoading(true);
        setAiError(null);
        try {
            const base64Data = await fileToBase64(file);
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ parts: [ { inlineData: { mimeType: file.type, data: base64Data } }, { text: "Del documento adjunto, extrae la siguiente información: codigo_reporte, fecha (YYYY-MM-DD), entrada (HH:MM), salida (HH:MM), nombre_empresa, serie_maquina, modelo_maquina, problemas_encontrados, acciones_realizadas, observaciones. Proporciona la salida en formato JSON." } ] }],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            codigo_reporte: { type: Type.STRING },
                            fecha: { type: Type.STRING },
                            entrada: { type: Type.STRING },
                            salida: { type: Type.STRING },
                            nombre_empresa: { type: Type.STRING },
                            serie_maquina: { type: Type.STRING },
                            modelo_maquina: { type: Type.STRING },
                            problemas_encontrados: { type: Type.STRING },
                            acciones_realizadas: { type: Type.STRING },
                            observaciones: { type: Type.STRING },
                        }
                    }
                },
            });
            const parsed = JSON.parse(response.text);
            
            if (parsed.nombre_empresa) {
                const companyNameToFind = parsed.nombre_empresa.toLowerCase();
                const foundCompany = companies.find(c => (c.nombre || '').toLowerCase().includes(companyNameToFind));
                if (foundCompany) handleSelectCompany(foundCompany);
            }
            if (parsed.serie_maquina) {
                const machineSerieToFind = parsed.serie_maquina.toLowerCase();
                const foundMachine = machines.find(m => (m.serie || '').toLowerCase() === machineSerieToFind);
                if(foundMachine) {
                    const company = companies.find(c => c.id === foundMachine.id_empresa);
                    if(company) handleSelectCompany(company);
                    setTimeout(() => { // Wait for state updates
                        const plant = plants.find(p => p.id === foundMachine.id_planta);
                        if (plant) handleSelectPlant(plant);
                        setTimeout(() => handleSelectMachine(foundMachine), 350);
                    }, 350);
                }
            }
            
            delete parsed.nombre_empresa;
            setFormData(prev => ({ ...prev, ...parsed }));

        } catch (e) {
            console.error(e);
            setAiError("Error al procesar el documento con IA. Por favor, inténtalo de nuevo.");
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (!supabase || !auth?.user) return;
        
        const selectedPlant = plants.find(p => p.id === formData.id_planta);
        const payload: { [key: string]: any } = { 
            ...formData, 
            id_usuario: auth.user.id, 
            nombre_planta: selectedPlant?.nombre, 
            operativo: formData.estado_maquina === 'operativo', 
            inoperativo: formData.estado_maquina === 'inoperativo', 
            en_prueba: formData.estado_maquina === 'en_prueba', 
            con_garantia: formData.estado_garantia === 'con_garantia', 
            sin_garantia: formData.estado_garantia === 'sin_garantia', 
            facturado: formData.estado_facturacion === 'facturado', 
            no_facturado: formData.estado_facturacion === 'no_facturado', 
            nombre_usuario: formData.nombre_firmante, 
            celular_usuario: formData.celular_firmante,
            estado: formData.estado ?? false,
        };
        
        delete payload.estado_maquina; 
        delete payload.estado_garantia; 
        delete payload.estado_facturacion; 
        delete payload.nombre_firmante; 
        delete payload.celular_firmante;
        delete payload.id_planta;

        const { error } = reportId ? await supabase.from('Reporte_Servicio').update(payload).eq('id', reportId) : await supabase.from('Reporte_Servicio').insert(payload);
        
        setIsSubmitting(false);
        if (error) {
            alert("Error al guardar el reporte: " + error.message);
        } else {
            alert("¡Reporte guardado exitosamente!");
            onBack();
        }
    };

    const handleDownloadPDF = async () => {
        if (!supabase || !reportId) {
            alert("Guarde el reporte primero para poder descargarlo.");
            return;
        }
        setIsDownloadingPdf(true);
        try {
            const { data, error } = await supabase
                .from('Reporte_Servicio')
                .select('*, empresa:Empresa(*), encargado:Encargado(*), usuario:Usuarios(nombres)')
                .eq('id', reportId)
                .single();
            
            if (error) throw error;
            await generateServiceReport(data as ServiceReport, logoUrl, 'save');
        } catch (err: any) {
            console.error("Error generating PDF from form:", err);
            alert(`No se pudo generar el PDF: ${err.message}`);
        } finally {
            setIsDownloadingPdf(false);
        }
    };
    
    if (isDataLoading) return <div className="flex justify-center items-center h-full"><Spinner /> Cargando datos...</div>

  return (
    <div className="flex h-full gap-4">
        {/* Form Section */}
        <div className="flex-1 overflow-y-auto pr-2">
            <div className="flex items-center mb-6">
                <button onClick={onBack} className="p-2 mr-4 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"><BackIcon className="h-6 w-6" /></button>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{reportId ? `Editar Reporte` : 'Crear Reporte'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <div className="flex items-start"><SparklesIcon className="h-8 w-8 text-primary mr-3 shrink-0"/><div><h3 className="font-bold text-lg text-primary">Autocompletado con IA</h3><p className="text-sm text-gray-600 dark:text-gray-300">Sube una orden de trabajo para rellenar campos automáticamente.</p></div></div>
                    <div className="mt-4">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                        <div className="flex items-center justify-center w-full px-6 py-4 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md"><UploadIcon className="h-8 w-8 text-gray-400 mr-3" /><span className="text-gray-600 dark:text-gray-300">{fileName || "Haz clic para subir un documento"}</span></div>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleAiFileChange} accept="image/*,application/pdf" disabled={isAiLoading}/>
                    </label>
                    {isAiLoading && <div className="mt-2 flex items-center"><Spinner /><span className="ml-2">La IA está analizando tu documento...</span></div>}
                    {aiError && <p className="mt-2 text-sm text-red-600">{aiError}</p>}
                    </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-6">
                    <h3 className="text-xl font-semibold border-b border-gray-200 dark:border-gray-700 pb-2">Información General</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div><label htmlFor="codigo_reporte" className="block text-sm font-medium">Código Reporte</label><input type="text" name="codigo_reporte" value={formData.codigo_reporte || ''} onChange={handleChange} className="mt-1 block w-full input-style" /></div>
                        <div><label htmlFor="fecha" className="block text-sm font-medium">Fecha</label><input type="date" name="fecha" value={formData.fecha || ''} onChange={handleChange} required className="mt-1 block w-full input-style" /></div>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label htmlFor="entrada" className="block text-sm font-medium">Hora Entrada</label><input type="time" name="entrada" value={formData.entrada || ''} onChange={handleChange} className="mt-1 block w-full input-style" /></div>
                            <div><label htmlFor="salida" className="block text-sm font-medium">Hora Salida</label><input type="time" name="salida" value={formData.salida || ''} onChange={handleChange} className="mt-1 block w-full input-style" /></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-6">
                    <h3 className="text-xl font-semibold border-b border-gray-200 dark:border-gray-700 pb-2">Cliente y Equipo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Empresa */}
                        <div>
                            <label htmlFor="company-search" className="block text-sm font-medium">Empresa</label>
                            <div onBlur={() => setTimeout(() => setShowCompanySuggestions(false), 100)}>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="relative flex-grow">
                                        <input id="company-search" type="text" value={companySearchText} onChange={(e) => setCompanySearchText(e.target.value)} onFocus={() => setShowCompanySuggestions(true)} placeholder="Escribir o buscar empresa..." className="w-full input-style" autoComplete="off" />
                                        {showCompanySuggestions && companySuggestions.length > 0 && (
                                            <ul className="absolute z-20 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                                {companySuggestions.map(c => <li key={c.id} onMouseDown={() => handleSelectCompany(c)} className="px-3 py-2 cursor-pointer hover:bg-primary/10">{c.nombre}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => setIsNewCompanyModalOpen(true)} className="p-2.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition" title="Crear Nueva Empresa"><UserPlusIcon className="h-5 w-5 text-gray-600 dark:text-gray-300"/></button>
                                    <button type="button" onClick={() => setIsCompanySearchModalOpen(true)} className="p-2.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition" title="Buscar Empresa"><SearchIcon className="h-5 w-5 text-gray-600 dark:text-gray-300"/></button>
                                </div>
                            </div>
                        </div>
                        {/* Planta */}
                        <div>
                            <label htmlFor="plant-search" className="block text-sm font-medium flex items-center gap-2">Planta / Sede {isPlantsLoading && <Spinner />}</label>
                            <div onBlur={() => setTimeout(() => setShowPlantSuggestions(false), 100)}>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="relative flex-grow">
                                        <input id="plant-search" type="text" value={plantSearchText} onChange={(e) => setPlantSearchText(e.target.value)} onFocus={() => setShowPlantSuggestions(true)} disabled={!formData.id_empresa} placeholder="Seleccionar Planta" className="w-full input-style" autoComplete="off" />
                                        {showPlantSuggestions && plantSuggestions.length > 0 && (
                                            <ul className="absolute z-20 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                                {plantSuggestions.map(p => <li key={p.id} onMouseDown={() => handleSelectPlant(p)} className="px-3 py-2 cursor-pointer hover:bg-primary/10">{p.nombre}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => setIsNewPlantModalOpen(true)} disabled={!formData.id_empresa} className="p-2.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50" title="Crear Nueva Planta"><PlusIcon className="h-5 w-5 text-gray-600 dark:text-gray-300"/></button>
                                    <button type="button" onClick={() => setIsPlantSearchModalOpen(true)} disabled={!formData.id_empresa} className="p-2.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50" title="Buscar Planta"><SearchIcon className="h-5 w-5 text-gray-600 dark:text-gray-300"/></button>
                                </div>
                            </div>
                        </div>
                        {/* Maquina */}
                        <div>
                            <label htmlFor="machine-search" className="block text-sm font-medium flex items-center gap-2">Máquina (N° Serie) {isMachinesAndSupervisorsLoading && <Spinner />}</label>
                            <div onBlur={() => setTimeout(() => setShowMachineSuggestions(false), 100)}>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="relative flex-grow">
                                        <input id="machine-search" type="text" value={machineSearchText} onChange={(e) => setMachineSearchText(e.target.value)} onFocus={() => setShowMachineSuggestions(true)} disabled={!formData.id_planta} placeholder="Escribir o buscar N° Serie..." className="w-full input-style" autoComplete="off" />
                                        {showMachineSuggestions && machineSuggestions.length > 0 && (
                                            <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                                {machineSuggestions.map(m => <li key={m.id} onMouseDown={() => handleSelectMachine(m)} className="px-3 py-2 cursor-pointer hover:bg-primary/10">{m.serie}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => setIsNewMachineModalOpen(true)} disabled={!formData.id_planta} className="p-2.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50" title="Crear Nueva Máquina"><PlusIcon className="h-5 w-5 text-gray-600 dark:text-gray-300"/></button>
                                    <button type="button" onClick={() => setIsMachineSearchModalOpen(true)} disabled={!formData.id_planta} className="p-2.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50" title="Buscar Máquina"><SearchIcon className="h-5 w-5 text-gray-600 dark:text-gray-300"/></button>
                                </div>
                            </div>
                        </div>
                        {/* Encargado */}
                        <div>
                            <label htmlFor="supervisor-search" className="block text-sm font-medium flex items-center gap-2">Encargado de Planta {isMachinesAndSupervisorsLoading && <Spinner />}</label>
                            <div onBlur={() => setTimeout(() => setShowSupervisorSuggestions(false), 100)}>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="relative flex-grow">
                                        <input id="supervisor-search" type="text" value={supervisorSearchText} onChange={(e) => setSupervisorSearchText(e.target.value)} onFocus={() => setShowSupervisorSuggestions(true)} disabled={!formData.id_planta} placeholder="Escribir o buscar encargado..." className="w-full input-style" autoComplete="off" />
                                        {showSupervisorSuggestions && supervisorSuggestions.length > 0 && (
                                            <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                                {supervisorSuggestions.map(s => <li key={s.id} onMouseDown={() => handleSelectSupervisor(s)} className="px-3 py-2 cursor-pointer hover:bg-primary/10">{s.nombre} {s.apellido}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => setIsNewSupervisorModalOpen(true)} disabled={!formData.id_planta} className="p-2.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50" title="Crear Nuevo Encargado"><UserPlusIcon className="h-5 w-5 text-gray-600 dark:text-gray-300"/></button>
                                    <button type="button" onClick={() => setIsSupervisorSearchModalOpen(true)} disabled={!formData.id_planta} className="p-2.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50" title="Buscar Encargado"><SearchIcon className="h-5 w-5 text-gray-600 dark:text-gray-300"/></button>
                                </div>
                            </div>
                        </div>
                        <input type="text" readOnly value={`Modelo: ${formData.modelo_maquina || 'N/A'}`} className="mt-1 block w-full input-style bg-gray-100 dark:bg-gray-700/50" />
                        <input type="text" readOnly value={`Marca: ${formData.marca_maquina || 'N/A'}`} className="mt-1 block w-full input-style bg-gray-100 dark:bg-gray-700/50" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-6">
                    <h3 className="text-xl font-semibold border-b border-gray-200 dark:border-gray-700 pb-2">Detalles del Servicio</h3>
                    <div><label htmlFor="problemas_encontrados" className="block text-sm font-medium">Problemas Encontrados</label><textarea name="problemas_encontrados" rows={4} value={formData.problemas_encontrados || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea><ImageUpload id="fotos-problemas" label="" files={fotosProblemas} onFilesChange={setFotosProblemas} /></div>
                    <div><label htmlFor="acciones_realizadas" className="block text-sm font-medium">Acciones Realizadas</label><textarea name="acciones_realizadas" rows={4} value={formData.acciones_realizadas || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea><ImageUpload id="fotos-acciones" label="" files={fotosAcciones} onFilesChange={setFotosAcciones} /></div>
                    <div><label htmlFor="observaciones" className="block text-sm font-medium">Observaciones</label><textarea name="observaciones" rows={3} value={formData.observaciones || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea><ImageUpload id="fotos-observaciones" label="" files={fotosObservaciones} onFilesChange={setFotosObservaciones} /></div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-6">
                    <h3 className="text-xl font-semibold border-b border-gray-200 dark:border-gray-700 pb-2">Estado Final</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <fieldset><legend className="text-sm font-medium">Estado de la Máquina</legend><div className="mt-2 space-y-2">{['operativo', 'inoperativo', 'en_prueba'].map(opt => (<div key={opt} className="flex items-center"><input id={`maq_${opt}`} name="estado_maquina" type="radio" value={opt} checked={formData.estado_maquina === opt} onChange={() => handleRadioChange('estado_maquina', opt)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300" /><label htmlFor={`maq_${opt}`} className="ml-3 block text-sm capitalize">{opt.replace('_', ' ')}</label></div>))}</div></fieldset>
                        <fieldset><legend className="text-sm font-medium">Garantía</legend><div className="mt-2 space-y-2">{['con_garantia', 'sin_garantia'].map(opt => (<div key={opt} className="flex items-center"><input id={`gar_${opt}`} name="estado_garantia" type="radio" value={opt} checked={formData.estado_garantia === opt} onChange={() => handleRadioChange('estado_garantia', opt)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300" /><label htmlFor={`gar_${opt}`} className="ml-3 block text-sm capitalize">{opt.replace('_', ' ')}</label></div>))}</div></fieldset>
                        <fieldset><legend className="text-sm font-medium">Facturación</legend><div className="mt-2 space-y-2">{['facturado', 'no_facturado'].map(opt => (<div key={opt} className="flex items-center"><input id={`fac_${opt}`} name="estado_facturacion" type="radio" value={opt} checked={formData.estado_facturacion === opt} onChange={() => handleRadioChange('estado_facturacion', opt)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300" /><label htmlFor={`fac_${opt}`} className="ml-3 block text-sm capitalize">{opt.replace('_', ' ')}</label></div>))}</div></fieldset>
                        <fieldset><legend className="text-sm font-medium">Estado del Reporte</legend><div className="mt-2 space-y-2"><div className="flex items-center"><input id="estado" name="estado" type="checkbox" checked={!!formData.estado} onChange={handleChange} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" /><label htmlFor="estado" className="ml-3 block text-sm">Finalizado</label></div></div></fieldset>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-6">
                    <h3 className="text-xl font-semibold border-b border-gray-200 dark:border-gray-700 pb-2">Conformidad del Cliente</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label htmlFor="nombre_firmante" className="block text-sm font-medium">Nombre del Receptor</label><input type="text" name="nombre_firmante" value={formData.nombre_firmante || ''} onChange={handleChange} className="mt-1 block w-full input-style" /></div>
                        <div><label htmlFor="celular_firmante" className="block text-sm font-medium">Celular del Receptor</label><input type="text" name="celular_firmante" value={formData.celular_firmante || ''} onChange={handleChange} className="mt-1 block w-full input-style" /></div>
                        <div className="md:col-span-2"><ImageUpload id="foto-firma" label="Firma de Conformidad" files={fotoFirma} onFilesChange={setFotoFirma} multiple={false} /></div>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                    <div>
                        {reportId && (
                            <button type="button" onClick={handleDownloadPDF} disabled={isDownloadingPdf} className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-600/50 flex items-center gap-2">
                                {isDownloadingPdf ? <Spinner /> : <DownloadIcon className="h-5 w-5"/>}
                                {isDownloadingPdf ? 'Generando...' : 'Descargar PDF'}
                            </button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={onBack} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="bg-primary text-white py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-primary/50 flex items-center gap-2">{isSubmitting && <Spinner />}{isSubmitting ? 'Guardando...' : 'Guardar Reporte'}</button>
                    </div>
                </div>
            </form>
        </div>
        
        {/* Simulator Section */}
        <div className={`relative transition-all duration-300 ease-in-out ${isSimulatorVisible ? 'w-1/2' : 'w-12'}`}>
            <div className="sticky top-0 h-full flex flex-col bg-gray-200 dark:bg-gray-900 rounded-lg shadow-inner">
                 <div className="flex-shrink-0 p-2 bg-white dark:bg-gray-800 rounded-t-lg border-b border-gray-300 dark:border-gray-700">
                     <button onClick={() => setIsSimulatorVisible(!isSimulatorVisible)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title={isSimulatorVisible ? "Ocultar Previsualización" : "Mostrar Previsualización"}>
                        {isSimulatorVisible ? <EyeOffIcon className="h-5 w-5" /> : <ViewIcon className="h-5 w-5" />}
                    </button>
                </div>
                {isSimulatorVisible && (
                    <div className="flex-grow p-2 relative">
                        {isPdfLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10"><Spinner/></div>}
                        {pdfPreviewUri ? (
                             <iframe src={pdfPreviewUri} title="PDF Preview" className="w-full h-full border-0 rounded-b-lg"/>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                <p>La previsualización aparecerá aquí.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      
      {/* Modals */}
      <Modal isOpen={isNewCompanyModalOpen} onClose={() => setIsNewCompanyModalOpen(false)} title="Añadir Nueva Empresa"><CompanyForm company={null} onSave={handleCompanySaved} onCancel={() => setIsNewCompanyModalOpen(false)}/></Modal>
      <Modal isOpen={isCompanySearchModalOpen} onClose={() => setIsCompanySearchModalOpen(false)} title="Buscar Empresa"><ul className="max-h-80 overflow-y-auto divide-y dark:divide-gray-600">{companies.map(c => <li key={c.id} onClick={() => handleSelectCompany(c)} className="p-3 cursor-pointer hover:bg-primary/10">{c.nombre}</li>)}</ul></Modal>
      
      <Modal isOpen={isNewPlantModalOpen} onClose={() => setIsNewPlantModalOpen(false)} title="Añadir Nueva Planta"><PlantForm plant={null} onSave={handlePlantSaved} onCancel={() => setIsNewPlantModalOpen(false)}/></Modal>
      <Modal isOpen={isPlantSearchModalOpen} onClose={() => setIsPlantSearchModalOpen(false)} title="Buscar Planta"><ul className="max-h-80 overflow-y-auto divide-y dark:divide-gray-600">{filteredPlants.map(p => <li key={p.id} onClick={() => handleSelectPlant(p)} className="p-3 cursor-pointer hover:bg-primary/10">{p.nombre}</li>)}</ul></Modal>
      
      <Modal isOpen={isNewMachineModalOpen} onClose={() => setIsNewMachineModalOpen(false)} title="Añadir Nueva Máquina"><MachineForm machine={null} onSave={handleMachineSaved} onCancel={() => setIsNewMachineModalOpen(false)}/></Modal>
      <Modal isOpen={isMachineSearchModalOpen} onClose={() => setIsMachineSearchModalOpen(false)} title="Buscar Máquina"><ul className="max-h-80 overflow-y-auto divide-y dark:divide-gray-600">{filteredMachines.map(m => <li key={m.id} onClick={() => handleSelectMachine(m)} className="p-3 cursor-pointer hover:bg-primary/10">{m.serie} - {m.modelo}</li>)}</ul></Modal>

      <Modal isOpen={isNewSupervisorModalOpen} onClose={() => setIsNewSupervisorModalOpen(false)} title="Añadir Nuevo Encargado"><SupervisorForm supervisor={null} onSave={handleSupervisorSaved} onCancel={() => setIsNewSupervisorModalOpen(false)}/></Modal>
      <Modal isOpen={isSupervisorSearchModalOpen} onClose={() => setIsSupervisorSearchModalOpen(false)} title="Buscar Encargado"><ul className="max-h-80 overflow-y-auto divide-y dark:divide-gray-600">{filteredSupervisors.map(s => <li key={s.id} onClick={() => handleSelectSupervisor(s)} className="p-3 cursor-pointer hover:bg-primary/10">{s.nombre} {s.apellido}</li>)}</ul></Modal>
    </div>
  );
};

export default ReportForm;