

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
import MachineForm from '../management/machines/MachineForm'; // Import MachineForm

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
    const { autocompleteService, geminiClient, openaiClient, isAutocompleteServiceConfigured } = useAiService();

    // FIX: Explicitly initializing optional fields in formData to ensure TypeScript recognizes them.
    const [formData, setFormData] = useState<Partial<VisitReport>>({
        fecha: new Date().toISOString().split('T')[0],
        form_id_empresa: undefined, // Explicitly include for type recognition
        form_id_planta: undefined,  // Explicitly include for type recognition
        form_id_encargado: undefined, // Explicitly include for type recognition
    });
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
    // New states for Machine Modals
    const [isNewMachineModalOpen, setIsNewMachineModalOpen] = useState(false);
    const [isMachineSearchModalOpen, setIsMachineSearchModalOpen] = useState(false);

    const fetchDropdownData = useCallback(async () => {
        if (!supabase) return { companies: [], plants: [], supervisors: [], machines: [] };
        try {
            const [companyRes, plantRes, supervisorRes, machineRes] = await Promise.all([
                supabase.from('Empresa').select('*'),
                supabase.from('Planta').select('*'),
                supabase.from('Encargado').select('*'),
                supabase.from('Maquinas').select('*, planta:Planta(nombre), empresa:Empresa(nombre)'), // Fetch joined data for machine
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
            setMachines(formattedMachines); // Use formatted machines
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
                    const company = companies.find(c => (c.nombre || '').trim().toLowerCase() === (reportData.empresa || '').trim().toLowerCase());
                    const plant = company ? plants.find(p => p.id_empresa === company.id && (p.nombre || '').trim().toLowerCase() === (reportData.planta || '').trim().toLowerCase()) : undefined;
                    const supervisor = (company && plant) ? supervisors.find(s => 
                        (s.nombreEmpresa || '').trim().toLowerCase() === (company.nombre || '').trim().toLowerCase() && 
                        (s.nombrePlanta || '').trim().toLowerCase() === (plant.nombre || '').trim().toLowerCase() &&
                        `${s.nombre || ''} ${s.apellido || ''}`.trim().toLowerCase() === (reportData.nombre_encargado || '').trim().toLowerCase()
                    ) : undefined;
                    
                    const formattedDate = reportData.fecha ? new Date(reportData.fecha).toISOString().split('T')[0] : reportData.fecha;

                    setFormData({
                        ...reportData,
                        fecha: formattedDate,
                        form_id_empresa: company?.id,
                        form_id_planta: plant?.id,
                        form_id_encargado: supervisor?.id,
                    });

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
            // Reset related fields when company changes
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
            // Reset related fields when plant changes
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

    const handleSelectMachine = useCallback((machine: Machine) => {
        // Add the selected machine to the list if not already present
        if (!selectedMaquinas.some(item => item.machine.id === machine.id)) {
            setSelectedMaquinas(prev => [...prev, { machine, observaciones: '' }]);
        }
        setMachineSearch(''); // Clear search text after selection
        setShowMachineSuggestions(false);
        setIsNewMachineModalOpen(false); // Close modal if opened from there
        setIsMachineSearchModalOpen(false); // Close search modal if opened from there
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
        await fetchDropdownData(); // Re-fetch all data to get the new machine
        handleSelectMachine(newMachine); // Select the newly created machine
        setIsNewMachineModalOpen(false); // Close the new machine modal
    }, [fetchDropdownData, handleSelectMachine]);

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
            const base64Data = await fileToBase64(file);
            const textPrompt = `Del documento adjunto, extrae la siguiente información y proporciona la salida en formato JSON:
- fecha (YYYY-MM-DD)
- hora_ingreso (HH:MM)
- hora_salida (HH:MM)
- empresa (nombre de la empresa, a veces llamado "cliente")
- planta (nombre de la planta/sede)
- nombre_encargado (nombre completo del encargado de planta, a veces llamado "responsable")
- celular_encargado
- email_encargado
- nombre_operador (nombre completo del operador de máquina, a veces llamado "técnico" o "colaborador")
- celular_operador
- voltaje_establecido (¿se verificó el voltaje establecido? Responde "SI" o "NO")
- presurizacion (¿se verificó la presurización? Responde "SI" o "NO")
- transformador (¿se verificó el transformador? Responde "SI" o "NO")
- maquinas (un array de objetos. Cada objeto debe representar una fila de la tabla de máquinas y tener las propiedades "serie", "modelo" y "observaciones" extraídas de sus respectivas columnas.)
- sugerencias
`;
            
            let parsed: any;

            if (autocompleteService === 'gemini' && geminiClient) {
                 const response = await geminiClient.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: [{ parts: [ { inlineData: { mimeType: file.type, data: base64Data.split(',')[1] } }, { text: textPrompt } ] }],
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                fecha: { type: Type.STRING },
                                hora_ingreso: { type: Type.STRING },
                                hora_salida: { type: Type.STRING },
                                empresa: { type: Type.STRING },
                                planta: { type: Type.STRING },
                                nombre_encargado: { type: Type.STRING },
                                celular_encargado: { type: Type.STRING },
                                email_encargado: { type: Type.STRING },
                                nombre_operador: { type: Type.STRING },
                                celular_operador: { type: Type.STRING },
                                voltaje_establecido: { type: Type.STRING },
                                presurizacion: { type: Type.STRING },
                                transformador: { type: Type.STRING },
                                maquinas: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            serie: { type: Type.STRING },
                                            modelo: { type: Type.STRING },
                                            observaciones: { type: Type.STRING },
                                        }
                                    }
                                },
                                sugerencias: { type: Type.STRING },
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
            
            // Map parsed data to form state
            const newFormData: Partial<VisitReport> = {};

            if (parsed.fecha) newFormData.fecha = parsed.fecha;
            if (parsed.hora_ingreso) newFormData.hora_ingreso = parsed.hora_ingreso;
            if (parsed.hora_salida) newFormData.hora_salida = parsed.hora_salida;
            if (parsed.nombre_operador) newFormData.nombre_operador = parsed.nombre_operador;
            if (parsed.celular_operador) newFormData.celular_operador = parsed.celular_operador;
            if (parsed.sugerencias) newFormData.sugerencias = parsed.sugerencias;
            
            // Boolean conversions
            newFormData.voltaje_establecido = parsed.voltaje_establecido?.toLowerCase() === 'si';
            newFormData.presurizacion = parsed.presurizacion?.toLowerCase() === 'si';
            newFormData.transformador = parsed.transformador?.toLowerCase() === 'si';

            // Relational data mapping and auto-selection
            let selectedCompany: Company | undefined;
            if (parsed.empresa) {
                const companyNameToFind = parsed.empresa.toLowerCase();
                selectedCompany = companies.find(c => (c.nombre || '').toLowerCase().includes(companyNameToFind));
                if (selectedCompany) {
                    handleSelectCompany(selectedCompany);
                    newFormData.form_id_empresa = selectedCompany.id;
                    newFormData.empresa = selectedCompany.nombre;
                    newFormData.cliente = selectedCompany.nombre; // cliente is same as empresa for visit report
                }
            }

            let selectedPlant: Plant | undefined;
            if (parsed.planta && newFormData.form_id_empresa) { // << Accessing newFormData.form_id_empresa here
                const plantNameToFind = parsed.planta.toLowerCase();
                selectedPlant = plants.find(p => p.id_empresa === newFormData.form_id_empresa && (p.nombre || '').toLowerCase().includes(plantNameToFind));
                if (selectedPlant) {
                    // Use a timeout to ensure company state is updated before selecting plant,
                    // or directly call internal logic if handleSelectPlant is not strictly needed for UI interaction.
                    // For now, let's update form data directly and then trigger the search text.
                    newFormData.form_id_planta = selectedPlant.id;
                    newFormData.planta = selectedPlant.nombre;
                    setPlantSearchText(selectedPlant.nombre); // Update search text after setting form data
                }
            }

            if (parsed.nombre_encargado && newFormData.form_id_empresa && newFormData.form_id_planta) {
                const supervisorNameToFind = parsed.nombre_encargado.toLowerCase();
                const selectedSupervisor = supervisors.find(s => 
                    s.nombreEmpresa === selectedCompany?.nombre &&
                    s.nombrePlanta === selectedPlant?.nombre &&
                    `${s.nombre || ''} ${s.apellido || ''}`.trim().toLowerCase() === (parsed.nombre_encargado || '').toLowerCase()
                );
                if (selectedSupervisor) {
                    newFormData.form_id_encargado = selectedSupervisor.id;
                    newFormData.nombre_encargado = `${selectedSupervisor.nombre} ${selectedSupervisor.apellido || ''}`.trim();
                    newFormData.celular_encargado = selectedSupervisor.celular?.toString();
                    newFormData.email_encargado = selectedSupervisor.email;
                    setSupervisorSearchText(newFormData.nombre_encargado); // Update search text
                }
            }

            // Maquinas parsing
            if (parsed.maquinas && Array.isArray(parsed.maquinas)) {
                const parsedSelectedMaquinas: { machine: Machine, observaciones: string }[] = [];
                for (const machineInfo of parsed.maquinas) {
                    if (machineInfo.serie) {
                        const serieToFind = machineInfo.serie.trim().toLowerCase();
                        // Find the machine in the database list based on the serial number
                        const foundMachine = machines.find(m => 
                            m.serie && m.serie.trim().toLowerCase() === serieToFind && 
                            m.id_planta === newFormData.form_id_planta
                        );
                        
                        if (foundMachine) {
                            // If found, add it to the list with the observations from the AI
                            parsedSelectedMaquinas.push({ 
                                machine: foundMachine, 
                                observaciones: machineInfo.observaciones || '' 
                            });
                        } else {
                            console.warn(`Machine with serial "${machineInfo.serie}" not found in database for the selected plant.`);
                        }
                    }
                }
                setSelectedMaquinas(parsedSelectedMaquinas);
            }
            
            // Only update parts of formData that are not already handled by handleSelectCompany/Plant/Supervisor
            setFormData(prev => ({ ...prev, ...newFormData }));

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
        if (!supabase || !auth?.user) return;

        // Create a mutable copy of formData to modify
        const payload: { [key: string]: any } = { 
            ...formData, 
            fecha: formData.fecha || null,
            id_usuario: auth.user.id,
            maquinas: selectedMaquinas.map(item => `${item.machine.serie} - ${item.machine.modelo || ''}: ${item.observaciones}`),
        };

        // Handle new image uploads and convert to Base64
        if (fotosObservaciones.length > 0) {
            payload.foto_observaciones = await fileToBase64(fotosObservaciones[0]);
        }
        if (fotosSugerencias.length > 0) {
            payload.foto_sugerencias = await fileToBase64(fotosSugerencias[0]);
        }
        if (fotoFirma.length > 0) {
            payload.firma = await fileToBase64(fotoFirma[0]);
        }
        
        // Clean up temporary form state fields before sending to DB
        delete payload.form_id_empresa;
        delete payload.form_id_planta;
        delete payload.form_id_encargado;
        
        // Also remove other temporary/UI-only fields
        delete (payload as any).usuario;
        delete (payload as any).selected_empresa_pdf;
        delete (payload as any).selected_planta_pdf;
        delete (payload as any).selected_encargado_pdf;
        delete (payload as any).selected_maquinas_pdf;
        delete (payload as any).fotosObservacionesBase64;
        delete (payload as any).fotosSugerenciasBase64;
        delete (payload as any).fotoFirmaBase64;

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
                    <div className="flex items-start"><SparklesIcon className="h-8 w-8 text-primary mr-3 shrink-0"/><div><h3 className="font-bold text-lg text-primary">Autocompletado con IA</h3><p className="text-sm text-neutral">Sube una orden de trabajo (PDF/Imagen) para rellenar campos.</p></div></div>
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
                        <div><label htmlFor="fecha" className="block text-sm font-medium">Fecha</label><input type="date" name="fecha" value={formData.fecha || ''} onChange={handleChange} className="mt-1 block w-full input-style" /></div>
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

                <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg space-y-4">
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
                        {/* New separate fields for supervisor */}
                        <div>
                            <label htmlFor="nombre_encargado" className="block text-sm font-medium">Nombre del Encargado</label>
                            <input type="text" name="nombre_encargado" value={formData.nombre_encargado || ''} onChange={handleChange} className="mt-1 block w-full input-style" />
                        </div>
                        <div>
                            <label htmlFor="celular_encargado" className="block text-sm font-medium">Celular del Encargado</label>
                            <input type="text" name="celular_encargado" value={formData.celular_encargado || ''} onChange={handleChange} className="mt-1 block w-full input-style" />
                        </div>
                        <div>
                            <label htmlFor="email_encargado" className="block text-sm font-medium">Email del Encargado</label>
                            <input type="email" name="email_encargado" value={formData.email_encargado || ''} onChange={handleChange} className="mt-1 block w-full input-style" />
                        </div>
                        {/* End new fields */}

                        <div><label htmlFor="nombre_operador" className="block text-sm font-medium">Nombre Operador</label><input type="text" name="nombre_operador" value={formData.nombre_operador || ''} onChange={handleChange} className="mt-1 block w-full input-style" /></div>
                        <div><label htmlFor="celular_operador" className="block text-sm font-medium">Celular Operador</label><input type="text" name="celular_operador" value={formData.celular_operador || ''} onChange={handleChange} className="mt-1 block w-full input-style" /></div>
                    </div>
                </div>

                <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg space-y-4">
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
                            <div className="flex items-center gap-2 mt-1">
                                <div className="relative flex-grow">
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
                                                    onMouseDown={() => handleSelectMachine(machine)}
                                                    className="px-3 py-2 cursor-pointer hover:bg-base-300"
                                                >
                                                    {machine.serie} - {machine.modelo}
                                                </li>
                                            ))}
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
                    <div><label htmlFor="sugerencias" className="block text-sm font-medium">Sugerencias</label><textarea name="sugerencias" rows={3} value={formData.sugerencias || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea><ImageUpload id="fotos-sugerencias" label="" files={fotosSugerencias} onFilesChange={setFotosSugerencias} multiple={false} existingImageUrls={formData.foto_sugerencias ? [formData.foto_sugerencias] : []} onRemoveExisting={() => setFormData(prev => ({...prev, foto_sugerencias: null}))} /></div>
                    <div><ImageUpload id="fotos-observaciones" label="Fotos Generales / Observaciones" files={fotosObservaciones} onFilesChange={setFotosObservaciones} multiple={false} existingImageUrls={formData.foto_observaciones ? [formData.foto_observaciones] : []} onRemoveExisting={() => setFormData(prev => ({...prev, foto_observaciones: null}))} /></div>
                </div>
                
                 <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg">
                     <h3 className="text-xl font-semibold border-b border-base-border pb-2">Conformidad del Cliente</h3>
                     <p className="text-sm mt-2 text-neutral">La firma corresponde al Encargado de Planta seleccionado.</p>
                     <ImageUpload id="foto-firma" label="Firma de Conformidad" files={fotoFirma} onFilesChange={setFotoFirma} multiple={false} existingImageUrls={formData.firma ? [formData.firma] : []} onRemoveExisting={() => setFormData(prev => ({...prev, firma: null}))} />
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
        <Modal isOpen={isCompanySearchModalOpen} onClose={() => setIsCompanySearchModalOpen(false)} title="Buscar Empresa"><ul className="max-h-80 overflow-y-auto divide-y divide-base-border custom-scrollbar">{companies.map(c => <li key={c.id} onMouseDown={() => handleSelectCompany(c)} className="p-3 cursor-pointer hover:bg-base-300">{c.nombre}</li>)}</ul></Modal>
        
        <Modal isOpen={isNewPlantModalOpen} onClose={() => setIsNewPlantModalOpen(false)} title="Añadir Nueva Planta"><PlantForm plant={null} onSave={handlePlantSaved} onCancel={() => setIsNewPlantModalOpen(false)}/></Modal>
        <Modal isOpen={isPlantSearchModalOpen} onClose={() => setIsPlantSearchModalOpen(false)} title="Buscar Planta"><ul className="max-h-80 overflow-y-auto divide-y divide-base-border custom-scrollbar">{filteredPlants.map(p => <li key={p.id} onMouseDown={() => handleSelectPlant(p)} className="p-3 cursor-pointer hover:bg-base-300">{p.nombre}</li>)}</ul></Modal>

        <Modal isOpen={isNewSupervisorModalOpen} onClose={() => setIsNewSupervisorModalOpen(false)} title="Añadir Nuevo Encargado"><SupervisorForm supervisor={null} onSave={handleSupervisorSaved} onCancel={() => setIsNewSupervisorModalOpen(false)} defaultCompanyName={selectedCompanyForNewSupervisor?.nombre} defaultPlantName={selectedPlantForNewSupervisor?.nombre} /></Modal>
        <Modal isOpen={isSupervisorSearchModalOpen} onClose={() => setIsSupervisorSearchModalOpen(false)} title="Buscar Encargado"><ul className="max-h-80 overflow-y-auto divide-y divide-base-border custom-scrollbar">{filteredSupervisors.map(s => <li key={s.id} onMouseDown={() => handleSelectSupervisor(s)} className="p-3 cursor-pointer hover:bg-base-300">{s.nombre} {s.apellido}</li>)}</ul></Modal>
        
        {/* New Modals for Machine management in VisitReportForm */}
        <Modal isOpen={isNewMachineModalOpen} onClose={() => setIsNewMachineModalOpen(false)} title="Añadir Nueva Máquina">
            <MachineForm 
                machine={null} 
                onSave={handleMachineSaved} 
                onCancel={() => setIsNewMachineModalOpen(false)} 
                defaultCompanyId={selectedCompanyForNewMachine?.id} // Pass selected company to pre-fill
                defaultPlantId={selectedPlantForNewMachine?.id} // Pass selected plant to pre-fill
            />
        </Modal>
        <Modal isOpen={isMachineSearchModalOpen} onClose={() => setIsMachineSearchModalOpen(false)} title="Buscar Máquina">
            <ul className="max-h-80 overflow-y-auto divide-y divide-base-border custom-scrollbar">
                {availableMachinesForPlant.map(m => ( // Show only machines for the selected plant
                    <li key={m.id} onMouseDown={() => handleSelectMachine(m)} className="px-3 py-2 cursor-pointer hover:bg-base-300">
                        {m.serie} - {m.modelo} ({m.marca})
                    </li>
                ))}
                {availableMachinesForPlant.length === 0 && (
                    <li className="px-3 py-2 text-center text-neutral">No hay máquinas disponibles para esta planta.</li>
                )}
            </ul>
        </Modal>
    </div>
  );
};

export default VisitReportForm;