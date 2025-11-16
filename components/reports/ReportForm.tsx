

import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import { Type } from "@google/genai";
import { UploadIcon, SparklesIcon, BackIcon, UserPlusIcon, SearchIcon, PlusIcon, DownloadIcon, ViewIcon, EyeOffIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';
import Modal from '../ui/Modal';
import CompanyForm from '../management/companies/CompanyForm';
import MachineForm from '../management/machines/MachineForm';
import PlantForm from '../management/plants/PlantForm';
import SupervisorForm from '../management/supervisors/SupervisorForm';
import ImageUpload from '../ui/ImageUpload'; // Import the new reusable component
import { useSupabase } from '../../contexts/SupabaseContext';
import { AuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAiService } from '../../contexts/AiServiceContext';
import { generateServiceReport } from '../../services/pdfGenerator';
import type { ServiceReport, Company, Plant, Machine, Supervisor } from '../../types';

interface ReportFormProps {
  reportId?: string | null;
  onBack: () => void;
}

// Internal state for managing selections that are no longer stored as IDs in the DB
interface FormInternalState {
    selectedCompanyId?: number;
    selectedPlantId?: number;
    selectedSupervisorId?: number;
}


const fileToPngDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    // Ensure file is an image before processing
    if (!file.type.startsWith('image/')) {
        return reject(new Error('El archivo no es una imagen.'));
    }
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('No se pudo obtener el contexto del canvas'));
            }
            ctx.drawImage(img, 0, 0);
            // Returns a data URI, e.g., "data:image/png;base64,..."
            resolve(canvas.toDataURL('image/png')); 
        };
        img.onerror = (err) => reject(new Error('La imagen no se pudo cargar.'));
        if (event.target?.result) {
            img.src = event.target.result as string;
        } else {
            reject(new Error('El resultado de la lectura del archivo está vacío.'));
        }
    };
    reader.onerror = (err) => reject(new Error('El archivo no se pudo leer.'));
    reader.readAsDataURL(file);
});


const stripDataUriPrefix = (dataUri: string) => dataUri.split('base64,')[1];

// Helper function to robustly create a data URL
const toDataURL = (b64OrDataURL: string): string => {
    if (b64OrDataURL.startsWith('data:image')) {
        return b64OrDataURL; // It's already a data URL, return as is.
    }
    // Smart-prefixing for raw base64 strings. JPEG base64 often starts with /9j/.
    const prefix = b64OrDataURL.startsWith('/9j/') ? 'data:image/jpeg;base64,' : 'data:image/png;base64,';
    return prefix + b64OrDataURL;
};

