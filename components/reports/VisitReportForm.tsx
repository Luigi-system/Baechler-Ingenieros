import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
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
import MachineForm from '../management/machines/MachineForm';

interface ReportFormProps {
  reportId?: string | null;
  onBack: () => void;
}

const fileToPngDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
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

const toDataURL = (b64OrDataURL: string): string => {
    if (b64OrDataURL.startsWith('data:image')) {
        return b64OrDataURL;
    }
    const prefix = b64OrDataURL.startsWith('/9j/') ? 'data:image/jpeg;base64,' : 'data:image/png;base64,';
    return prefix + b64OrDataURL;
};

const VisitReportForm: React.FC<ReportFormProps> = ({ reportId, onBack }) => {
    const { supabase } = useSupabase();
    const auth = useContext(AuthContext);
    const { logoUrl } = useTheme();
    const { autocompleteService, geminiClient, openaiClient, isAutocompleteServiceConfigured } = useAiService();

    const [formData, setFormData] = useState<Partial<VisitReport>>({
        estado: 'En Progreso',
        form_id_empresa: undefined,
        form_id_planta: undefined,
        form_id_encargado: undefined,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [companies, setCompanies] = useState<Company[]>([]);
    const [plants, setPlants] = useState<Plant[]>([]);
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [machines, setMachines] = useState<Machine[]>([]);
    
    const [fotosObservaciones, setFotosObservaciones] = useState<File[]>([]);
    const [fotosSugerencias, setFotosSugerencias] = useState<File[]>([]);
    const [fotoFirma, setFotoFirma] = useState<File[]>([]);
    const [selectedMaquinas, setSelectedMaquinas] = useState<{ machine: Machine, observaciones: string }[]>([]);

    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isSimulatorVisible, setIsSimulatorVisible] = useState(true);
    const [pdfPreviewUri, setPdfPreviewUri] = useState<string | null>(null);
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const debounceTimeout = useRef<number | null>(null);
    const [isPlantsLoading, setIsPlantsLoading] = useState(false);
    const [isSupervisorsLoading, setIsSupervisorsLoading] = useState(false);
    
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

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
    const [isNewMachineModalOpen, setIsNewMachineModalOpen] = useState(false);
    const [isMachineSearchModalOpen, setIsMachineSearchModalOpen] = useState(false);

    const fetchDropdownData = useCallback(async () => {
        if (!supabase) return { companies: [], plants: [], supervisors: [], machines: [] };
        try {
            const [companyRes, plantRes, supervisorRes, machineRes] = await Promise.all([
                supabase.from('Empresa').select('*'),
                supabase.from('Planta').select('*'),
                supabase.from('Encargado').select('*'),
                supabase.from('Maquinas').select('*, planta:Planta(nombre), empresa:Empresa(nombre)'),
            ]);
            if (companyRes.error) throw companyRes.error;
            if (plantRes.error) throw plantRes.error;
            if (supervisorRes.error) throw supervisorRes.error;
            if (machineRes.error) throw machineRes.error;
            
            const formattedMachines = machineRes.data.map((m: any) => ({
                ...m, 
                planta_nombre: m.planta?.nombre,
                empresa_nombre: m.empresa?.nombre
            }));

            setCompanies(companyRes.data);
            setPlants(plantRes.data);
            setSupervisors(supervisorRes.data);
            setMachines(formattedMachines);
            return { companies: companyRes.data, plants: plantRes.data, supervisors: supervisorRes.data, machines: formattedMachines };
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
                    const company = companies.find(c => (c.nombre || '').trim().toLowerCase() === (reportData.empresa_nombre || '').trim().toLowerCase());
                    const plant = company ? plants.find(p => p.id_empresa === company.id && (p.nombre || '').trim().toLowerCase() === (reportData.empresa_planta || '').trim().toLowerCase()) : undefined;
                    const supervisor = (company && plant) ? supervisors.find(s => 
                        (s.nombreEmpresa || '').trim().toLowerCase() === (company.nombre || '').trim().toLowerCase() && 
                        (s.nombrePlanta || '').trim().toLowerCase() === (plant.nombre || '').trim().toLowerCase() &&
                        `${s.nombre || ''} ${s.apellido || ''}`.trim().toLowerCase() === (reportData.encargado_nombre || '').trim().toLowerCase()
                    ) : undefined;

                    const formDataToSet: Partial<VisitReport> = {
                        ...reportData,
                        form_id_empresa: company?.id,
                        form_id_planta: plant?.id,
                        form_id_encargado: supervisor?.id,
                    };
                    
                    formDataToSet.fotos_observaciones = reportData.fotos_observaciones ? toDataURL(reportData.fotos_observaciones) : null;
                    formDataToSet.fotos_sugerencias = reportData.fotos_sugerencias ? toDataURL(reportData.fotos_sugerencias) : null;
                    formDataToSet.foto_firma = reportData.foto_firma ? toDataURL(reportData.foto_firma) : null;

                    setFormData(formDataToSet);

                    if (company) setCompanySearchText(company.nombre);
                    if (plant) setPlantSearchText(plant.nombre);
                    if (supervisor) setSupervisorSearchText(`${supervisor.nombre} ${supervisor.apellido || ''}`);
                    
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
                    Promise.all(fotosObservaciones.map(fileToPngDataUrl)),
                    Promise.all(fotosSugerencias.map(fileToPngDataUrl)),
                    fotoFirma[0] ? fileToPngDataUrl(fotoFirma[0]) : Promise.resolve(undefined),
                ]);

                const enrichedData: VisitReport = {
                    ...formData,
                    selected_maquinas_pdf: selectedMaquinas.map(item => ({
                        machineLabel: `${item.machine.serie} - ${item.machine.modelo || ''} (${item.machine.marca || 'S/M'})`,
                        observations: item.observaciones,
                    })),
                    usuario_nombre: auth?.user?.nombres || 'N/A',
                    fotosObservacionesBase64: [...(formData.fotos_observaciones ? [formData.fotos_observaciones] : []), ...fotosObservacionesBase64],
                    fotosSugerenciasBase64: [...(formData.fotos_sugerencias ? [formData.fotos_sugerencias] : []), ...fotosSugerenciasBase64],
                    fotoFirmaBase64: fotoFirmaBase64 || formData.foto_firma || undefined,
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

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
    }, []);
    
    const handleSelectCompany = useCallback((company: Company) => {
        setIsPlantsLoading(true);
        setFormData(prev => ({
            ...prev,
            form_id_empresa: company.id,
            empresa_nombre: company.nombre,
            form_id_planta: undefined,
            empresa_planta: undefined,
            form_id_encargado: undefined,
            encargado_nombre: undefined,
            encargado_cel: undefined,
        }));
        setCompanySearchText(company.nombre);
        setPlantSearchText('');
        setSupervisorSearchText('');
        setSelectedMaquinas([]);
        setShowCompanySuggestions(false);
        setIsCompanySearchModalOpen(false);
        setTimeout(() => setIsPlantsLoading(false), 300);
    }, []);

    const handleSelectPlant = useCallback((plant: Plant) => {
        setIsSupervisorsLoading(true);
        setFormData(prev => ({
            ...prev,
            form_id_planta: plant.id,
            empresa_planta: plant.nombre,
            form_id_encargado: undefined,
            encargado_nombre: undefined,
            encargado_cel: undefined,
        }));
        setPlantSearchText(plant.nombre);
        setSupervisorSearchText('');
        setSelectedMaquinas([]);
        setShowPlantSuggestions(false);
        setIsPlantSearchModalOpen(false);
        setTimeout(() => setIsSupervisorsLoading(false), 300);
    }, []);

    const handleSelectSupervisor = useCallback((supervisor: Supervisor) => {
        setFormData(prev => ({
            ...prev,
            form_id_encargado: supervisor.id,
            encargado_nombre: `${supervisor.nombre} ${supervisor.apellido || ''}`.trim(),
            encargado_cel: supervisor.celular?.toString(),
        }));
        setSupervisorSearchText(`${supervisor.nombre} ${supervisor.apellido || ''}`.trim());
        setShowSupervisorSuggestions(false);
        setIsSupervisorSearchModalOpen(false);
    }, []);

    const handleSelectMachine = useCallback((machine: Machine) => {
        if (!selectedMaquinas.some(item => item.machine.id === machine.id)) {
            setSelectedMaquinas(prev => [...prev, { machine, observaciones: '' }]);
        }
        setMachineSearch('');
        setShowMachineSuggestions(false);
        setIsNewMachineModalOpen(false);
        setIsMachineSearchModalOpen(false);
    }, [selectedMaquinas]);

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

    const handleMachineSaved = useCallback(async (newMachine: Machine) => {
        await fetchDropdownData();
        handleSelectMachine(newMachine);
        setIsNewMachineModalOpen(false);
    }, [fetchDropdownData, handleSelectMachine]);

    const handleAiFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsAiLoading(true);
        setAiError(null);

        if (!isAutocompleteServiceConfigured()) {
            setAiError(`El servicio de IA (${autocompleteService}) no está configurado.`);
            setIsAiLoading(false);
            return;
        }

        if (autocompleteService === 'openai' && file.type === 'application/pdf') {
            setAiError(`OpenAI no soporta PDFs para esta función, solo imágenes. Por favor, selecciona Gemini como servicio de autocompletado o sube una imagen.`);
            setIsAiLoading(false);
            return;
        }

        const getBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });

        try {
            const dataUrl = await getBase64(file);
            const mimeType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
            const base64Data = dataUrl.split(',')[1];
            
            const textPrompt = `Del documento adjunto, extrae la siguiente información y proporciona la salida en formato JSON:
- codigo
- empresa_nombre
- empresa_planta
- encargado_nombre
- encargado_cel
- maquinas (un array de objetos, cada objeto con "serie" y "observaciones")
- voltaje_establecido (boolean)
- linea_a_tierra (boolean)
- presurizacion_de_cabezal (boolean)
- transformador_de_aislamiento (boolean)
- limpieza_cabezal (boolean)
- observaciones
- sugerencias
`;
            
            let parsed: any;

            if (autocompleteService === 'gemini' && geminiClient) {
                 const response = await geminiClient.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: [{ parts: [ { inlineData: { mimeType, data: base64Data } }, { text: textPrompt } ] }],
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                codigo: { type: Type.STRING },
                                empresa_nombre: { type: Type.STRING },
                                empresa_planta: { type: Type.STRING },
                                encargado_nombre: { type: Type.STRING },
                                encargado_cel: { type: Type.STRING },
                                maquinas: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            serie: { type: Type.STRING },
                                            observaciones: { type: Type.STRING },
                                        }
                                    }
                                },
                                voltaje_establecido: { type: Type.BOOLEAN },
                                linea_a_tierra: { type: Type.BOOLEAN },
                                presurizacion_de_cabezal: { type: Type.BOOLEAN },
                                transformador_de_aislamiento: { type: Type.BOOLEAN },
                                limpieza_cabezal: { type: Type.BOOLEAN },
                                observaciones: { type: Type.STRING },
                                sugerencias: { type: Type.STRING },
                            }
                        }
                    },
                });
                parsed = JSON.parse(response.text);
            } else if (autocompleteService === 'openai' && openaiClient) {
                 const response = await openaiClient.chat.completions.create({
                    model: "gpt-4o",
                    messages: [ { role: "user", content: [ { type: "text", text: textPrompt }, { type: "image_url", image_url: { url: dataUrl } } ] } ],
                    response_format: { type: "json_object" }
                });
                const content = response.choices[0]?.message?.content;
                if (!content) throw new Error("OpenAI returned an empty response.");
                parsed = JSON.parse(content);
            } else {
                 throw new Error(`Servicio de IA desconocido o no configurado: ${autocompleteService}`);
            }
            
            const newFormData: Partial<VisitReport> = {};
            for (const key of ['codigo', 'observaciones', 'sugerencias', 'voltaje_establecido', 'linea_a_tierra', 'presurizacion_de_cabezal', 'transformador_de_aislamiento', 'limpieza_cabezal']) {
                if(parsed[key] !== undefined) (newFormData as any)[key] = parsed[key];
            }
            
            setFormData(prev => ({...prev, ...newFormData}));

            if (parsed.empresa_nombre) {
                const foundCompany = companies.find(c => (c.nombre || '').toLowerCase().includes(parsed.empresa_nombre.toLowerCase()));
                if (foundCompany) {
                    handleSelectCompany(foundCompany);
                    await new Promise(r => setTimeout(r, 400)); // Wait for state update

                    if (parsed.empresa_planta) {
                        const foundPlant = plants.find(p => p.id_empresa === foundCompany.id && (p.nombre || '').toLowerCase().includes(parsed.empresa_planta.toLowerCase()));
                        if (foundPlant) {
                            handleSelectPlant(foundPlant);
                             await new Promise(r => setTimeout(r, 400)); // Wait for state update

                            if (parsed.encargado_nombre) {
                                const foundSupervisor = supervisors.find(s => s.nombreEmpresa === foundCompany.nombre && s.nombrePlanta === foundPlant.nombre && `${s.nombre} ${s.apellido || ''}`.toLowerCase().includes(parsed.encargado_nombre.toLowerCase()));
                                if(foundSupervisor) handleSelectSupervisor(foundSupervisor);
                            }
                        }
                    }
                }
            }

            if (parsed.maquinas && Array.isArray(parsed.maquinas)) {
                const parsedSelectedMaquinas = parsed.maquinas.map((machineInfo: any) => {
                    const machine = machines.find(m => m.serie === machineInfo.serie);
                    return machine ? { machine, observaciones: machineInfo.observaciones || '' } : null;
                }).filter(Boolean);
                setSelectedMaquinas(parsedSelectedMaquinas as any);
            }
        } catch (e: any) {
            console.error(e);
            setAiError(`Error al procesar: ${e.message}`);
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
            const [newObservacionesB64, newSugerenciasB64, newFirmaB64] = await Promise.all([
                fotosObservaciones.length > 0 ? fileToPngDataUrl(fotosObservaciones[0]).then(stripDataUriPrefix) : Promise.resolve(null),
                fotosSugerencias.length > 0 ? fileToPngDataUrl(fotosSugerencias[0]).then(stripDataUriPrefix) : Promise.resolve(null),
                fotoFirma.length > 0 ? fileToPngDataUrl(fotoFirma[0]).then(stripDataUriPrefix) : Promise.resolve(null),
            ]);

            // Create a comprehensive data object for the PDF generator
            const pdfDataObject: VisitReport = {
                ...formData,
                selected_maquinas_pdf: selectedMaquinas.map(item => ({
                    machineLabel: `${item.machine.serie} - ${item.machine.modelo || ''} (${item.machine.marca || 'S/M'})`,
                    observations: item.observaciones,
                })),
                usuario_nombre: auth.user.nombres || 'N/A',
                fotosObservacionesBase64: [
                    ...(formData.fotos_observaciones ? [formData.fotos_observaciones] : []),
                    ...(await Promise.all(fotosObservaciones.map(fileToPngDataUrl)))
                ],
                fotosSugerenciasBase64: [
                    ...(formData.fotos_sugerencias ? [formData.fotos_sugerencias] : []),
                    ...(await Promise.all(fotosSugerencias.map(fileToPngDataUrl)))
                ],
                fotoFirmaBase64: fotoFirma[0] ? await fileToPngDataUrl(fotoFirma[0]) : formData.foto_firma || undefined,
            };

            const pdfDataUri = await generateVisitReport(pdfDataObject, logoUrl, 'datauristring');
            const pdfBase64 = pdfDataUri && (pdfDataUri as string).includes('base64,')
                ? (pdfDataUri as string).split('base64,')[1]
                : null;

            const payload: { [key: string]: any } = {
                id: formData.id,
                codigo: formData.codigo,
                estado: formData.estado,
                empresa_nombre: formData.empresa_nombre,
                empresa_planta: formData.empresa_planta,
                usuario_nombre: auth.user.nombres,
                usuario_cel: auth.user.celular?.toString(),
                encargado_nombre: formData.encargado_nombre,
                encargado_cel: formData.encargado_cel,
                maquinas: selectedMaquinas.map(item => `${item.machine.serie} - ${item.machine.modelo || ''}: ${item.observaciones}`),
                voltaje_establecido: formData.voltaje_establecido,
                linea_a_tierra: formData.linea_a_tierra,
                presurizacion_de_cabezal: formData.presurizacion_de_cabezal,
                transformador_de_aislamiento: formData.transformador_de_aislamiento,
                limpieza_cabezal: formData.limpieza_cabezal,
                fotos_observaciones: newObservacionesB64 || (formData.fotos_observaciones ? stripDataUriPrefix(formData.fotos_observaciones) : null),
                fotos_sugerencias: newSugerenciasB64 || (formData.fotos_sugerencias ? stripDataUriPrefix(formData.fotos_sugerencias) : null),
                foto_firma: newFirmaB64 || (formData.foto_firma ? stripDataUriPrefix(formData.foto_firma) : null),
                observaciones: formData.observaciones,
                sugerencias: formData.sugerencias,
                pdf: pdfBase64,
            };
            
            Object.keys(payload).forEach(key => (payload[key] === undefined) && delete payload[key]);
            if (formData.id === undefined) delete payload.id;

            const { error } = await supabase.from('Reporte_Visita').upsert(payload);
            if (error) throw error;
            
            setIsSubmitting(false);
            alert("¡Reporte de visita guardado exitosamente!");
            onBack();

        } catch (error: any) {
            setIsSubmitting(false);
            alert("Error al guardar el reporte: " + error.message);
            console.error("Submit error:", error);
        }
    };
    
    const selectedCompanyForNewSupervisor = useMemo(() => companies.find(c => c.id === formData.form_id_empresa), [formData.form_id_empresa, companies]);
    const selectedPlantForNewSupervisor = useMemo(() => plants.find(p => p.id === formData.form_id_planta), [formData.form_id_planta, plants]);
    const selectedCompanyForNewMachine = useMemo(() => companies.find(c => c.id === formData.form_id_empresa), [formData.form_id_empresa, companies]);
    const selectedPlantForNewMachine = useMemo(() => plants.find(p => p.id === formData.form_id_planta), [formData.form_id_planta, plants]);

    if (isDataLoading) return <div className="flex justify-center items-center h-full"><Spinner /> Cargando datos...</div>

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4">
        <div className="w-full lg:flex-1 overflow-y-auto pr-2 custom-scrollbar">
             <div className="flex items-center mb-6">
                <button onClick={onBack} className="p-2 mr-4 rounded-full hover:bg-base-300 transition"><BackIcon className="h-6 w-6" /></button>
                <h2 className="text-3xl font-bold">{reportId ? 'Editar Reporte de Visita' : 'Crear Reporte de Visita'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg">
                    <div className="flex items-start"><SparklesIcon className="h-8 w-8 text-primary mr-3 shrink-0"/><div><h3 className="font-bold text-lg text-primary">Autocompletado con IA</h3><p className="text-sm text-neutral">Sube una orden de trabajo para rellenar campos.</p></div></div>
                    <div className="mt-4">
                    <label htmlFor="ai-file-upload" className="relative cursor-pointer bg-base-200 rounded-md font-medium text-primary hover:text-primary-focus focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                        <div className="flex items-center justify-center w-full px-6 py-4 border-2 border-base-border border-dashed rounded-md"><UploadIcon className="h-8 w-8 text-neutral mr-3" /><span className="text-neutral">{fileName || "Haz clic para subir un documento"}</span></div>
                        <input id="ai-file-upload" name="ai-file-upload" type="file" className="sr-only" onChange={handleAiFileChange} accept="image/*,application/pdf" disabled={isAiLoading || !isAutocompleteServiceConfigured()}/>
                    </label>
                    {isAiLoading && <div className="mt-2 flex items-center"><Spinner /><span className="ml-2">La IA está analizando tu documento...</span></div>}
                    {aiError && <p className="mt-2 text-sm text-error">{aiError}</p>}
                    </div>
                </div>
                
                <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg space-y-4">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Información General</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label htmlFor="codigo" className="block text-sm font-medium">Código Reporte</label><input type="text" name="codigo" value={formData.codigo || ''} onChange={handleChange} className="mt-1 block w-full input-style" /></div>
                        <div>
                            <label htmlFor="estado" className="block text-sm font-medium">Estado</label>
                            <select name="estado" id="estado" value={formData.estado || 'En Progreso'} onChange={handleChange} className="mt-1 block w-full input-style">
                                <option>En Progreso</option>
                                <option>Finalizado</option>
                            </select>
                        </div>
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
                        <div>
                            <label htmlFor="encargado_cel" className="block text-sm font-medium">Celular del Encargado</label>
                            <input type="text" name="encargado_cel" value={formData.encargado_cel || ''} onChange={handleChange} className="mt-1 block w-full input-style" />
                        </div>
                    </div>
                </div>

                <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg space-y-4">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Detalles Técnicos</h3>
                    <div>
                        <label className="block text-sm font-medium">Checklist Técnico</label>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {['voltaje_establecido', 'linea_a_tierra', 'presurizacion_de_cabezal', 'transformador_de_aislamiento', 'limpieza_cabezal'].map(field => (
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
                            <div className="flex items-center gap-2 mt-1">
                                <div className="relative flex-grow">
                                    <input id="machine-search" type="text" value={machineSearch} onChange={e => setMachineSearch(e.target.value)} onFocus={() => setShowMachineSuggestions(true)} placeholder="Buscar máquina para añadir..." className="w-full input-style" disabled={!formData.form_id_planta} />
                                    {showMachineSuggestions && machineSuggestions.length > 0 && (
                                        <ul className="absolute z-20 w-full bg-base-200 border border-base-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg custom-scrollbar">
                                            {machineSuggestions.map(machine => (<li key={machine.id} onMouseDown={() => handleSelectMachine(machine)} className="px-3 py-2 cursor-pointer hover:bg-base-300">{machine.serie} - {machine.modelo}</li>))}
                                        </ul>
                                    )}
                                </div>
                                <button type="button" onClick={() => setIsNewMachineModalOpen(true)} disabled={!formData.form_id_planta} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50" title="Crear Nueva Máquina"><PlusIcon className="h-5 w-5"/></button>
                                <button type="button" onClick={() => setIsMachineSearchModalOpen(true)} disabled={!formData.form_id_planta} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50" title="Buscar Máquina"><SearchIcon className="h-5 w-5"/></button>
                            </div>
                        </div>
                        
                        <div className="mt-4 space-y-4">
                            {selectedMaquinas.map((item, index) => (
                                <div key={item.machine.id} className="p-3 bg-base-100 rounded-lg border border-base-border">
                                    <div className="flex justify-between items-start">
                                        <div><p className="font-semibold">{item.machine.serie} - {item.machine.modelo}</p><p className="text-xs text-neutral">{item.machine.marca}</p></div>
                                        <button type="button" onClick={() => setSelectedMaquinas(prev => prev.filter((_, i) => i !== index))} className="text-error hover:text-error/80 p-1"><TrashIcon className="h-4 w-4" /></button>
                                    </div>
                                    <textarea placeholder="Añadir observaciones para esta máquina..." value={item.observaciones} onChange={e => { const newObs = e.target.value; setSelectedMaquinas(prev => prev.map((m, i) => i === index ? { ...m, observaciones: newObs } : m)); }} className="mt-2 block w-full input-style text-sm" rows={2}/>
                                </div>
                            ))}
                            {selectedMaquinas.length === 0 && (<p className="text-sm text-neutral text-center py-4">No se han añadido máquinas.</p>)}
                        </div>
                    </div>
                    <div><label htmlFor="observaciones" className="block text-sm font-medium">Observaciones</label><textarea name="observaciones" rows={3} value={formData.observaciones || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea><ImageUpload id="fotos-observaciones" label="" files={fotosObservaciones} onFilesChange={setFotosObservaciones} multiple={false} existingImageUrls={formData.fotos_observaciones ? [formData.fotos_observaciones] : []} onRemoveExisting={() => setFormData(prev => ({...prev, fotos_observaciones: null}))} /></div>
                    <div><label htmlFor="sugerencias" className="block text-sm font-medium">Sugerencias</label><textarea name="sugerencias" rows={3} value={formData.sugerencias || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea><ImageUpload id="fotos-sugerencias" label="" files={fotosSugerencias} onFilesChange={setFotosSugerencias} multiple={false} existingImageUrls={formData.fotos_sugerencias ? [formData.fotos_sugerencias] : []} onRemoveExisting={() => setFormData(prev => ({...prev, fotos_sugerencias: null}))} /></div>
                </div>

                <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg space-y-4">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Conformidad del Cliente</h3>
                    <ImageUpload
                        id="foto-firma-visita"
                        label="Firma de Conformidad"
                        files={fotoFirma}
                        onFilesChange={setFotoFirma}
                        multiple={false}
                        existingImageUrls={formData.foto_firma ? [formData.foto_firma] : []}
                        onRemoveExisting={() => setFormData(prev => ({ ...prev, foto_firma: null }))}
                    />
                </div>

                <div className="flex justify-end items-center pt-4 gap-4">
                    <button type="button" onClick={onBack} className="bg-base-300 py-2 px-4 rounded-lg hover:bg-neutral/20 transition-colors">Cancelar</button>
                    <button type="submit" disabled={isSubmitting} className="bg-primary text-white py-2 px-6 rounded-lg hover:bg-primary-focus transition-colors disabled:bg-primary/50 flex items-center gap-2">
                        {isSubmitting && <Spinner />}<SaveIcon className="h-5 w-5" />{isSubmitting ? 'Guardando...' : 'Guardar Reporte'}
                    </button>
                </div>
            </form>
        </div>

        <div className={`relative transition-all duration-300 ease-in-out w-full ${isSimulatorVisible ? 'lg:w-1/2 h-[80vh] lg:h-full' : 'lg:w-12 h-12'}`}>
            <div className="sticky top-0 h-full flex flex-col bg-base-300/50 rounded-lg shadow-inner">
                <div className="flex-shrink-0 p-2 bg-base-200 rounded-t-lg border-b border-base-border flex justify-between items-center">
                     <button onClick={() => setIsSimulatorVisible(!isSimulatorVisible)} className="p-2 rounded-full hover:bg-base-300" title={isSimulatorVisible ? "Ocultar Previsualización" : "Mostrar Previsualización"}>
                        {isSimulatorVisible ? <EyeOffIcon className="h-5 w-5" /> : <ViewIcon className="h-5 w-5" />}
                    </button>
                    <span className="text-sm font-medium lg:hidden">{isSimulatorVisible ? 'Ocultar' : 'Mostrar'} Previsualización</span>
                </div>
                {isSimulatorVisible && (<div className="flex-grow p-2 relative">
                        {isPdfLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10"><Spinner/></div>}
                        {pdfPreviewUri ? (<iframe src={pdfPreviewUri} title="PDF Preview" className="w-full h-full border-0 rounded-b-lg"/>) : (<div className="w-full h-full flex items-center justify-center text-neutral"><p>La previsualización aparecerá aquí.</p></div>)}
                </div>)}
            </div>
        </div>

        <Modal isOpen={isNewCompanyModalOpen} onClose={() => setIsNewCompanyModalOpen(false)} title="Añadir Nueva Empresa"><CompanyForm company={null} onSave={handleCompanySaved} onCancel={() => setIsNewCompanyModalOpen(false)}/></Modal>
        <Modal isOpen={isCompanySearchModalOpen} onClose={() => setIsCompanySearchModalOpen(false)} title="Buscar Empresa"><ul className="max-h-80 overflow-y-auto divide-y divide-base-border custom-scrollbar">{companies.map(c => <li key={c.id} onMouseDown={() => handleSelectCompany(c)} className="p-3 cursor-pointer hover:bg-base-300">{c.nombre}</li>)}</ul></Modal>
        <Modal isOpen={isNewPlantModalOpen} onClose={() => setIsNewPlantModalOpen(false)} title="Añadir Nueva Planta"><PlantForm plant={null} onSave={handlePlantSaved} onCancel={() => setIsNewPlantModalOpen(false)}/></Modal>
        <Modal isOpen={isPlantSearchModalOpen} onClose={() => setIsPlantSearchModalOpen(false)} title="Buscar Planta"><ul className="max-h-80 overflow-y-auto divide-y divide-base-border custom-scrollbar">{filteredPlants.map(p => <li key={p.id} onMouseDown={() => handleSelectPlant(p)} className="p-3 cursor-pointer hover:bg-base-300">{p.nombre}</li>)}</ul></Modal>
        <Modal isOpen={isNewSupervisorModalOpen} onClose={() => setIsNewSupervisorModalOpen(false)} title="Añadir Nuevo Encargado"><SupervisorForm supervisor={null} onSave={handleSupervisorSaved} onCancel={() => setIsNewSupervisorModalOpen(false)} defaultCompanyName={selectedCompanyForNewSupervisor?.nombre} defaultPlantName={selectedPlantForNewSupervisor?.nombre} /></Modal>
        <Modal isOpen={isSupervisorSearchModalOpen} onClose={() => setIsSupervisorSearchModalOpen(false)} title="Buscar Encargado"><ul className="max-h-80 overflow-y-auto divide-y divide-base-border custom-scrollbar">{filteredSupervisors.map(s => <li key={s.id} onMouseDown={() => handleSelectSupervisor(s)} className="p-3 cursor-pointer hover:bg-base-300">{s.nombre} {s.apellido}</li>)}</ul></Modal>
        <Modal isOpen={isNewMachineModalOpen} onClose={() => setIsNewMachineModalOpen(false)} title="Añadir Nueva Máquina"><MachineForm machine={null} onSave={handleMachineSaved} onCancel={() => setIsNewMachineModalOpen(false)} defaultCompanyId={selectedCompanyForNewMachine?.id} defaultPlantId={selectedPlantForNewMachine?.id} /></Modal>
        <Modal isOpen={isMachineSearchModalOpen} onClose={() => setIsMachineSearchModalOpen(false)} title="Buscar Máquina">
            <ul className="max-h-80 overflow-y-auto divide-y divide-base-border custom-scrollbar">
                {availableMachinesForPlant.map(m => (<li key={m.id} onMouseDown={() => handleSelectMachine(m)} className="px-3 py-2 cursor-pointer hover:bg-base-300">{m.serie} - {m.modelo} ({m.marca})</li>))}
                {availableMachinesForPlant.length === 0 && (<li className="px-3 py-2 text-center text-neutral">No hay máquinas para esta planta.</li>)}
            </ul>
        </Modal>
    </div>
  );
};

export default VisitReportForm;