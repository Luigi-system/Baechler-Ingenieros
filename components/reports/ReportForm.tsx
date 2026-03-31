
import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import { Type } from "@google/genai";
import { 
    UploadIcon, SparklesIcon, BackIcon, UserPlusIcon, SearchIcon, PlusIcon, 
    DownloadIcon, ViewIcon, EyeOffIcon, AlertTriangleIcon, ClockIcon, 
    BriefcaseIcon, MapPinIcon, ChevronLeftIcon, ChevronDownIcon 
} from '../ui/Icons';
import TimePicker from '../ui/TimePicker';
import Spinner from '../ui/Spinner';
import Modal from '../ui/Modal';
import CompanyForm from '../management/companies/CompanyForm';
import MachineForm from '../management/machines/MachineForm';
import PlantForm from '../management/plants/PlantForm';
import SupervisorForm from '../management/supervisors/SupervisorForm';
import ImageUpload from '../ui/ImageUpload'; // Import the new reusable component
import { AuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { pdf } from '@react-pdf/renderer';
import ServiceReportPdf from './ServiceReportPdf';
import PdfViewer, { PdfViewerHandle } from '../ui/PdfViewer';
import type { ServiceReport, Company, Plant, Machine, Supervisor } from '../../types';
import { useFormDraft } from '../../hooks/useFormDraft';

interface ReportFormProps {
  reportId?: string | null;
  onBack: () => void;
  initialAiData?: any;
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
const ReportForm: React.FC<ReportFormProps> = ({ reportId, onBack, initialAiData }) => {
    const auth = useContext(AuthContext);
    const { logoUrl } = useTheme();

    const [formData, setFormData] = useState<Partial<ServiceReport>>({ fecha: new Date().toISOString().split('T')[0], estado: true });
    

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

    // Draft Management
    const { clearDraft } = useFormDraft<ServiceReport>(
        'service_report_draft',
        formData,
        setFormData,
        !reportId,
        [
            { name: 'fotos_problemas', files: fotosProblemas, setFiles: setFotosProblemas },
            { name: 'fotos_acciones', files: fotosAcciones, setFiles: setFotosAcciones },
            { name: 'foto_firma', files: fotoFirma, setFiles: setFotoFirma },
        ]
    );

    // UI States
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isPlantsLoading, setIsPlantsLoading] = useState(false);
    const [isMachinesAndSupervisorsLoading, setIsMachinesAndSupervisorsLoading] = useState(false);

    // Populate form with AI data when it arrives from the header
    useEffect(() => {
        if (!initialAiData) return;
        setFormData(prev => ({
            ...prev,
            ...initialAiData,
            fecha: initialAiData.fecha || prev.fecha
        }));
    }, [initialAiData]);

    // Simulator States
    const [isSimulatorVisible, setIsSimulatorVisible] = useState(true);
    const pdfViewerRef = useRef<PdfViewerHandle>(null);
    const [pdfPreviewUri, setPdfPreviewUri] = useState<string | null>(null);
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const debounceTimeout = useRef<number | null>(null);

    // Resizing States (Desktop only)
    const [splitWeight, setSplitWeight] = useState(50); // percentage for the first (form) column
    const [isResizing, setIsResizing] = useState(false);

    const startResizing = useCallback(() => setIsResizing(true), []);
    const stopResizing = useCallback(() => setIsResizing(false), []);
    const resize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            const newWeight = (e.clientX / window.innerWidth) * 100;
            if (newWeight > 20 && newWeight < 80) setSplitWeight(newWeight);
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

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
    
    // Internal modal search terms
    const [modalSearchText, setModalSearchText] = useState('');
    
    // Sync search fields when draft is loaded
    useEffect(() => {
        if (formData.empresa_nombre && !companySearchText) setCompanySearchText(formData.empresa_nombre);
        if (formData.empresa_planta && !plantSearchText) setPlantSearchText(formData.empresa_planta);
        if (formData.maquina_serie && !machineSearchText) setMachineSearchText(formData.maquina_serie);
        if (formData.encargado_nombre && !supervisorSearchText) setSupervisorSearchText(formData.encargado_nombre);
    }, [formData.empresa_nombre, formData.empresa_planta, formData.maquina_serie, formData.encargado_nombre]);
    
    const fetchDropdownData = useCallback(async () => {
        try {
            const [companyRes, plantRes, machineRes, supervisorRes] = await Promise.all([
                fetch('https://app.lr-system.com/bi/empresas/getall').then(res => res.json()),
                fetch('https://app.lr-system.com/bi/planta/getall').then(res => res.json()),
                fetch('https://app.lr-system.com/bi/maquinas/getall').then(res => res.json()),
                fetch('https://app.lr-system.com/bi/encargado/getall').then(res => res.json()),
            ]);
            
            const companiesData = Array.isArray(companyRes) ? companyRes : (companyRes.data || []);
            const plantsData = Array.isArray(plantRes) ? plantRes : (plantRes.data || []);
            const machinesData = Array.isArray(machineRes) ? machineRes : (machineRes.data || []);
            const supervisorsData = Array.isArray(supervisorRes) ? supervisorRes : (supervisorRes.data || []);

            setCompanies(companiesData);
            setPlants(plantsData);
            setMachines(machinesData);
            setSupervisors(supervisorsData);
            return { companies: companiesData, plants: plantsData, machines: machinesData, supervisors: supervisorsData };
        } catch (error: any) {
             console.error("Error fetching dropdown data", error);
             return { companies: [], plants: [], machines: [], supervisors: [] };
        }
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsDataLoading(true);

            const { companies, plants, supervisors } = await fetchDropdownData();

            if (reportId) {
                try {
                    const res = await fetch(`https://app.lr-system.com/bi/reporte-servicio/get/${reportId}`);
                    const data = await res.json();
                    const reportData = Array.isArray(data) ? data[0] : (data.data || data);

                    const formatDateForInput = (dateStr: any) => {
                        if (!dateStr) return '';
                        if (String(dateStr).includes('T')) return String(dateStr).split('T')[0];
                        return dateStr;
                    };

                    const formatTimeForInput = (timeStr: any) => {
                        if (!timeStr) return '';
                        if (String(timeStr).includes('T')) {
                            const date = new Date(timeStr);
                            if (!isNaN(date.getTime())) {
                                return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
                            }
                        }
                        if (/^\d{2}:\d{2}/.test(String(timeStr))) return String(timeStr).substring(0, 5);
                        return timeStr;
                    };

                    if (reportData) {
                        const company = companies.find(c => c.nombre === reportData.empresa_nombre);
                        const plant = company ? plants.find(p => p.id_empresa === company.id && p.nombre === reportData.empresa_planta) : undefined;
                        const supervisor = (company && plant) ? supervisors.find(s => s.nombreEmpresa === company.nombre && s.nombrePlanta === plant.nombre && `${s.nombres} ${s.apellidos || ''}`.trim() === reportData.encargado_nombre) : undefined;

                        setFormInternalState({
                            selectedCompanyId: company?.id,
                            selectedPlantId: plant?.id,
                            selectedSupervisorId: supervisor?.id,
                        });
                        
                        const formDataToSet: Partial<ServiceReport> = { 
                            ...reportData,
                            fecha: formatDateForInput(reportData.fecha),
                            hora_entrada: formatTimeForInput(reportData.hora_entrada),
                            hora_salida: formatTimeForInput(reportData.hora_salida)
                        };

                        // Handle images that might be comma-separated strings from API
                        const processImages = (imgs: any) => {
                            if (typeof imgs === 'string' && imgs.length > 0) return imgs.split(',').filter(Boolean).map(toDataURL);
                            if (Array.isArray(imgs)) return imgs.filter(Boolean).map(toDataURL);
                            return [];
                        };

                        formDataToSet.foto_problemas_encontrados = processImages(reportData.foto_problemas_encontrados);
                        formDataToSet.foto_acciones_realizadas = processImages(reportData.foto_acciones_realizadas);
                        formDataToSet.foto_firma = reportData.foto_firma ? toDataURL(reportData.foto_firma) : null;

                        if (reportData.operario === 1 || reportData.operario === 'true' || reportData.operario === true) formDataToSet.estado_maquina = 'operativo';
                        else if (reportData.en_prueba === 1 || reportData.en_prueba === 'true' || reportData.en_prueba === true) formDataToSet.estado_maquina = 'en_prueba';
                        else formDataToSet.estado_maquina = 'inoperativo';
                        
                        if (reportData.garantia === 1 || reportData.garantia === 'true' || reportData.garantia === true) formDataToSet.estado_garantia = 'con_garantia';
                        else formDataToSet.estado_garantia = 'sin_garantia';

                        if (reportData.facturado === 1 || reportData.facturado === 'true' || reportData.facturado === true) formDataToSet.estado_facturacion = 'facturado';
                        else formDataToSet.estado_facturacion = 'no_facturado';
                        
                        formDataToSet.estado = reportData.estado === 'Finalizado' || reportData.estado === 1 || reportData.estado === true;
                        
                        setFormData(formDataToSet);

                        if (reportData.empresa_nombre) setCompanySearchText(reportData.empresa_nombre);
                        if (reportData.empresa_planta) setPlantSearchText(reportData.empresa_planta);
                        if (reportData.maquina_serie) setMachineSearchText(reportData.maquina_serie);
                        if (reportData.encargado_nombre) setSupervisorSearchText(reportData.encargado_nombre);
                    }
                } catch (err: any) {
                    console.error("Error fetching report for editing:", err);
                    alert("No se pudo cargar el reporte para editar.");
                }
            }
            setIsDataLoading(false);
        };
        fetchInitialData();
    }, [reportId, fetchDropdownData]); // Keep dependencies minimal to avoid flickering

    // Draft recovery ID lookup
    useEffect(() => {
        if (reportId || companies.length === 0) return;
        
        const updates: Partial<FormInternalState> = {};
        let changed = false;

        // Company
        if (formData.empresa_nombre && !formInternalState.selectedCompanyId) {
            const company = companies.find(c => c.nombre === formData.empresa_nombre);
            if (company) {
                updates.selectedCompanyId = company.id;
                changed = true;
            }
        }

        // Plant - Depends on company ID (either existing or just found)
        const companyId = updates.selectedCompanyId || formInternalState.selectedCompanyId;
        if (companyId && formData.empresa_planta && !formInternalState.selectedPlantId) {
            const plant = plants.find(p => String(p.id_empresa) === String(companyId) && p.nombre === formData.empresa_planta);
            if (plant) {
                updates.selectedPlantId = plant.id;
                changed = true;
                if (!plantSearchText) setPlantSearchText(plant.nombre);
            }
        }

        // Supervisor - Depends on plant ID
        const plantId = updates.selectedPlantId || formInternalState.selectedPlantId;
        if (plantId && formData.encargado_nombre && !formInternalState.selectedSupervisorId) {
            const supervisor = supervisors.find(s => 
                `${s.nombres} ${s.apellidos || ''}`.trim() === formData.encargado_nombre
            );
            if (supervisor) {
                updates.selectedSupervisorId = supervisor.id;
                changed = true;
                if (!supervisorSearchText) setSupervisorSearchText(`${supervisor.nombres} ${supervisor.apellidos || ''}`);
            }
        }

        if (changed) {
            setFormInternalState(prev => ({ ...prev, ...updates }));
        }
    }, [companies, plants, supervisors, formData.empresa_nombre, formData.empresa_planta, formData.encargado_nombre, reportId, formInternalState.selectedCompanyId, formInternalState.selectedPlantId, formInternalState.selectedSupervisorId]);
    
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

                const getExistingImages = (imgs: any) => {
                    if (!imgs) return [];
                    const process = (i: string) => {
                        const trimmed = i.trim();
                        if (trimmed.startsWith('data:') || trimmed.startsWith('http') || trimmed.startsWith('blob:')) return trimmed;
                        return `data:image/png;base64,${trimmed}`;
                    };
                    if (Array.isArray(imgs)) return imgs.filter((i: any) => !!i).map(process);
                    if (typeof imgs === 'string' && imgs.length > 0) {
                        return imgs.split(',').filter(Boolean).map(process);
                    }
                    return [];
                };

                // Combine existing data URIs with new ones
                const enrichedData: ServiceReport = {
                    ...formData,
                    usuario_nombre: auth?.user?.nombres ? `${auth.user.nombres} ${auth.user.apellidos || ''}` : 'Usuario',
                    usuario_cel: auth?.user?.celular || '',
                    fotosProblemasBase64: [
                        ...getExistingImages(formData.foto_problemas_encontrados),
                        ...newFotosProblemasBase64
                    ],
                    fotosAccionesBase64: [
                        ...getExistingImages(formData.foto_acciones_realizadas),
                        ...newFotosAccionesBase64
                    ],
                    fotoFirmaBase64: newFotoFirmaBase64 || formData.foto_firma || undefined,
                };

                // Generate PDF using @react-pdf/renderer
                const blob = await pdf(
                    <ServiceReportPdf 
                        report={enrichedData} 
                        logoUrl={logoUrl || undefined} 
                        serial={formData.codigo || '0000034'} 
                    />
                ).toBlob();
                
                const blobUrl = URL.createObjectURL(blob);
                
                setPdfPreviewUri(prev => {
                    if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
                    return blobUrl;
                });
            } catch (e) {
                console.error("Error generating PDF preview:", e);
                setPdfPreviewUri(prev => {
                    if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
                    return null;
                });
            } finally {
                 setIsPdfLoading(false);
            }
        }, 500);

        return () => {
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        };
    }, [formData, fotosProblemas, fotosAcciones, fotoFirma, logoUrl, auth?.user]);

    // Final cleanup on unmount
    useEffect(() => {
        return () => {
            setPdfPreviewUri(prev => {
                if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
                return null;
            });
        }
    }, []);


    // Memoized lists for dependent dropdowns and suggestions
    // Compare as strings since API may return id_empresa as string
    const filteredPlants = useMemo(() => {
        if (!formInternalState.selectedCompanyId) return [];
        const byId = plants.filter(p => String(p.id_empresa) === String(formInternalState.selectedCompanyId));
        if (byId.length > 0) return byId;
        // Fallback: filter by company name stored in plant
        const selectedCompany = companies.find(c => c.id === formInternalState.selectedCompanyId);
        if (!selectedCompany) return [];
        return plants.filter(p => (p.nombreempresa || '').toLowerCase() === selectedCompany.nombre.toLowerCase());
    }, [plants, formInternalState.selectedCompanyId, companies]);
    const filteredMachines = useMemo(() => {
        if (!formInternalState.selectedPlantId) return [];
        // First try numeric ID
        const byId = machines.filter(m => String(m.id_planta) === String(formInternalState.selectedPlantId));
        if (byId.length > 0) return byId;
        // Fallback: search by plant name
        const selectedPlant = plants.find(p => p.id === formInternalState.selectedPlantId);
        if (!selectedPlant) return [];
        return machines.filter(m => (m.nombre_planta || '').toLowerCase() === selectedPlant.nombre.toLowerCase() || (m.planta_nombre || '').toLowerCase() === selectedPlant.nombre.toLowerCase());
    }, [machines, formInternalState.selectedPlantId, plants]);
    
    const filteredSupervisors = useMemo(() => {
        if (!formInternalState.selectedCompanyId || !formInternalState.selectedPlantId) return [];
        const selectedCompany = companies.find(c => c.id === formInternalState.selectedCompanyId);
        const selectedPlant = plants.find(p => p.id === formInternalState.selectedPlantId);
        if (!selectedCompany || !selectedPlant) return [];

        return supervisors.filter(s =>
            (s.nombreEmpresa || '').toLowerCase() === selectedCompany.nombre.toLowerCase() &&
            (s.nombrePlanta || '').toLowerCase() === selectedPlant.nombre.toLowerCase()
        );
    }, [formInternalState, companies, plants, supervisors]);
    const companySuggestions = useMemo(() => companies.filter(c => (c.nombre || '').toLowerCase().includes((companySearchText || '').toLowerCase())).slice(0, 10), [companySearchText, companies]);
    const plantSuggestions = useMemo(() => filteredPlants.filter(p => (p.nombre || '').toLowerCase().includes((plantSearchText || '').toLowerCase())).slice(0, 10), [plantSearchText, filteredPlants]);
    const machineSuggestions = useMemo(() => filteredMachines.filter(m => (m.serie || '').toLowerCase().includes((machineSearchText || '').toLowerCase())).slice(0, 10), [machineSearchText, filteredMachines]);
    const supervisorSuggestions = useMemo(() => filteredSupervisors.filter(s => `${s.nombres || ''} ${s.apellidos || ''}`.toLowerCase().includes((supervisorSearchText || '').toLowerCase())).slice(0, 10), [supervisorSearchText, filteredSupervisors]);
 

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
        setFormData(prev => ({ ...prev, empresa_nombre: company.nombre, empresa_planta: undefined, maquina_serie: undefined, maquina_modelo: undefined, maquina_marca: undefined, maquina_linea: undefined, encargado_nombre: undefined, encargado_cel: undefined }));
        setCompanySearchText(company.nombre);
        setPlantSearchText(''); setMachineSearchText(''); setSupervisorSearchText('');
        setShowCompanySuggestions(false);
        setIsCompanySearchModalOpen(false);
        // Fetch plants by company name for maximum reliability
        fetch(`https://app.lr-system.com/bi/planta/by-empresa/${encodeURIComponent(company.nombre)}`)
            .then(r => r.json())
            .then(res => {
                const data = Array.isArray(res) ? res : (res.data || []);
                if (data.length > 0) {
                    setPlants(prev => {
                        // Merge: keep plants not from this company, add fetched ones
                        const others = prev.filter(p => String(p.id_empresa) !== String(company.id) && (p.nombreempresa || '').toLowerCase() !== company.nombre.toLowerCase());
                        return [...others, ...data];
                    });
                }
            })
            .catch(() => {})
            .finally(() => setIsPlantsLoading(false));
    }, []);
    
    const handleSelectPlant = useCallback((plant: Plant) => {
        setIsMachinesAndSupervisorsLoading(true);
        setFormInternalState(prev => ({...prev, selectedPlantId: plant.id, selectedSupervisorId: undefined}));
        setFormData(prev => ({
            ...prev,
            empresa_planta: plant.nombre,
            maquina_serie: undefined, maquina_modelo: undefined, maquina_marca: undefined, maquina_linea: undefined,
            encargado_nombre: undefined, encargado_cel: undefined
        }));
        setPlantSearchText(plant.nombre);
        setMachineSearchText(''); setSupervisorSearchText('');
        setShowPlantSuggestions(false);
        setIsPlantSearchModalOpen(false);
        // Fetch machines for this company + plant
        const companyName = plant.nombreempresa || '';
        const plantName = plant.nombre || '';
        if (companyName && plantName) {
            fetch(`https://app.lr-system.com/bi/maquinas/by-empresa-planta/${encodeURIComponent(companyName)}/${encodeURIComponent(plantName)}`)
                .then(r => r.json())
                .then(res => {
                    const data = Array.isArray(res) ? res : (res.data || []);
                    if (data.length > 0) {
                        setMachines(prev => {
                            const newIds = new Set(data.map((m: any) => m.id));
                            const others = prev.filter(m => !newIds.has(m.id));
                            return [...others, ...data];
                        });
                    }
                })
                .catch(() => {})
                .finally(() => setIsMachinesAndSupervisorsLoading(false));
        } else {
            setIsMachinesAndSupervisorsLoading(false);
        }
    }, []);
    
    const handleSelectMachine = useCallback((machine: Machine) => {
        setFormData(prev => ({ ...prev, maquina_serie: machine.serie, maquina_modelo: machine.modelo, maquina_marca: machine.marca, maquina_linea: machine.linea }));
        setMachineSearchText(machine.serie);
        setShowMachineSuggestions(false);
        setIsMachineSearchModalOpen(false);
    }, []);

    const handleSelectSupervisor = useCallback((supervisor: Supervisor) => {
        setFormInternalState(prev => ({...prev, selectedSupervisorId: supervisor.id}));
        setFormData(prev => ({ ...prev, encargado_nombre: `${supervisor.nombres} ${supervisor.apellidos || ''}`, encargado_cel: supervisor.celular?.toString() }));
        setSupervisorSearchText(`${supervisor.nombres} ${supervisor.apellidos || ''}`);
        setShowSupervisorSuggestions(false);
        setIsSupervisorSearchModalOpen(false);
    }, []);

    const handleCompanySaved = useCallback(async (newCompany: Company) => {
        await fetchDropdownData(); handleSelectCompany(newCompany); setIsNewCompanyModalOpen(false);
    }, [fetchDropdownData, handleSelectCompany]);
    
    const handlePlantSaved = useCallback(async () => {
        await fetchDropdownData(); setIsNewPlantModalOpen(false);
    }, [fetchDropdownData]);

    const handleMachineSaved = useCallback(async () => {
        await fetchDropdownData(); setIsNewMachineModalOpen(false);
    }, [fetchDropdownData]);

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
        // AI Autocomplete has been removed as per user request
        alert("El servicio de IA ha sido desactivado.");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (!auth?.user) {
            setIsSubmitting(false);
            return;
        }

        try {
            const convertFilesToBase64 = async (files: File[]): Promise<string[]> => {
                if (files.length === 0) return [];
                const base64Promises = files.map(file => fileToPngDataUrl(file));
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
                ? await fileToPngDataUrl(fotoFirma[0]) 
                : null;

            const getExistingBase64 = (imgs: any) => {
                if (typeof imgs === 'string' && imgs.length > 0) return imgs.split(',').filter(Boolean).map(stripDataUriPrefix);
                if (Array.isArray(imgs)) return imgs.filter((uri: any): uri is string => !!uri).map(stripDataUriPrefix);
                return [];
            };
            
            // Create a comprehensive data object for the PDF generator
            const pdfDataObject: ServiceReport = {
                ...formData,
                usuario_nombre: auth.user.nombres ?? 'N/A',
                fotosProblemasBase64: [
                    ...getExistingBase64(formData.foto_problemas_encontrados),
                    ...(await Promise.all(fotosProblemas.map(fileToPngDataUrl))).map(stripDataUriPrefix)
                ],
                fotosAccionesBase64: [
                    ...getExistingBase64(formData.foto_acciones_realizadas),
                    ...(await Promise.all(fotosAcciones.map(fileToPngDataUrl))).map(stripDataUriPrefix)
                ],
                fotoFirmaBase64: newFirmaB64 || (formData.foto_firma ? stripDataUriPrefix(formData.foto_firma) : undefined),
            };

            const pdfBlob = await pdf(
                <ServiceReportPdf 
                    report={pdfDataObject} 
                    logoUrl={logoUrl || undefined} 
                    serial={formData.codigo || '0000034'} 
                />
            ).toBlob();
            
            const pdfBase64Promise = new Promise<string | null>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const res = reader.result as string;
                    resolve(res as string); // Keep full Data URL (data:application/pdf;base64,...)
                };
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(pdfBlob);
            });
            const pdfBase64 = await pdfBase64Promise;

            const finalPayload: { [key: string]: any } = {
                codigo: formData.codigo,
                fecha: formData.fecha,
                hora_entrada: formData.hora_entrada,
                hora_salida: formData.hora_salida,
                empresa_nombre: formData.empresa_nombre,
                empresa_planta: formData.empresa_planta,
                encargado_nombre: formData.encargado_nombre,
                encargado_cel: formData.encargado_cel,
                maquina_linea: formData.maquina_linea,
                maquina_marca: formData.maquina_marca,
                maquina_serie: formData.maquina_serie,
                maquina_modelo: formData.maquina_modelo,
                problemas_encontrados: formData.problemas_encontrados,
                acciones_realizadas: formData.acciones_realizadas,
                observaciones: formData.observaciones,
                control_interno: formData.control_interno,
                // Align with user's specific types: booleans as 0 or 1
                operario: formData.estado_maquina === 'operativo' ? 1 : 0,
                en_prueba: formData.estado_maquina === 'en_prueba' ? 1 : 0,
                garantia: formData.estado_garantia === 'con_garantia' ? 1 : 0,
                facturado: formData.estado_facturacion === 'facturado' ? 1 : 0,
                estado: formData.estado ? 1 : 0,
                usuario_nombre: auth.user.nombres,
                usuario_cel: auth.user.celular?.toString(),
                
                foto_problemas_encontrados: [...getExistingBase64(formData.foto_problemas_encontrados), ...newProblemasB64].join(','),
                foto_acciones_realizadas: [...getExistingBase64(formData.foto_acciones_realizadas), ...newAccionesB64].join(','),
                foto_firma: newFirmaB64 || (formData.foto_firma ? stripDataUriPrefix(formData.foto_firma) : null),
                pdf: pdfBase64,
            };

            const url = reportId 
                ? `https://app.lr-system.com/bi/reporte-servicio/update/${reportId}`
                : `https://app.lr-system.com/bi/reporte-servicio/create`;
            
            const method = reportId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalPayload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error del servidor: ${response.status}`);
            }
            
            // Clear draft on success
            if (!reportId) clearDraft();
            
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
        if (!reportId) {
            alert("Guarde el reporte primero para poder descargarlo.");
            return;
        }
        setIsDownloadingPdf(true);
        try {
            const res = await fetch(`https://app.lr-system.com/bi/reporte-servicio/get/${reportId}`);
            const data = await res.json();
            const reportData = Array.isArray(data) ? data[0] : (data.data || data);
            
            if (!reportData) throw new Error("No se encontró el reporte.");
            
            const pdfBlob = await pdf(
                <ServiceReportPdf 
                    report={reportData as ServiceReport} 
                    logoUrl={logoUrl || undefined} 
                    serial={reportData.codigo || '0000034'} 
                />
            ).toBlob();
            
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Reporte_${reportData.codigo || reportId}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
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
    <div className={`flex flex-col lg:flex-row h-full gap-0 relative overflow-hidden ${isResizing ? 'cursor-col-resize select-none' : ''}`}>
        {/* Form Container */}
        <div 
            style={{ width: isSimulatorVisible && window.innerWidth >= 1024 ? `${splitWeight}%` : undefined }}
            className={`w-full ${!isSimulatorVisible ? 'lg:w-[calc(100%-3.5rem)]' : 'lg:flex-none'} overflow-y-auto custom-scrollbar transition-all duration-300 ${isSimulatorVisible && window.innerWidth < 1024 ? 'blur-sm pointer-events-none' : ''}`}
        >
            <form onSubmit={handleSubmit} className="space-y-8 pt-4 pb-20 md:pb-4 px-1 pr-4">
                
                <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg space-y-6 border border-base-border">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Información General</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {reportId && (
                            <div>
                                <label htmlFor="codigo" className="block text-sm font-medium">ID del Reporte</label>
                                <div className="mt-1 flex items-center h-[42px] px-3 bg-base-300/50 rounded-lg border border-base-border text-primary font-black">
                                    #{String(reportId).padStart(4, '0')}
                                </div>
                            </div>
                        )}
                        <div><label htmlFor="fecha" className="block text-sm font-medium">Fecha</label><input type="date" name="fecha" value={formData.fecha || ''} onChange={handleChange} className="mt-1 block w-full input-style" /></div>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label htmlFor="hora_entrada" className="block text-sm font-medium whitespace-nowrap"><span className="hidden 2xl:inline">Hora </span><span className="2xl:hidden">H. </span>Entrada</label><TimePicker value={formData.hora_entrada || ''} onChange={(val) => setFormData(prev => ({...prev, hora_entrada: val}))} className="mt-1" /></div>
                            <div><label htmlFor="hora_salida" className="block text-sm font-medium whitespace-nowrap"><span className="hidden 2xl:inline">Hora </span><span className="2xl:hidden">H. </span>Salida</label><TimePicker value={formData.hora_salida || ''} onChange={(val) => setFormData(prev => ({...prev, hora_salida: val}))} className="mt-1" align="right" /></div>
                        </div>
                    </div>
                </div>

                <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg space-y-6 border border-base-border">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Cliente y Equipo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
                        {/* Empresa */}
                        <div>
                            <label htmlFor="company-search" className="block text-sm font-medium">Empresa</label>
                            <div onBlur={() => setTimeout(() => setShowCompanySuggestions(false), 100)}>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="relative flex-grow">
                                        <input id="company-search" type="text" value={companySearchText} onChange={(e) => { const val = e.target.value; setCompanySearchText(val); setFormData(prev => ({ ...prev, empresa_nombre: val })); }} onFocus={() => setShowCompanySuggestions(true)} placeholder="Escribir o buscar empresa..." className="w-full input-style" autoComplete="off" />
                                        {showCompanySuggestions && companySuggestions.length > 0 && (
                                            <ul className="absolute z-20 w-full bg-base-200 border border-base-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg custom-scrollbar">
                                                {companySuggestions.map(c => <li key={c.id} onMouseDown={() => handleSelectCompany(c)} className="px-3 py-2 cursor-pointer hover:bg-base-300">{c.nombre}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => setIsNewCompanyModalOpen(true)} className="p-2.5 rounded-md hover:bg-base-300 transition text-base-content" title="Crear Nueva Empresa"><UserPlusIcon className="h-5 w-5"/></button>
                                    <button type="button" onClick={() => setIsCompanySearchModalOpen(true)} className="p-2.5 rounded-md hover:bg-base-300 transition text-base-content" title="Buscar Empresa"><SearchIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        </div>
                        {/* Planta */}
                        <div>
                            <label htmlFor="plant-search" className="block text-sm font-medium flex items-center gap-2">Planta / Sede {isPlantsLoading && <Spinner />}</label>
                            <div onBlur={() => setTimeout(() => setShowPlantSuggestions(false), 100)}>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="relative flex-grow">
                                        <input id="plant-search" type="text" value={plantSearchText} onChange={(e) => { setPlantSearchText(e.target.value); setFormData(prev => ({...prev, empresa_planta: e.target.value })) }} onFocus={() => setShowPlantSuggestions(true)} disabled={!formInternalState.selectedCompanyId} placeholder="Escribir o seleccionar Planta..." className="w-full input-style" autoComplete="off" />
                                        {showPlantSuggestions && plantSuggestions.length > 0 && (
                                            <ul className="absolute z-20 w-full bg-base-200 border border-base-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg custom-scrollbar">
                                                {plantSuggestions.map(p => <li key={p.id} onMouseDown={() => handleSelectPlant(p)} className="px-3 py-2 cursor-pointer hover:bg-base-300">{p.nombre}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => setIsNewPlantModalOpen(true)} disabled={!formInternalState.selectedCompanyId} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50 text-base-content" title="Crear Nueva Planta"><PlusIcon className="h-5 w-5"/></button>
                                    <button type="button" onClick={() => setIsPlantSearchModalOpen(true)} disabled={!formInternalState.selectedCompanyId} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50 text-base-content" title="Buscar Planta"><SearchIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        </div>
                        {/* Encargado */}
                        <div>
                            <label htmlFor="supervisor-search" className="block text-sm font-medium flex items-center gap-2 whitespace-nowrap">
                                <span className="hidden 2xl:inline">Encargado de Planta</span>
                                <span className="2xl:hidden">Encargado</span>
                                {isMachinesAndSupervisorsLoading && <Spinner />}
                            </label>
                            <div onBlur={() => setTimeout(() => setShowSupervisorSuggestions(false), 100)}>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="relative flex-grow">
                                        <input id="supervisor-search" type="text" value={supervisorSearchText} onChange={(e) => { const val = e.target.value; setSupervisorSearchText(val); setFormData(prev => ({ ...prev, encargado_nombre: val })); }} onFocus={() => setShowSupervisorSuggestions(true)} disabled={!formInternalState.selectedPlantId} placeholder="Escribir o buscar encargado..." className="w-full input-style" autoComplete="off" />
                                        {showSupervisorSuggestions && supervisorSuggestions.length > 0 && (
                                            <ul className="absolute z-10 w-full bg-base-200 border border-base-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg custom-scrollbar">
                                                {supervisorSuggestions.map(s => <li key={s.id} onMouseDown={() => handleSelectSupervisor(s)} className="p-3 cursor-pointer hover:bg-base-300">{s.nombres} {s.apellidos}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => setIsNewSupervisorModalOpen(true)} disabled={!formInternalState.selectedPlantId} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50 text-base-content" title="Crear Nuevo Encargado"><UserPlusIcon className="h-5 w-5"/></button>
                                    <button type="button" onClick={() => setIsSupervisorSearchModalOpen(true)} disabled={!formInternalState.selectedPlantId} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50 text-base-content" title="Buscar Encargado"><SearchIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        </div>
                         {/* Maquina */}
                        <div>
                            <label htmlFor="machine-search" className="block text-sm font-medium flex items-center gap-2 whitespace-nowrap">
                                <span className="hidden 2xl:inline">Máquina (N° Serie)</span>
                                <span className="2xl:hidden">Máquina</span>
                                {isMachinesAndSupervisorsLoading && <Spinner />}
                            </label>
                            <div onBlur={() => setTimeout(() => setShowMachineSuggestions(false), 100)}>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="relative flex-grow">
                                        <input id="machine-search" type="text" value={machineSearchText} onChange={(e) => { const val = e.target.value; setMachineSearchText(val); setFormData(prev => ({ ...prev, maquina_serie: val })); }} onFocus={() => setShowMachineSuggestions(true)} disabled={!formInternalState.selectedPlantId} placeholder="Escribir o buscar N° Serie..." className="w-full input-style" autoComplete="off" />
                                        {showMachineSuggestions && machineSuggestions.length > 0 && (
                                            <ul className="absolute z-10 w-full bg-base-200 border border-base-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg custom-scrollbar">
                                                {machineSuggestions.map(m => <li key={m.id} onMouseDown={() => handleSelectMachine(m)} className="px-3 py-2 cursor-pointer hover:bg-base-300">{m.serie}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => setIsNewMachineModalOpen(true)} disabled={!formInternalState.selectedPlantId} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50 text-base-content" title="Crear Nueva Máquina"><PlusIcon className="h-5 w-5"/></button>
                                    <button type="button" onClick={() => setIsMachineSearchModalOpen(true)} disabled={!formInternalState.selectedPlantId} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50 text-base-content" title="Buscar Máquina"><SearchIcon className="h-5 w-5"/></button>
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

                <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg space-y-6 border border-base-border">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Detalles del Servicio</h3>
                    <div><label htmlFor="problemas_encontrados" className="block text-sm font-medium">Problemas Encontrados</label><textarea name="problemas_encontrados" rows={4} value={formData.problemas_encontrados || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea><ImageUpload id="fotos-problemas" label="" files={fotosProblemas} onFilesChange={setFotosProblemas} existingImageUrls={Array.isArray(formData.foto_problemas_encontrados) ? formData.foto_problemas_encontrados : []} onRemoveExisting={(index) => handleRemoveExistingImage('foto_problemas_encontrados', index)} /></div>
                    <div><label htmlFor="acciones_realizadas" className="block text-sm font-medium">Acciones Realizadas</label><textarea name="acciones_realizadas" rows={4} value={formData.acciones_realizadas || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea><ImageUpload id="fotos-acciones" label="" files={fotosAcciones} onFilesChange={setFotosAcciones} existingImageUrls={Array.isArray(formData.foto_acciones_realizadas) ? formData.foto_acciones_realizadas : []} onRemoveExisting={(index) => handleRemoveExistingImage('foto_acciones_realizadas', index)} /></div>
                    <div><label htmlFor="observaciones" className="block text-sm font-medium">Observaciones</label><textarea name="observaciones" rows={3} value={formData.observaciones || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea></div>
                    <div><label htmlFor="control_interno" className="block text-sm font-medium">Control Interno</label><textarea name="control_interno" rows={2} value={formData.control_interno || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea></div>
                </div>

                <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg space-y-6 border border-base-border">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Estado Final</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <fieldset><legend className="text-sm font-medium">Estado de la Máquina</legend><div className="mt-2 space-y-2">{['operativo', 'inoperativo', 'en_prueba'].map(opt => (<div key={opt} className="flex items-center"><input id={`maq_${opt}`} name="estado_maquina" type="radio" value={opt} checked={formData.estado_maquina === opt} onChange={() => handleRadioChange('estado_maquina', opt)} className="h-4 w-4 text-primary focus:ring-primary border-base-border" /><label htmlFor={`maq_${opt}`} className="ml-3 block text-sm capitalize">{opt.replace('_', ' ')}</label></div>))}</div></fieldset>
                        <fieldset><legend className="text-sm font-medium">Garantía</legend><div className="mt-2 space-y-2">{['con_garantia', 'sin_garantia'].map(opt => (<div key={opt} className="flex items-center"><input id={`gar_${opt}`} name="estado_garantia" type="radio" value={opt} checked={formData.estado_garantia === opt} onChange={() => handleRadioChange('estado_garantia', opt)} className="h-4 w-4 text-primary focus:ring-primary border-base-border" /><label htmlFor={`gar_${opt}`} className="ml-3 block text-sm capitalize">{opt.replace('_', ' ')}</label></div>))}</div></fieldset>
                        <fieldset><legend className="text-sm font-medium">Facturación</legend><div className="mt-2 space-y-2">{['facturado', 'no_facturado'].map(opt => (<div key={opt} className="flex items-center"><input id={`fac_${opt}`} name="estado_facturacion" type="radio" value={opt} checked={formData.estado_facturacion === opt} onChange={() => handleRadioChange('estado_facturacion', opt)} className="h-4 w-4 text-primary focus:ring-primary border-base-border" /><label htmlFor={`fac_${opt}`} className="ml-3 block text-sm capitalize">{opt.replace('_', ' ')}</label></div>))}</div></fieldset>
                        <fieldset><legend className="text-sm font-medium">Estado del Reporte</legend><div className="mt-2 space-y-2"><div className="flex items-center"><input id="estado" name="estado" type="checkbox" checked={!!formData.estado} onChange={handleChange} className="h-4 w-4 text-primary focus:ring-primary border-base-border rounded" /><label htmlFor="estado" className="ml-3 block text-sm">Finalizado</label></div></div></fieldset>
                    </div>
                </div>

                <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg space-y-6 border border-base-border">
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
        
        {/* Resizer Divider */}
        {isSimulatorVisible && (
            <div 
                onMouseDown={startResizing}
                className="hidden lg:flex w-3 cursor-col-resize hover:bg-primary/20 active:bg-primary/40 transition-colors items-center justify-center group z-50"
                title="Arrastra para redimensionar"
            >
                <div className="w-0.5 h-16 bg-base-border group-hover:bg-primary/50 transition-colors rounded-full" />
            </div>
        )}

        {/* PDF Preview Drawer/Panel */}
        <div 
            style={{ width: isSimulatorVisible && window.innerWidth >= 1024 ? `${100 - splitWeight}%` : undefined }}
            className={`
                fixed lg:relative top-0 right-0 h-full z-[100] lg:z-0
                transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
                bg-base-200 lg:bg-transparent shadow-2xl lg:shadow-none
                ${isSimulatorVisible 
                    ? 'w-[92%] sm:w-[80%] lg:flex-none translate-x-0' 
                    : 'w-0 translate-x-full lg:translate-x-0 lg:w-14 pointer-events-none lg:pointer-events-auto'
                }
            `}
        >
            <div className="h-full flex flex-col bg-base-300/50 lg:rounded-lg overflow-hidden lg:border lg:border-base-border relative">
                {isSimulatorVisible ? (
                    <>
                        <div className="flex-shrink-0 p-4 bg-base-200 border-b border-base-border flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                {/* Header PDF Controls - Permanently visible icons */}
                                {pdfPreviewUri && (
                                    <div className="flex items-center gap-1.5 p-1 bg-base-300 rounded-xl border border-base-border transition-all">
                                        <button type="button" onClick={() => pdfViewerRef.current?.zoomOut()} className="p-1 px-2 hover:bg-base-100 rounded-lg text-base-content transition-all border border-transparent hover:border-base-border shadow-sm active:scale-95" title="Reducir">
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" /></svg>
                                        </button>
                                        <button type="button" onClick={() => pdfViewerRef.current?.zoomIn()} className="p-1 px-2 hover:bg-base-100 rounded-lg text-base-content transition-all border border-transparent hover:border-base-border shadow-sm active:scale-95" title="Aumentar">
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                                        </button>
                                        <div className="w-px h-6 bg-base-border mx-1"></div>
                                        <button type="button" onClick={() => pdfViewerRef.current?.download()} className="p-2 bg-primary text-primary-content rounded-lg hover:bg-primary-focus transition-all active:scale-95 shadow-lg shadow-primary/20" title="Descargar PDF">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        </button>
                                    </div>
                                )}
                                <span className="hidden sm:inline font-bold text-sm uppercase tracking-wider ml-2 opacity-70">Vista Previa</span>
                            </div>
                            <button 
                                onClick={() => setIsSimulatorVisible(false)} 
                                className="p-2.5 rounded-full hover:bg-base-300 text-base-content transition-colors bg-base-100 lg:bg-transparent border border-base-border lg:border-none"
                                title="Cerrar Previsualización"
                            >
                                <EyeOffIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-grow p-1 md:p-3 relative bg-base-300 overflow-hidden flex flex-col">
                             {isPdfLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 backdrop-blur-sm transition-all"><Spinner className="h-10 w-10 text-primary" /></div>}
                            {pdfPreviewUri ? (
                                <PdfViewer 
                                    ref={pdfViewerRef}
                                    file={pdfPreviewUri} 
                                    showAllPages={true}
                                    hideToolbar={true}
                                    className="rounded-lg shadow-inner bg-white h-full" 
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-neutral p-10 text-center space-y-4">
                                    <div className="p-4 bg-base-200 rounded-full"><SparklesIcon className="h-10 w-10 opacity-30" /></div>
                                    <p className="text-sm font-medium">Llene los datos del formulario para generar la previsualización.</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div 
                        onClick={() => setIsSimulatorVisible(true)}
                        className="hidden lg:flex flex-col items-center justify-center h-full w-full cursor-pointer hover:bg-primary/10 transition-all border-l border-base-border bg-base-200 group"
                        title="Ver Previsualización PDF"
                    >
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 p-2 bg-primary/20 rounded-full group-hover:scale-110 transition-transform">
                            <ViewIcon className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-neutral [writing-mode:vertical-lr] rotate-180 py-4 opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all">
                            VISTA PREVIA PDF
                        </p>
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                    </div>
                )}
            </div>
        </div>

        {/* Floating Toggle Button (Mobile Only) */}
        {!isSimulatorVisible && (
            <button
                type="button"
                onClick={() => setIsSimulatorVisible(true)}
                className="lg:hidden fixed bottom-6 right-6 z-[90] h-14 w-14 bg-primary text-primary-content rounded-full shadow-2xl flex items-center justify-center animate-bounce duration-1000"
            >
                <ViewIcon className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-focus opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-primary-focus text-[10px] items-center justify-center font-bold">!</span>
                </span>
            </button>
        )}

        {/* Mobile Background Overlay */}
        {isSimulatorVisible && window.innerWidth < 1024 && (
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[95] lg:hidden animate-in fade-in duration-300"
                onClick={() => setIsSimulatorVisible(false)}
            />
        )}
      
      {/* Modals */}
      <Modal isOpen={isNewCompanyModalOpen} onClose={() => setIsNewCompanyModalOpen(false)} title="Añadir Nueva Empresa">
        <CompanyForm company={null} onSave={handleCompanySaved} onCancel={() => setIsNewCompanyModalOpen(false)}/>
      </Modal>
      <Modal isOpen={isCompanySearchModalOpen} onClose={() => { setIsCompanySearchModalOpen(false); setModalSearchText(''); }} title="Buscar Empresa">
        <div className="p-4 border-b border-base-border sticky top-0 bg-base-200 z-10">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral" />
                <input type="text" placeholder="Escribir nombre de empresa..." value={modalSearchText} onChange={(e) => setModalSearchText(e.target.value)} className="w-full h-12 input-style pl-11 text-base focus:ring-2" autoFocus />
            </div>
        </div>
        <ul className="max-h-96 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {companies.filter(c => c.nombre.toLowerCase().includes(modalSearchText.toLowerCase())).map(c => (
            <li key={c.id} onMouseDown={() => { handleSelectCompany(c); setModalSearchText(''); }} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-primary/10 rounded-lg transition-colors group">
              <div className="p-2 bg-base-300 rounded-md group-hover:bg-primary/20 transition-colors"><BriefcaseIcon className="h-5 w-5 text-primary" /></div>
              <span className="font-medium text-base-content">{c.nombre}</span>
            </li>
          ))}
          {companies.filter(c => c.nombre.toLowerCase().includes(modalSearchText.toLowerCase())).length === 0 && (
            <li className="py-8 text-center text-neutral italic text-sm">No se encontraron empresas con ese nombre.</li>
          )}
        </ul>
      </Modal>
      
      <Modal isOpen={isNewPlantModalOpen} onClose={() => setIsNewPlantModalOpen(false)} title="Añadir Nueva Planta">
        <PlantForm plant={null} onSave={() => { handlePlantSaved(); }} onCancel={() => setIsNewPlantModalOpen(false)}/>
      </Modal>
      <Modal isOpen={isPlantSearchModalOpen} onClose={() => { setIsPlantSearchModalOpen(false); setModalSearchText(''); }} title="Buscar Planta">
        <div className="p-4 border-b border-base-border sticky top-0 bg-base-200 z-10">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral" />
                <input type="text" placeholder="Escribir nombre de planta..." value={modalSearchText} onChange={(e) => setModalSearchText(e.target.value)} className="w-full h-12 input-style pl-11 text-base focus:ring-2" autoFocus />
            </div>
        </div>
        <ul className="max-h-96 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredPlants.filter(p => p.nombre.toLowerCase().includes(modalSearchText.toLowerCase())).map(p => (
            <li key={p.id} onMouseDown={() => { handleSelectPlant(p); setModalSearchText(''); }} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-primary/10 rounded-lg transition-colors group">
              <div className="p-2 bg-base-300 rounded-md group-hover:bg-primary/20 transition-colors"><MapPinIcon className="h-5 w-5 text-primary" /></div>
              <span className="font-medium text-base-content">{p.nombre}</span>
            </li>
          ))}
          {filteredPlants.filter(p => p.nombre.toLowerCase().includes(modalSearchText.toLowerCase())).length === 0 && (
            <li className="py-8 text-center text-neutral italic text-sm">No se encontraron plantas para esta empresa.</li>
          )}
        </ul>
      </Modal>
      
      <Modal isOpen={isNewMachineModalOpen} onClose={() => setIsNewMachineModalOpen(false)} title="Añadir Nueva Máquina">
        <MachineForm 
            machine={null} 
            onSave={() => { handleMachineSaved(); }} 
            onCancel={() => setIsNewMachineModalOpen(false)}
            defaultCompanyName={formData.empresa_nombre || companySearchText}
            defaultPlantName={formData.empresa_planta || plantSearchText}
        />
      </Modal>
      <Modal isOpen={isMachineSearchModalOpen} onClose={() => { setIsMachineSearchModalOpen(false); setModalSearchText(''); }} title="Buscar Máquina">
        <div className="p-4 border-b border-base-border sticky top-0 bg-base-200 z-10">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral" />
                <input type="text" placeholder="Buscar por serie o modelo..." value={modalSearchText} onChange={(e) => setModalSearchText(e.target.value)} className="w-full h-12 input-style pl-11 text-base focus:ring-2" autoFocus />
            </div>
        </div>
        <ul className="max-h-96 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredMachines.filter(m => (m.serie + (m.modelo || '')).toLowerCase().includes(modalSearchText.toLowerCase())).map(m => (
            <li key={m.id} onMouseDown={() => { handleSelectMachine(m); setModalSearchText(''); }} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-primary/10 rounded-lg transition-colors group">
              <div className="p-2 bg-base-300 rounded-md group-hover:bg-primary/20 transition-colors"><UploadIcon className="h-5 w-5 text-primary rotate-180" /></div>
              <div className="flex flex-col">
                <span className="font-bold text-base-content text-sm">{m.serie}</span>
                <span className="text-xs text-neutral">{m.marca} - {m.modelo}</span>
              </div>
            </li>
          ))}
          {filteredMachines.filter(m => (m.serie + (m.modelo || '')).toLowerCase().includes(modalSearchText.toLowerCase())).length === 0 && (
            <li className="py-8 text-center text-neutral italic text-sm">No se encontraron máquinas en esta planta.</li>
          )}
        </ul>
      </Modal>
 
      <Modal isOpen={isNewSupervisorModalOpen} onClose={() => setIsNewSupervisorModalOpen(false)} title="Añadir Nuevo Encargado">
        <SupervisorForm 
            supervisor={null} 
            onSave={(s) => handleSupervisorSaved(s)} 
            onCancel={() => setIsNewSupervisorModalOpen(false)} 
            defaultCompanyName={formData.empresa_nombre || companySearchText}
            defaultPlantName={formData.empresa_planta || plantSearchText}
        />
      </Modal>
      <Modal isOpen={isSupervisorSearchModalOpen} onClose={() => { setIsSupervisorSearchModalOpen(false); setModalSearchText(''); }} title="Buscar Encargado">
        <div className="p-4 border-b border-base-border sticky top-0 bg-base-200 z-10">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral" />
                <input type="text" placeholder="Buscar por nombre..." value={modalSearchText} onChange={(e) => setModalSearchText(e.target.value)} className="w-full h-12 input-style pl-11 text-base focus:ring-2" autoFocus />
            </div>
        </div>
        <ul className="max-h-96 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredSupervisors.filter(s => (s.nombres + (s.apellidos || '')).toLowerCase().includes(modalSearchText.toLowerCase())).map(s => (
             <li key={s.id} onMouseDown={() => { handleSelectSupervisor(s); setModalSearchText(''); }} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-primary/10 rounded-lg transition-colors group">
                <div className="p-2 bg-base-300 rounded-md group-hover:bg-primary/20 transition-colors"><UserPlusIcon className="h-5 w-5 text-primary" /></div>
                <div className="flex flex-col">
                  <span className="font-medium text-base-content">{s.nombres} {s.apellidos}</span>
                  <span className="text-xs text-neutral">{s.cargo || 'Encargado'}</span>
                </div>
              </li>
          ))}
          {filteredSupervisors.filter(s => (s.nombres + (s.apellidos || '')).toLowerCase().includes(modalSearchText.toLowerCase())).length === 0 && (
            <li className="py-8 text-center text-neutral italic text-sm">No se encontraron encargados.</li>
          )}
        </ul>
      </Modal>
    </div>
  );
};

export default ReportForm;