// Main Form Component
const ReportForm: React.FC<ReportFormProps> = ({ reportId, onBack }) => {
    const { supabase } = useSupabase();
    const auth = useContext(AuthContext);
    const { logoUrl } = useTheme();
    const { autocompleteService, geminiClient, openaiClient, isAutocompleteServiceConfigured } = useAiService();

    const [formData, setFormData] = useState<Partial<ServiceReport>>({ fecha: new Date().toISOString().split('T')[0], estado: false });
    const [formInternalState, setFormInternalState] = useState<FormInternalState>({});
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
                    const company = companies.find(c => c.nombre === reportData.empresa_nombre);
                    const plant = company ? plants.find(p => p.id_empresa === company.id && p.nombre === reportData.enpresa_planta) : undefined;
                    const supervisor = (company && plant) ? supervisors.find(s => s.nombreEmpresa === company.nombre && s.nombrePlanta === plant.nombre && `${s.nombre} ${s.apellido || ''}`.trim() === reportData.encargado_nombre) : undefined;

                    setFormInternalState({
                        selectedCompanyId: company?.id,
                        selectedPlantId: plant?.id,
                        selectedSupervisorId: supervisor?.id,
                    });
                    
                    const formDataToSet: Partial<ServiceReport> = { ...reportData };

                    formDataToSet.foto_problemas_encontrados = (reportData.foto_problemas_encontrados || []).filter(Boolean).map(toDataURL);
                    formDataToSet.foto_acciones_realizadas = (reportData.foto_acciones_realizadas || []).filter(Boolean).map(toDataURL);
                    formDataToSet.foto_firma = reportData.foto_firma ? toDataURL(reportData.foto_firma) : null;


                    if (reportData.operatio) formDataToSet.estado_maquina = 'operativo';
                    else if (reportData.en_prueba) formDataToSet.estado_maquina = 'en_prueba';
                    else formDataToSet.estado_maquina = 'inoperativo';
                    
                    if (reportData.garantia) formDataToSet.estado_garantia = 'con_garantia';
                    else if (reportData.garantia === false) formDataToSet.estado_garantia = 'sin_garantia';

                    if (reportData.facturado) formDataToSet.estado_facturacion = 'facturado';
                    else if (reportData.facturado === false) formDataToSet.estado_facturacion = 'no_facturado';
                    
                    setFormData(formDataToSet);

                    if (reportData.empresa_nombre) setCompanySearchText(reportData.empresa_nombre);
                    if (reportData.enpresa_planta) setPlantSearchText(reportData.enpresa_planta);
                    if (reportData.maquina_seria) setMachineSearchText(reportData.maquina_seria);
                    if (reportData.encargado_nombre) setSupervisorSearchText(reportData.encargado_nombre);
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
                // Convert new files to base64 data URIs for the PDF generator
                const [
                    newFotosProblemasBase64,
                    newFotosAccionesBase64,
                    newFotoFirmaBase64,
                ] = await Promise.all([
                    Promise.all(fotosProblemas.map(fileToPngDataUrl)),
                    Promise.all(fotosAcciones.map(fileToPngDataUrl)),
                    fotoFirma[0] ? fileToPngDataUrl(fotoFirma[0]) : Promise.resolve(undefined),
                ]);

                // Combine existing data URIs with new ones
                const enrichedData: ServiceReport = {
                    ...formData,
                    usuario_nombre: auth?.user?.nombres ?? 'N/A',
                    fotosProblemasBase64: [...(formData.foto_problemas_encontrados || []), ...newFotosProblemasBase64],
                    fotosAccionesBase64: [...(formData.foto_acciones_realizadas || []), ...newFotosAccionesBase64],
                    fotoFirmaBase64: newFotoFirmaBase64 || formData.foto_firma || undefined,
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
    }, [formData, logoUrl, auth?.user, fotosProblemas, fotosAcciones, fotoFirma]);


    // Memoized lists for dependent dropdowns and suggestions
    const filteredPlants = useMemo(() => plants.filter(p => p.id_empresa === formInternalState.selectedCompanyId), [plants, formInternalState.selectedCompanyId]);
    const filteredMachines = useMemo(() => machines.filter(m => m.id_planta === formInternalState.selectedPlantId), [machines, formInternalState.selectedPlantId]);
    
    const filteredSupervisors = useMemo(() => {
        if (!formInternalState.selectedCompanyId || !formInternalState.selectedPlantId) return [];
        const selectedCompany = companies.find(c => c.id === formInternalState.selectedCompanyId);
        const selectedPlant = plants.find(p => p.id === formInternalState.selectedPlantId);
        if (!selectedCompany || !selectedPlant) return [];

        return supervisors.filter(s =>
            s.nombreEmpresa === selectedCompany.nombre &&
            s.nombrePlanta === selectedPlant.nombre
        );
    }, [formInternalState, companies, plants, supervisors]);
    
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
        setFormInternalState(prev => ({...prev, selectedCompanyId: company.id, selectedPlantId: undefined, selectedSupervisorId: undefined}));
        setFormData(prev => ({ ...prev, empresa_nombre: company.nombre, enpresa_planta: undefined, maquina_seria: undefined, maquina_modelo: undefined, maquina_marca: undefined, maquina_linea: undefined, encargado_nombre: undefined, encargado_cel: undefined }));
        setCompanySearchText(company.nombre);
        setPlantSearchText(''); setMachineSearchText(''); setSupervisorSearchText('');
        setShowCompanySuggestions(false);
        setIsCompanySearchModalOpen(false);
        setTimeout(() => setIsPlantsLoading(false), 300);
    }, []);
    
    const handleSelectPlant = useCallback((plant: Plant) => {
        setIsMachinesAndSupervisorsLoading(true);
        setFormInternalState(prev => ({...prev, selectedPlantId: plant.id, selectedSupervisorId: undefined}));
        setFormData(prev => ({...prev, enpresa_planta: plant.nombre, maquina_seria: undefined, maquina_modelo: undefined, maquina_marca: undefined, maquina_linea: undefined, encargado_nombre: undefined, encargado_cel: undefined }));
        setPlantSearchText(plant.nombre);
        setMachineSearchText(''); setSupervisorSearchText('');
        setShowPlantSuggestions(false);
        setIsPlantSearchModalOpen(false);
        setTimeout(() => setIsMachinesAndSupervisorsLoading(false), 300);
    }, []);
    
    const handleSelectMachine = useCallback((machine: Machine) => {
        setFormData(prev => ({ ...prev, maquina_seria: machine.serie, maquina_modelo: machine.modelo, maquina_marca: machine.marca, maquina_linea: machine.linea }));
        setMachineSearchText(machine.serie);
        setShowMachineSuggestions(false);
        setIsMachineSearchModalOpen(false);
    }, []);

    const handleSelectSupervisor = useCallback((supervisor: Supervisor) => {
        setFormInternalState(prev => ({...prev, selectedSupervisorId: supervisor.id}));
        setFormData(prev => ({ ...prev, encargado_nombre: `${supervisor.nombre} ${supervisor.apellido || ''}`, encargado_cel: supervisor.celular?.toString() }));
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

    const handleRemoveExistingImage = (field: 'foto_problemas_encontrados' | 'foto_acciones_realizadas', index: number) => {
        setFormData(prev => {
            const currentImages = prev[field] as (string | null)[];
            if (!Array.isArray(currentImages)) return prev;
            const updatedImages = [...currentImages];
            updatedImages.splice(index, 1);
            return { ...prev, [field]: updatedImages };
        });
    };

    const handleAiFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsAiLoading(true);
        setAiError(null);

        if (!isAutocompleteServiceConfigured()) {
            setAiError(`El servicio de IA para autocompletado (${autocompleteService}) no está configurado. Por favor, asegúrate de que la clave API esté configurada en la sección de Servicios Autocompletado.`);
            setIsAiLoading(false);
            return;
        }

        try {
            const base64Data = await fileToPngDataUrl(file);
            const textPrompt = 'Del documento adjunto, extrae la siguiente información: codigo, fecha (YYYY-MM-DD), hora_entrada (HH:MM), hora_salida (HH:MM), empresa_nombre (que es lo mismo que "cliente"), enpresa_planta (que es la ubicación del servicio), maquina_seria (que puede aparecer como "equipo" o "marca"), maquina_modelo, encargado_nombre (que puede aparecer como "responsable"), problemas_encontraados, acciones_realizadas, observaciones. Proporciona la salida en formato JSON.';
            
            let parsed: any;

            if (autocompleteService === 'gemini' && geminiClient) {
                 const response = await geminiClient.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: [{ parts: [ { inlineData: { mimeType: 'image/png', data: base64Data.split(',')[1] } }, { text: textPrompt } ] }],
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                codigo: { type: Type.STRING },
                                fecha: { type: Type.STRING },
                                hora_entrada: { type: Type.STRING },
                                hora_salida: { type: Type.STRING },
                                empresa_nombre: { type: Type.STRING },
                                enpresa_planta: { type: Type.STRING },
                                maquina_seria: { type: Type.STRING },
                                maquina_modelo: { type: Type.STRING },
                                encargado_nombre: { type: Type.STRING },
                                problemas_encontraados: { type: Type.STRING },
                                acciones_realizadas: { type: Type.STRING },
                                observaciones: { type: Type.STRING },
                            }
                        }
                    },
                });
                parsed = JSON.parse(response.text);
            } else if (autocompleteService === 'openai' && openaiClient) {
                const response = await openaiClient.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: textPrompt },
                                { 
                                    type: "image_url",
                                    image_url: {
                                        url: base64Data, // Full data URI with prefix
                                        detail: "low"
                                    }
                                }
                            ]
                        }
                    ],
                    response_format: { type: "json_object" }
                });
                const content = response.choices[0]?.message?.content;
                if (!content) throw new Error("OpenAI returned an empty response.");
                parsed = JSON.parse(content);
            } else {
                 throw new Error(`Servicio de IA desconocido o no configurado para autocompletado: ${autocompleteService}`);
            }
            
            const processAiData = async (parsedData: any) => {
                const { 
                    empresa_nombre, 
                    enpresa_planta, 
                    maquina_seria,
                    maquina_modelo, 
                    encargado_nombre, 
                    ...restOfData 
                } = parsedData;

                setFormData(prev => ({ ...prev, ...restOfData }));

                if (maquina_seria) {
                    const machineSerieToFind = maquina_seria.toLowerCase();
                    const foundMachine = machines.find(m => (m.serie || '').toLowerCase().includes(machineSerieToFind));
                    if (foundMachine) {
                        const company = companies.find(c => c.id === foundMachine.id_empresa);
                        if (company) {
                            handleSelectCompany(company);
                            await new Promise(r => setTimeout(r, 400));
                            
                            const plantObj = plants.find(p => p.id === foundMachine.id_planta);
                            if (plantObj) {
                                handleSelectPlant(plantObj);
                                await new Promise(r => setTimeout(r, 400));
                                
                                handleSelectMachine(foundMachine);
                                
                                if (encargado_nombre) {
                                    const supervisorToFind = encargado_nombre.toLowerCase();
                                    const foundSupervisor = supervisors.find(s => 
                                        s.nombreEmpresa === company.nombre &&
                                        s.nombrePlanta === plantObj.nombre &&
                                        `${s.nombre} ${s.apellido || ''}`.toLowerCase().includes(supervisorToFind)
                                    );
                                    if(foundSupervisor) handleSelectSupervisor(foundSupervisor);
                                }
                            }
                        }
                        return;
                    }
                }

                if (empresa_nombre) {
                    const companyToFind = empresa_nombre.toLowerCase();
                    const foundCompany = companies.find(c => (c.nombre || '').toLowerCase().includes(companyToFind));
                    if (foundCompany) {
                        handleSelectCompany(foundCompany);
                        await new Promise(r => setTimeout(r, 400));

                        if (enpresa_planta) {
                            const plantToFind = enpresa_planta.toLowerCase();
                            const foundPlant = plants.find(p => p.id_empresa === foundCompany.id && (p.nombre || '').toLowerCase().includes(plantToFind));
                            if (foundPlant) {
                                handleSelectPlant(foundPlant);
                                await new Promise(r => setTimeout(r, 400));

                                if (encargado_nombre) {
                                    const supervisorToFind = encargado_nombre.toLowerCase();
                                    const foundSupervisor = supervisors.find(s => 
                                        s.nombreEmpresa === foundCompany.nombre &&
                                        s.nombrePlanta === foundPlant.nombre &&
                                        `${s.nombre} ${s.apellido || ''}`.toLowerCase().includes(supervisorToFind)
                                    );
                                    if(foundSupervisor) handleSelectSupervisor(foundSupervisor);
                                }
                            }
                        }
                    }
                }
            };
            
            await processAiData(parsed);

        } catch (e: any) {
            console.error(e);
            setAiError(`Error al procesar con ${autocompleteService}: ${e.message || "Por favor, inténtalo de nuevo."}`);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (!supabase || !auth?.user) {
            setIsSubmitting(false);
            return;
        }

        try {
            const convertFilesToBase64 = async (files: File[]): Promise<string[]> => {
                if (files.length === 0) return [];
                const base64Promises = files.map(file => fileToPngDataUrl(file).then(stripDataUriPrefix));
                return Promise.all(base64Promises);
            };

            const [
                newProblemasB64,
                newAccionesB64,
            ] = await Promise.all([
                convertFilesToBase64(fotosProblemas),
                convertFilesToBase64(fotosAcciones),
            ]);
            
            const newFirmaB64 = fotoFirma.length > 0 
                ? await fileToPngDataUrl(fotoFirma[0]).then(stripDataUriPrefix) 
                : null;

            const getExistingBase64 = (dataUris: (string | null)[] | undefined) => {
                if (!dataUris) return [];
                return dataUris.filter((uri): uri is string => !!uri).map(stripDataUriPrefix);
            };
            
            // Create a comprehensive data object for the PDF generator
            const pdfDataObject: ServiceReport = {
                ...formData,
                usuario_nombre: auth.user.nombres ?? 'N/A',
                fotosProblemasBase64: [
                    ...(formData.foto_problemas_encontrados?.filter(Boolean) as string[] || []),
                    ...(await Promise.all(fotosProblemas.map(fileToPngDataUrl)))
                ],
                fotosAccionesBase64: [
                    ...(formData.foto_acciones_realizadas?.filter(Boolean) as string[] || []),
                    ...(await Promise.all(fotosAcciones.map(fileToPngDataUrl)))
                ],
                fotoFirmaBase64: fotoFirma[0] ? await fileToPngDataUrl(fotoFirma[0]) : formData.foto_firma || undefined,
            };

            const pdfDataUri = await generateServiceReport(pdfDataObject, logoUrl, 'datauristring');
            const pdfBase64 = pdfDataUri && (pdfDataUri as string).includes('base64,')
                ? (pdfDataUri as string).split('base64,')[1]
                : null;

            const finalPayload: { [key: string]: any } = {
                id: formData.id,
                codigo: formData.codigo,
                fecha: formData.fecha,
                hora_entrada: formData.hora_entrada,
                hora_salida: formData.hora_salida,
                empresa_nombre: formData.empresa_nombre,
                enpresa_planta: formData.enpresa_planta,
                encargado_nombre: formData.encargado_nombre,
                encargado_cel: formData.encargado_cel,
                maquina_seria: formData.maquina_seria,
                maquina_modelo: formData.maquina_modelo,
                maquina_marca: formData.maquina_marca,
                maquina_linea: formData.maquina_linea,
                problemas_encontraados: formData.problemas_encontraados,
                acciones_realizadas: formData.acciones_realizadas,
                observaciones: formData.observaciones,
                control_interno: formData.control_interno,
                operatio: formData.estado_maquina === 'operativo',
                en_prueba: formData.estado_maquina === 'en_prueba',
                garantia: formData.estado_garantia === 'con_garantia',
                facturado: formData.estado_facturacion === 'facturado',
                estado: formData.estado ?? false,
                usuario_nombre: auth.user.nombres,
                usuario_cel: auth.user.celular?.toString(),
                
                foto_problemas_encontrados: [...getExistingBase64(formData.foto_problemas_encontrados), ...newProblemasB64],
                foto_acciones_realizadas: [...getExistingBase64(formData.foto_acciones_realizadas), ...newAccionesB64],
                foto_firma: newFirmaB64 || (formData.foto_firma ? stripDataUriPrefix(formData.foto_firma) : null),
                pdf: pdfBase64,
            };

            Object.keys(finalPayload).forEach(key => (finalPayload[key] === undefined) && delete finalPayload[key]);
            if (formData.id === undefined) {
                delete finalPayload.id;
            }
    
            const { error } = await supabase.from('Reporte_Servicio').upsert(finalPayload);
    
            if (error) throw error;
            
            setIsSubmitting(false);
            alert("¡Reporte guardado exitosamente!");
            onBack();
    
        } catch (error: any) {
            setIsSubmitting(false);
            alert("Error al guardar el reporte: " + error.message);
            console.error("Submit error:", error);
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
                .select('*')
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
    
    const selectedCompanyForNewSupervisor = useMemo(() => companies.find(c => c.id === formInternalState.selectedCompanyId), [formInternalState.selectedCompanyId, companies]);
    const selectedPlantForNewSupervisor = useMemo(() => plants.find(p => p.id === formInternalState.selectedPlantId), [formInternalState.selectedPlantId, plants]);

    if (isDataLoading) return <div className="flex justify-center items-center h-full"><Spinner /> Cargando datos...</div>

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4">
        {/* Form Section */}
        <div className="w-full lg:flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex items-center mb-6">
                <button onClick={onBack} className="p-2 mr-4 rounded-full hover:bg-base-300 transition"><BackIcon className="h-6 w-6" /></button>
                <h2 className="text-3xl font-bold">{reportId ? `Editar Reporte` : 'Crear Reporte'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg">
                    <div className="flex items-start"><SparklesIcon className="h-8 w-8 text-primary mr-3 shrink-0"/><div><h3 className="font-bold text-lg text-primary">Autocompletado con IA</h3><p className="text-sm text-neutral">Sube una orden de trabajo para rellenar campos automáticamente.</p></div></div>
                    <div className="mt-4">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-base-200 rounded-md font-medium text-primary hover:text-primary-focus focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                        <div className="flex items-center justify-center w-full px-6 py-4 border-2 border-base-border border-dashed rounded-md"><UploadIcon className="h-8 w-8 text-neutral mr-3" /><span className="text-neutral">{fileName || "Haz clic para subir un documento"}</span></div>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleAiFileChange} accept="image/*,application/pdf" disabled={isAiLoading || !isAutocompleteServiceConfigured()}/>
                    </label>
                    {isAiLoading && <div className="mt-2 flex items-center"><Spinner /><span className="ml-2">La IA está analizando tu documento...</span></div>}
                    {aiError && <p className="mt-2 text-sm text-error">{aiError}</p>}
                    </div>
                </div>
                
                <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg space-y-6">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Información General</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div><label htmlFor="codigo" className="block text-sm font-medium">Código Reporte</label><input type="text" name="codigo" value={formData.codigo || ''} onChange={handleChange} className="mt-1 block w-full input-style" /></div>
                        <div><label htmlFor="fecha" className="block text-sm font-medium">Fecha</label><input type="date" name="fecha" value={formData.fecha || ''} onChange={handleChange} className="mt-1 block w-full input-style" /></div>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label htmlFor="hora_entrada" className="block text-sm font-medium">Hora Entrada</label><input type="time" name="hora_entrada" value={formData.hora_entrada || ''} onChange={handleChange} className="mt-1 block w-full input-style" /></div>
                            <div><label htmlFor="hora_salida" className="block text-sm font-medium">Hora Salida</label><input type="time" name="hora_salida" value={formData.hora_salida || ''} onChange={handleChange} className="mt-1 block w-full input-style" /></div>
                        </div>
                    </div>
                </div>

                <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg space-y-6">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Cliente y Equipo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                        <input id="plant-search" type="text" value={plantSearchText} onChange={(e) => { setPlantSearchText(e.target.value); setFormData(prev => ({...prev, enpresa_planta: e.target.value })) }} onFocus={() => setShowPlantSuggestions(true)} disabled={!formInternalState.selectedCompanyId} placeholder="Escribir o seleccionar Planta..." className="w-full input-style" autoComplete="off" />
                                        {showPlantSuggestions && plantSuggestions.length > 0 && (
                                            <ul className="absolute z-20 w-full bg-base-200 border border-base-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg custom-scrollbar">
                                                {plantSuggestions.map(p => <li key={p.id} onMouseDown={() => handleSelectPlant(p)} className="px-3 py-2 cursor-pointer hover:bg-base-300">{p.nombre}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => setIsNewPlantModalOpen(true)} disabled={!formInternalState.selectedCompanyId} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50" title="Crear Nueva Planta"><PlusIcon className="h-5 w-5"/></button>
                                    <button type="button" onClick={() => setIsPlantSearchModalOpen(true)} disabled={!formInternalState.selectedCompanyId} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50" title="Buscar Planta"><SearchIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        </div>
                        {/* Encargado */}
                        <div>
                            <label htmlFor="supervisor-search" className="block text-sm font-medium flex items-center gap-2">Encargado de Planta {isMachinesAndSupervisorsLoading && <Spinner />}</label>
                            <div onBlur={() => setTimeout(() => setShowSupervisorSuggestions(false), 100)}>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="relative flex-grow">
                                        <input id="supervisor-search" type="text" value={supervisorSearchText} onChange={(e) => setSupervisorSearchText(e.target.value)} onFocus={() => setShowSupervisorSuggestions(true)} disabled={!formInternalState.selectedPlantId} placeholder="Escribir o buscar encargado..." className="w-full input-style" autoComplete="off" />
                                        {showSupervisorSuggestions && supervisorSuggestions.length > 0 && (
                                            <ul className="absolute z-10 w-full bg-base-200 border border-base-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg custom-scrollbar">
                                                {supervisorSuggestions.map(s => <li key={s.id} onMouseDown={() => handleSelectSupervisor(s)} className="p-3 cursor-pointer hover:bg-base-300">{s.nombre} {s.apellido}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => setIsNewSupervisorModalOpen(true)} disabled={!formInternalState.selectedPlantId} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50" title="Crear Nuevo Encargado"><UserPlusIcon className="h-5 w-5"/></button>
                                    <button type="button" onClick={() => setIsSupervisorSearchModalOpen(true)} disabled={!formInternalState.selectedPlantId} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50" title="Buscar Encargado"><SearchIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        </div>
                         {/* Maquina */}
                        <div>
                            <label htmlFor="machine-search" className="block text-sm font-medium flex items-center gap-2">Máquina (N° Serie) {isMachinesAndSupervisorsLoading && <Spinner />}</label>
                            <div onBlur={() => setTimeout(() => setShowMachineSuggestions(false), 100)}>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="relative flex-grow">
                                        <input id="machine-search" type="text" value={machineSearchText} onChange={(e) => setMachineSearchText(e.target.value)} onFocus={() => setShowMachineSuggestions(true)} disabled={!formInternalState.selectedPlantId} placeholder="Escribir o buscar N° Serie..." className="w-full input-style" autoComplete="off" />
                                        {showMachineSuggestions && machineSuggestions.length > 0 && (
                                            <ul className="absolute z-10 w-full bg-base-200 border border-base-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg custom-scrollbar">
                                                {machineSuggestions.map(m => <li key={m.id} onMouseDown={() => handleSelectMachine(m)} className="px-3 py-2 cursor-pointer hover:bg-base-300">{m.serie}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => setIsNewMachineModalOpen(true)} disabled={!formInternalState.selectedPlantId} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50" title="Crear Nueva Máquina"><PlusIcon className="h-5 w-5"/></button>
                                    <button type="button" onClick={() => setIsMachineSearchModalOpen(true)} disabled={!formInternalState.selectedPlantId} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50" title="Buscar Máquina"><SearchIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="maquina_modelo" className="block text-sm font-medium">Modelo</label>
                            <input type="text" name="maquina_modelo" id="maquina_modelo" value={formData.maquina_modelo || ''} onChange={handleChange} className="mt-1 block w-full input-style" />
                        </div>
                        <div>
                            <label htmlFor="maquina_marca" className="block text-sm font-medium">Marca</label>
                            <input type="text" name="maquina_marca" id="maquina_marca" value={formData.maquina_marca || ''} onChange={handleChange} className="mt-1 block w-full input-style" />
                        </div>
                        <div>
                            <label htmlFor="maquina_linea" className="block text-sm font-medium">Línea</label>
                            <input type="text" name="maquina_linea" id="maquina_linea" value={formData.maquina_linea || ''} onChange={handleChange} className="mt-1 block w-full input-style" />
                        </div>
                    </div>
                </div>

                <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg space-y-6">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Detalles del Servicio</h3>
                    <div><label htmlFor="problemas_encontraados" className="block text-sm font-medium">Problemas Encontrados</label><textarea name="problemas_encontraados" rows={4} value={formData.problemas_encontraados || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea><ImageUpload id="fotos-problemas" label="" files={fotosProblemas} onFilesChange={setFotosProblemas} existingImageUrls={formData.foto_problemas_encontrados} onRemoveExisting={(index) => handleRemoveExistingImage('foto_problemas_encontrados', index)} /></div>
                    <div><label htmlFor="acciones_realizadas" className="block text-sm font-medium">Acciones Realizadas</label><textarea name="acciones_realizadas" rows={4} value={formData.acciones_realizadas || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea><ImageUpload id="fotos-acciones" label="" files={fotosAcciones} onFilesChange={setFotosAcciones} existingImageUrls={formData.foto_acciones_realizadas} onRemoveExisting={(index) => handleRemoveExistingImage('foto_acciones_realizadas', index)} /></div>
                    <div><label htmlFor="observaciones" className="block text-sm font-medium">Observaciones</label><textarea name="observaciones" rows={3} value={formData.observaciones || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea></div>
                    <div><label htmlFor="control_interno" className="block text-sm font-medium">Control Interno</label><textarea name="control_interno" rows={2} value={formData.control_interno || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea></div>
                </div>

                <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg space-y-6">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Estado Final</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <fieldset><legend className="text-sm font-medium">Estado de la Máquina</legend><div className="mt-2 space-y-2">{['operativo', 'inoperativo', 'en_prueba'].map(opt => (<div key={opt} className="flex items-center"><input id={`maq_${opt}`} name="estado_maquina" type="radio" value={opt} checked={formData.estado_maquina === opt} onChange={() => handleRadioChange('estado_maquina', opt)} className="h-4 w-4 text-primary focus:ring-primary border-base-border" /><label htmlFor={`maq_${opt}`} className="ml-3 block text-sm capitalize">{opt.replace('_', ' ')}</label></div>))}</div></fieldset>
                        <fieldset><legend className="text-sm font-medium">Garantía</legend><div className="mt-2 space-y-2">{['con_garantia', 'sin_garantia'].map(opt => (<div key={opt} className="flex items-center"><input id={`gar_${opt}`} name="estado_garantia" type="radio" value={opt} checked={formData.estado_garantia === opt} onChange={() => handleRadioChange('estado_garantia', opt)} className="h-4 w-4 text-primary focus:ring-primary border-base-border" /><label htmlFor={`gar_${opt}`} className="ml-3 block text-sm capitalize">{opt.replace('_', ' ')}</label></div>))}</div></fieldset>
                        <fieldset><legend className="text-sm font-medium">Facturación</legend><div className="mt-2 space-y-2">{['facturado', 'no_facturado'].map(opt => (<div key={opt} className="flex items-center"><input id={`fac_${opt}`} name="estado_facturacion" type="radio" value={opt} checked={formData.estado_facturacion === opt} onChange={() => handleRadioChange('estado_facturacion', opt)} className="h-4 w-4 text-primary focus:ring-primary border-base-border" /><label htmlFor={`fac_${opt}`} className="ml-3 block text-sm capitalize">{opt.replace('_', ' ')}</label></div>))}</div></fieldset>
                        <fieldset><legend className="text-sm font-medium">Estado del Reporte</legend><div className="mt-2 space-y-2"><div className="flex items-center"><input id="estado" name="estado" type="checkbox" checked={!!formData.estado} onChange={handleChange} className="h-4 w-4 text-primary focus:ring-primary border-base-border rounded" /><label htmlFor="estado" className="ml-3 block text-sm">Finalizado</label></div></div></fieldset>
                    </div>
                </div>

                <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg space-y-6">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Conformidad del Cliente</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label htmlFor="encargado_nombre" className="block text-sm font-medium">Nombre del Receptor</label><input type="text" name="encargado_nombre" value={formData.encargado_nombre || ''} onChange={handleChange} className="mt-1 block w-full input-style" /></div>
                        <div><label htmlFor="encargado_cel" className="block text-sm font-medium">Celular del Receptor</label><input type="text" name="encargado_cel" value={formData.encargado_cel || ''} onChange={handleChange} className="mt-1 block w-full input-style" /></div>
                        <div className="md:col-span-2"><ImageUpload id="foto-firma" label="Firma de Conformidad" files={fotoFirma} onFilesChange={setFotoFirma} multiple={false} existingImageUrls={formData.foto_firma ? [formData.foto_firma] : []} onRemoveExisting={() => setFormData(prev => ({ ...prev, foto_firma: null }))} /></div>
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
                        <button type="button" onClick={onBack} className="bg-base-300 py-2 px-4 rounded-lg hover:bg-neutral/20 transition-colors">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="bg-primary text-white py-2 px-6 rounded-lg hover:bg-primary-focus transition-colors disabled:bg-primary/50 flex items-center gap-2">{isSubmitting && <Spinner />}{isSubmitting ? 'Guardando...' : 'Guardar Reporte'}</button>
                    </div>
                </div>
            </form>
        </div>
        
        {/* Simulator Section */}
        <div className={`relative transition-all duration-300 ease-in-out w-full ${isSimulatorVisible ? 'lg:w-1/2 h-[80vh] lg:h-full' : 'lg:w-12 h-12'}`}>
            <div className="sticky top-0 h-full flex flex-col bg-base-300/50 rounded-lg shadow-inner">
                 <div className="flex-shrink-0 p-2 bg-base-200 rounded-t-lg border-b border-base-border flex justify-between items-center">
                     <button onClick={() => setIsSimulatorVisible(!isSimulatorVisible)} className="p-2 rounded-full hover:bg-base-300" title={isSimulatorVisible ? "Ocultar Previsualización" : "Mostrar Previsualización"}>
                        {isSimulatorVisible ? <EyeOffIcon className="h-5 w-5" /> : <ViewIcon className="h-5 w-5" />}
                    </button>
                    <span className="text-sm font-medium lg:hidden">{isSimulatorVisible ? 'Ocultar' : 'Mostrar'} Previsualización</span>
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
      <Modal isOpen={isCompanySearchModalOpen} onClose={() => setIsCompanySearchModalOpen(false)} title="Buscar Empresa"><ul className="max-h-80 overflow-y-auto divide-y divide-base-border custom-scrollbar">{companies.map(c => <li key={c.id} onMouseDown={() => handleSelectCompany(c)} className="px-3 py-2 cursor-pointer hover:bg-base-300">{c.nombre}</li>)}</ul></Modal>
      
      <Modal isOpen={isNewPlantModalOpen} onClose={() => setIsNewPlantModalOpen(false)} title="Añadir Nueva Planta"><PlantForm plant={null} onSave={handlePlantSaved} onCancel={() => setIsNewPlantModalOpen(false)}/></Modal>
      <Modal isOpen={isPlantSearchModalOpen} onClose={() => setIsPlantSearchModalOpen(false)} title="Buscar Planta"><ul className="max-h-80 overflow-y-auto divide-y divide-base-border custom-scrollbar">{filteredPlants.map(p => <li key={p.id} onMouseDown={() => handleSelectPlant(p)} className="px-3 py-2 cursor-pointer hover:bg-base-300">{p.nombre}</li>)}</ul></Modal>
      
      <Modal isOpen={isNewMachineModalOpen} onClose={() => setIsNewMachineModalOpen(false)} title="Añadir Nueva Máquina"><MachineForm machine={null} onSave={handleMachineSaved} onCancel={() => setIsNewMachineModalOpen(false)}/></Modal>
      <Modal isOpen={isMachineSearchModalOpen} onClose={() => setIsMachineSearchModalOpen(false)} title="Buscar Máquina"><ul className="max-h-80 overflow-y-auto divide-y divide-base-border custom-scrollbar">{filteredMachines.map(m => <li key={m.id} onMouseDown={() => handleSelectMachine(m)} className="px-3 py-2 cursor-pointer hover:bg-base-300">{m.serie} - {m.modelo}</li>)}</ul></Modal>

      <Modal isOpen={isNewSupervisorModalOpen} onClose={() => setIsNewSupervisorModalOpen(false)} title="Añadir Nuevo Encargado"><SupervisorForm supervisor={null} onSave={handleSupervisorSaved} onCancel={() => setIsNewSupervisorModalOpen(false)} defaultCompanyName={selectedCompanyForNewSupervisor?.nombre} defaultPlantName={selectedPlantForNewSupervisor?.nombre} /></Modal>
      <Modal isOpen={isSupervisorSearchModalOpen} onClose={() => setIsSupervisorSearchModalOpen(false)} title="Buscar Encargado"><ul className="max-h-80 overflow-y-auto divide-y divide-base-border custom-scrollbar">{filteredSupervisors.map(s => <li key={s.id} onMouseDown={() => handleSelectSupervisor(s)} className="p-3 cursor-pointer hover:bg-base-300">{s.nombre} {s.apellido}</li>)}</ul></Modal>
    </div>
  );
};

export default ReportForm;