import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { pdf } from '@react-pdf/renderer';
import VisitReportPdf from './VisitReportPdf';
import type { VisitReport, Company, Plant, Supervisor, Machine } from '../../types';
import { useFormDraft } from '../../hooks/useFormDraft';
import { BackIcon, SaveIcon, ViewIcon, EyeOffIcon, SparklesIcon, UploadIcon, UserPlusIcon, SearchIcon, PlusIcon, BriefcaseIcon, MapPinIcon, TrashIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';
import ImageUpload from '../ui/ImageUpload';
import Modal from '../ui/Modal';
import CompanyForm from '../management/companies/CompanyForm';
import PlantForm from '../management/plants/PlantForm';
import SupervisorForm from '../management/supervisors/SupervisorForm';
import PdfViewer, { PdfViewerHandle } from '../ui/PdfViewer';
import MachineForm from '../management/machines/MachineForm';

interface ReportFormProps {
  reportId?: string | null;
  onBack: () => void;
  initialAiData?: any;
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

const VisitReportForm: React.FC<ReportFormProps> = ({ reportId, onBack, initialAiData }) => {
    const auth = useContext(AuthContext);
    const { logoUrl } = useTheme();

    const [formData, setFormData] = useState<Partial<VisitReport>>({
        estado: 1,
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

    // Draft Management
    const { clearDraft } = useFormDraft<VisitReport>(
        'visit_report_draft',
        formData,
        setFormData,
        !reportId,
        [
            { name: 'fotos_observaciones', files: fotosObservaciones, setFiles: setFotosObservaciones },
            { name: 'fotos_sugerencias', files: fotosSugerencias, setFiles: setFotosSugerencias },
            { name: 'foto_firma', files: fotoFirma, setFiles: setFotoFirma },
        ]
    );

    const [isDataLoading, setIsDataLoading] = useState(true);
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
    const [isPlantsLoading, setIsPlantsLoading] = useState(false);
    const [isSupervisorsLoading, setIsSupervisorsLoading] = useState(false);

    // Initial load for drafts
    useEffect(() => {
        if (reportId) return;
        const savedMaquinasDraft = localStorage.getItem('visit_report_maquinas_draft');
        if (savedMaquinasDraft) {
            try {
                setSelectedMaquinas(JSON.parse(savedMaquinasDraft));
            } catch (e) {
                console.error("Error loading maquinas draft:", e);
            }
        }
    }, [reportId]);

    // Save maquinas draft on change
    useEffect(() => {
        if (reportId) return;
        const timeoutId = setTimeout(() => {
            localStorage.setItem('visit_report_maquinas_draft', JSON.stringify(selectedMaquinas));
        }, 1000);
        return () => clearTimeout(timeoutId);
    }, [selectedMaquinas, reportId]);
    
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
    
    // Internal modal search terms
    const [modalSearchText, setModalSearchText] = useState('');

    // Sync search fields when draft is loaded
    useEffect(() => {
        if (formData.empresa_nombre && !companySearchText) setCompanySearchText(formData.empresa_nombre);
        if (formData.empresa_planta && !plantSearchText) setPlantSearchText(formData.empresa_planta);
        if (formData.encargado_nombre && !supervisorSearchText) setSupervisorSearchText(formData.encargado_nombre);
    }, [formData.empresa_nombre, formData.empresa_planta, formData.encargado_nombre]);

    // Populate form with AI data if provided
    useEffect(() => {
        if (initialAiData) {
            setFormData(prev => ({ ...prev, ...initialAiData }));
            if (initialAiData.empresa_nombre) setCompanySearchText(initialAiData.empresa_nombre);
        }
    }, [initialAiData]);

    const fetchDropdownData = useCallback(async () => {
        try {
            const [companyRes, plantRes, supervisorRes, machineRes] = await Promise.all([
                fetch('https://app.lr-system.com/bi/empresas/getall').then(r => r.json()),
                fetch('https://app.lr-system.com/bi/planta/getall').then(r => r.json()),
                fetch('https://app.lr-system.com/bi/encargado/getall').then(r => r.json()),
                fetch('https://app.lr-system.com/bi/maquinas/getall').then(r => r.json()),
            ]);
            
            const companiesData = Array.isArray(companyRes) ? companyRes : (companyRes.data || []);
            const plantsData = (Array.isArray(plantRes) ? plantRes : (plantRes.data || [])).map((p: any) => ({ ...p, id_empresa: p.id_empresa }));
            const supervisorsData = Array.isArray(supervisorRes) ? supervisorRes : (supervisorRes.data || []);
            const machinesData = (Array.isArray(machineRes) ? machineRes : (machineRes.data || [])).map((m: any) => ({
                ...m, 
                planta_nombre: m.nombre_planta,
                empresa_nombre: m.nombre_empresa
            }));

            setCompanies(companiesData);
            setPlants(plantsData);
            setSupervisors(supervisorsData);
            setMachines(machinesData);
            return { companies: companiesData, plants: plantsData, supervisors: supervisorsData, machines: machinesData };
        } catch (error: any) {
             console.error("Error fetching dropdown data", error);
             return { companies: [], plants: [], supervisors: [], machines: [] };
        }
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsDataLoading(true);
            const { companies, plants, supervisors, machines } = await fetchDropdownData();

            const cleanReportId = reportId ? String(reportId).replace('#', '') : null;
            if (cleanReportId) {
                try {
                    const response = await fetch(`https://app.lr-system.com/bi/reporte-visita/get/${cleanReportId}`);
                    if (!response.ok) throw new Error('Error al obtener reporte');
                    const jsonResponse = await response.json();
                    
                    const reportData = Array.isArray(jsonResponse) ? jsonResponse[0] : (jsonResponse.data || jsonResponse);
                    
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
                        // Normalize field names from API if needed
                        const empresaNombre = reportData.empresa_nombre || reportData.empresa || reportData.nombre_empresa;
                        const plantaNombre = reportData.empresa_planta || reportData.planta_nombre || reportData.planta || reportData.nombre_planta;
                        const encargadoNombre = reportData.encargado_nombre || reportData.encargado || reportData.nombre_encargado;

                        const company = companies.find(c => (c.nombre || '').trim().toLowerCase() === (empresaNombre || '').trim().toLowerCase());
                        const plant = company ? plants.find(p => (p.nombre || '').trim().toLowerCase() === (plantaNombre || '').trim().toLowerCase()) : undefined;
                        const supervisor = (company && plant) ? supervisors.find(s => 
                            (s.nombreEmpresa || '').trim().toLowerCase() === (company.nombre || '').trim().toLowerCase() && 
                            (s.nombrePlanta || '').trim().toLowerCase() === (plant.nombre || '').trim().toLowerCase() &&
                            `${s.nombres || ''} ${s.apellidos || ''}`.trim().toLowerCase() === (encargadoNombre || '').trim().toLowerCase()
                        ) : undefined;

                        const formDataToSet: Partial<VisitReport> = {
                            ...reportData,
                            fecha: formatDateForInput(reportData.fecha),
                            hora_entrada: formatTimeForInput(reportData.hora_entrada),
                            hora_salida: formatTimeForInput(reportData.hora_salida),
                            empresa_nombre: empresaNombre,
                            empresa_planta: plantaNombre,
                            encargado_nombre: encargadoNombre,
                            estado: reportData.estado === 'Finalizado' || reportData.estado === 1 || reportData.estado === '1' || reportData.estado === true ? 1 : 0,
                            form_id_empresa: company?.id,
                            form_id_planta: plant?.id,
                            form_id_encargado: supervisor?.id,
                            // Checklist normalization
                            voltaje_establecido: Boolean(reportData.voltaje_establecido),
                            linea_a_tierra: Boolean(reportData.linea_a_tierra || reportData.linea_tierra),
                            presurizacion_de_cabezal: Boolean(reportData.presurizacion_de_cabezal),
                            transformador_de_aislamiento: Boolean(reportData.transformador_de_aislamiento),
                            limpieza_cabezal: Boolean(reportData.limpieza_cabezal),
                        };
                        
                        formDataToSet.fotos_observaciones = reportData.fotos_observaciones ? toDataURL(reportData.fotos_observaciones) : null;
                        formDataToSet.fotos_sugerencias = reportData.fotos_sugerencias ? toDataURL(reportData.fotos_sugerencias) : null;
                        formDataToSet.foto_firma = reportData.foto_firma ? toDataURL(reportData.foto_firma) : null;

                        setFormData(formDataToSet);

                        if (empresaNombre) setCompanySearchText(empresaNombre);
                        if (plantaNombre) setPlantSearchText(plantaNombre);
                        if (encargadoNombre) setSupervisorSearchText(encargadoNombre);
                        
                        if (reportData.maquinas) {
                            const maquinasList = Array.isArray(reportData.maquinas) ? reportData.maquinas : [reportData.maquinas];
                            const parsedMaquinas = maquinasList.map((maquinaString: string) => {
                                if (typeof maquinaString !== 'string') return null;
                                const [machinePart, ...obsParts] = maquinaString.split(': ');
                                const observaciones = obsParts.join(': ');
                                const serie = machinePart.split(' - ')[0];
                                const machine = machines.find(m => m.serie === serie);
                                if (machine) return { machine, observaciones };
                                return null;
                            }).filter((item: any): item is { machine: Machine; observaciones: string } => item !== null);
                            setSelectedMaquinas(parsedMaquinas);
                        }
                    }
                } catch (err) {
                    console.error("Error fetching visit report for editing:", err);
                }
            }
            setIsDataLoading(false);
        };
        fetchInitialData();
    }, [reportId, fetchDropdownData]);

    // Draft recovery ID lookup
    useEffect(() => {
        if (reportId || companies.length === 0) return;
        
        let changed = false;
        const updates: Partial<VisitReport> = {};

        // Company
        if (formData.empresa_nombre && !formData.form_id_empresa) {
            const company = companies.find(c => (c.nombre || '').trim().toLowerCase() === (formData.empresa_nombre || '').trim().toLowerCase());
            if (company) {
                updates.form_id_empresa = company.id;
                changed = true;
            }
        }

        // Plant
        const companyId = updates.form_id_empresa || formData.form_id_empresa;
        if (companyId && formData.empresa_planta && !formData.form_id_planta) {
            const plant = plants.find(p => (p.nombre || '').trim().toLowerCase() === (formData.empresa_planta || '').trim().toLowerCase());
            if (plant) {
                updates.form_id_planta = plant.id;
                changed = true;
                if (!plantSearchText) setPlantSearchText(plant.nombre);
            }
        }

        // Supervisor
        const plantId = updates.form_id_planta || formData.form_id_planta;
        if (plantId && formData.encargado_nombre && !formData.form_id_encargado) {
            const supervisor = supervisors.find(s => 
                `${s.nombres || ''} ${s.apellidos || ''}`.trim().toLowerCase() === (formData.encargado_nombre || '').trim().toLowerCase()
            );
            if (supervisor) {
                updates.form_id_encargado = supervisor.id;
                changed = true;
                if (!supervisorSearchText) setSupervisorSearchText(`${supervisor.nombres} ${supervisor.apellidos || ''}`);
            }
        }

        if (changed) {
            setFormData(prev => ({ ...prev, ...updates }));
        }
    }, [companies, plants, supervisors, formData.empresa_nombre, formData.empresa_planta, formData.encargado_nombre, formData.form_id_empresa, formData.form_id_planta, formData.form_id_encargado, reportId]);

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

                const cleanFirma = (str: any) => {
                    if (!str || typeof str !== 'string') return undefined;
                    const trimmed = str.trim();
                    if (trimmed.startsWith('data:') || trimmed.startsWith('http') || trimmed.startsWith('blob:')) return trimmed;
                    return `data:image/png;base64,${trimmed}`;
                };

                const enrichedData: VisitReport = {
                    ...formData,
                    usuario_nombre: auth?.user?.nombres ? `${auth.user.nombres} ${auth.user.apellidos || ''}` : 'Usuario',
                    usuario_cel: auth?.user?.celular || '',
                    fotoFirmaBase64: fotoFirmaBase64 || cleanFirma(formData.foto_firma),
                    fotosObservacionesBase64: [
                        ...(Array.isArray(formData.fotos_observaciones) ? formData.fotos_observaciones : (formData.fotos_observaciones || '').split(',').filter(Boolean).map(i => i.trim())),
                        ...fotosObservacionesBase64
                    ],
                    fotosSugerenciasBase64: [
                        ...(Array.isArray(formData.fotos_sugerencias) ? formData.fotos_sugerencias : (formData.fotos_sugerencias || '').split(',').filter(Boolean).map(i => i.trim())),
                        ...fotosSugerenciasBase64
                    ],
                    maquinas: selectedMaquinas.map(m => `${m.machine.serie} - ${m.machine.modelo} (${m.machine.marca}): ${m.observaciones}`),
                };

                // Generate PDF using @react-pdf/renderer
                const blob = await pdf(
                    <VisitReportPdf 
                        report={enrichedData} 
                        logoUrl={logoUrl || undefined} 
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
    }, [formData, selectedMaquinas, fotosObservaciones, fotosSugerencias, fotoFirma, logoUrl, auth?.user]);

    // Final cleanup on unmount
    useEffect(() => {
        return () => {
            setPdfPreviewUri(prev => {
                if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
                return null;
            });
        }
    }, []);
    const companySuggestions = useMemo(() => companies.filter(c => (c.nombre || '').toLowerCase().includes((companySearchText || '').toLowerCase())).slice(0, 10), [companySearchText, companies]);
    const filteredPlants = useMemo(() => {
        if (!formData.form_id_empresa) return [];
        const byId = plants.filter(p => String(p.id_empresa) === String(formData.form_id_empresa));
        if (byId.length > 0) return byId;
        const selectedCompany = companies.find(c => c.id === formData.form_id_empresa);
        if (!selectedCompany) return [];
        return plants.filter(p => (p.nombreempresa || '').toLowerCase() === selectedCompany.nombre.toLowerCase());
    }, [plants, formData.form_id_empresa, companies]);
    const plantSuggestions = useMemo(() => filteredPlants.filter(p => (p.nombre || '').toLowerCase().includes((plantSearchText || '').toLowerCase())).slice(0, 10), [plantSearchText, filteredPlants]);

    
    const filteredSupervisors = useMemo(() => {
        if (!formData.form_id_empresa || !formData.form_id_planta) return [];
        const company = companies.find(c => c.id === formData.form_id_empresa);
        const plant = plants.find(p => p.id === formData.form_id_planta);
        if (!company || !plant) return [];
        return supervisors.filter(s => (s.nombreEmpresa || '').toLowerCase() === (company.nombre || '').toLowerCase() && (s.nombrePlanta || '').toLowerCase() === (plant.nombre || '').toLowerCase());
    }, [formData.form_id_empresa, formData.form_id_planta, companies, plants, supervisors]);
    
    const supervisorSuggestions = useMemo(() => filteredSupervisors.filter(s => `${s.nombres || ''} ${s.apellidos || ''}`.toLowerCase().includes((supervisorSearchText || '').toLowerCase())).slice(0, 10), [supervisorSearchText, filteredSupervisors]);

    const availableMachinesForPlant = useMemo(() => {
        if (!formData.form_id_planta) return [];
        // First try numeric ID
        const byId = machines.filter(m => String(m.id_planta) === String(formData.form_id_planta));
        if (byId.length > 0) return byId;
        // Fallback: match by plant name
        const plant = plants.find(p => p.id === formData.form_id_planta);
        if (!plant) return [];
        return machines.filter(m => (m.nombre_planta || '').toLowerCase() === plant.nombre.toLowerCase() || (m.planta_nombre || '').toLowerCase() === plant.nombre.toLowerCase());
    }, [machines, formData.form_id_planta, plants]);
    const machineSuggestions = useMemo(() => {
        const selectedMachineIds = new Set(selectedMaquinas.map(m => m.machine.id));
        return availableMachinesForPlant.filter(m => 
            !selectedMachineIds.has(m.id) &&
            (m.serie.toLowerCase().includes((machineSearch || '').toLowerCase()) || 
             (m.modelo || '').toLowerCase().includes((machineSearch || '').toLowerCase()))
        ).slice(0, 10);
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
        // Fetch plants by company name for reliability
        fetch(`https://app.lr-system.com/bi/planta/by-empresa/${encodeURIComponent(company.nombre)}`)
            .then(r => r.json())
            .then(res => {
                const data = Array.isArray(res) ? res : (res.data || []);
                if (data.length > 0) {
                    setPlants(prev => {
                        const others = prev.filter(p => String(p.id_empresa) !== String(company.id) && (p.nombreempresa || '').toLowerCase() !== company.nombre.toLowerCase());
                        return [...others, ...data];
                    });
                }
            })
            .catch(() => {})
            .finally(() => setIsPlantsLoading(false));
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
                            const newIds = new Set(data.map((m: Machine) => m.id));
                            const others = prev.filter(m => !newIds.has(m.id));
                            return [...others, ...data];
                        });
                    }
                })
                .catch(() => {})
                .finally(() => setIsSupervisorsLoading(false));
        } else {
            setIsSupervisorsLoading(false);
        }
    }, []);

    const handleSelectSupervisor = useCallback((supervisor: Supervisor) => {
        setFormData(prev => ({
            ...prev,
            form_id_encargado: supervisor.id,
            encargado_nombre: `${supervisor.nombres} ${supervisor.apellidos || ''}`.trim(),
            encargado_cel: supervisor.celular?.toString(),
        }));
        setSupervisorSearchText(`${supervisor.nombres} ${supervisor.apellidos || ''}`.trim());
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
        await fetchDropdownData(); handleSelectCompany(newCompany); setIsNewCompanyModalOpen(false);
    }, [fetchDropdownData, handleSelectCompany]);
    
    const handlePlantSaved = useCallback(async () => {
        await fetchDropdownData(); setIsNewPlantModalOpen(false);
    }, [fetchDropdownData]);

    const handleSupervisorSaved = useCallback(async (newSupervisor: Supervisor) => {
        await fetchDropdownData(); handleSelectSupervisor(newSupervisor); setIsNewSupervisorModalOpen(false);
    }, [fetchDropdownData, handleSelectSupervisor]);

    const handleMachineSaved = useCallback(async () => {
        await fetchDropdownData(); setIsNewMachineModalOpen(false);
    }, [fetchDropdownData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (!auth?.user) {
            setIsSubmitting(false);
            return;
        }

        try {
            const [newObservacionesB64, newSugerenciasB64, newFirmaB64] = await Promise.all([
                fotosObservaciones.length > 0 ? fileToPngDataUrl(fotosObservaciones[0]) : Promise.resolve(null),
                fotosSugerencias.length > 0 ? fileToPngDataUrl(fotosSugerencias[0]) : Promise.resolve(null),
                fotoFirma.length > 0 ? fileToPngDataUrl(fotoFirma[0]) : Promise.resolve(null),
            ]);

            // Create a comprehensive data object for the PDF generator
            const pdfDataObject: VisitReport = {
                ...formData,
                maquinas: selectedMaquinas.map(m => `${m.machine.serie} - ${m.machine.modelo} (${m.machine.marca}): ${m.observaciones}`),
                usuario_nombre: auth.user.nombres ?? 'N/A',
                fotoFirmaBase64: newFirmaB64 || (formData.foto_firma ? stripDataUriPrefix(formData.foto_firma) : undefined),
            };

            const pdfBlob = await pdf(
                <VisitReportPdf 
                    report={pdfDataObject} 
                    logoUrl={logoUrl || undefined} 
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

            const payload: { [key: string]: any } = {
                codigo: formData.codigo,
                estado: 1, // Ensure numeric 1 is sent, never the string "Finalizado"
                empresa_nombre: formData.empresa_nombre,
                planta_nombre: formData.empresa_planta,
                usuario_nombre: auth.user.nombres,
                usuario_cel: auth.user.celular?.toString(),
                encargado_nombre: formData.encargado_nombre,
                encargado_cel: formData.encargado_cel,
                maquinas: selectedMaquinas.map(item => `${item.machine.serie} - ${item.machine.modelo || ''}: ${item.observaciones}`).join(', '),
                voltaje_establecido: formData.voltaje_establecido ? 1 : 0,
                linea_tierra: formData.linea_a_tierra ? 1 : 0,
                presurizacion_de_cabezal: formData.presurizacion_de_cabezal ? 1 : 0,
                transformador_de_aislamiento: formData.transformador_de_aislamiento ? 1 : 0,
                limpieza_cabezal: formData.limpieza_cabezal ? 1 : 0,
                fotos_observaciones: newObservacionesB64 || (formData.fotos_observaciones ? stripDataUriPrefix(formData.fotos_observaciones) : null),
                fotos_sugerencias: newSugerenciasB64 || (formData.fotos_sugerencias ? stripDataUriPrefix(formData.fotos_sugerencias) : null),
                foto_firma: newFirmaB64 || (formData.foto_firma ? stripDataUriPrefix(formData.foto_firma) : null),
                observaciones: formData.observaciones,
                sugerencias: formData.sugerencias,
                pdf: pdfBase64,
            };
            
            const url = reportId ? `https://app.lr-system.com/bi/reporte-visita/update/${reportId}` : 'https://app.lr-system.com/bi/reporte-visita/create';
            const method = reportId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Error al procesar la solicitud');
            
            // Clear draft on success
            if (!reportId) {
                clearDraft();
                localStorage.removeItem('visit_report_maquinas_draft');
            }
            
            setIsSubmitting(false);
            alert("¡Reporte de visita guardado exitosamente!");
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
        setIsPdfLoading(true);
        try {
            const res = await fetch(`https://app.lr-system.com/bi/reporte-visita/get/${reportId}`);
            const data = await res.json();
            const reportData = Array.isArray(data) ? data[0] : (data.data || data);
            
            if (!reportData) throw new Error("No se encontró el reporte.");

            const pdfBlob = await pdf(
                <VisitReportPdf 
                    report={reportData as VisitReport} 
                    logoUrl={logoUrl || undefined} 
                />
            ).toBlob();
            
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Visita_${reportData.codigo || reportId}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error("Error generating PDF from form:", err);
            alert(`No se pudo generar el PDF: ${err.message}`);
        } finally {
            setIsPdfLoading(false);
        }
    };
    
    const selectedCompanyForNewSupervisor = useMemo(() => companies.find(c => c.id === formData.form_id_empresa), [formData.form_id_empresa, companies]);
    const selectedPlantForNewSupervisor = useMemo(() => plants.find(p => p.id === formData.form_id_planta), [formData.form_id_planta, plants]);
    const selectedCompanyForNewMachine = useMemo(() => companies.find(c => c.id === formData.form_id_empresa), [formData.form_id_empresa, companies]);
    const selectedPlantForNewMachine = useMemo(() => plants.find(p => p.id === formData.form_id_planta), [formData.form_id_planta, plants]);

    if (isDataLoading) return <div className="flex justify-center items-center h-full"><Spinner /> Cargando datos...</div>

  return (
    <div className={`flex flex-col lg:flex-row h-full gap-0 relative overflow-hidden ${isResizing ? 'cursor-col-resize select-none' : ''}`}>
        {/* Form Container */}
        <div 
            style={{ width: isSimulatorVisible && window.innerWidth >= 1024 ? `${splitWeight}%` : undefined }}
            className={`w-full ${!isSimulatorVisible ? 'lg:w-[calc(100%-3.5rem)]' : 'lg:flex-none'} overflow-y-auto custom-scrollbar transition-all duration-300 ${isSimulatorVisible && window.innerWidth < 1024 ? 'blur-sm pointer-events-none' : ''}`}
        >
            <form onSubmit={handleSubmit} className="space-y-6 pt-4 pb-20 md:pb-4 px-1 pr-4">
                
                <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg space-y-4 border border-base-border">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Información General</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
                        {reportId && (
                            <div>
                                <label htmlFor="codigo" className="block text-sm font-medium text-neutral-500">ID del Reporte</label>
                                <div className="mt-1 flex items-center h-[42px] px-3 bg-base-300/50 rounded-lg border border-base-border text-primary font-black">
                                    #{String(reportId).padStart(4, '0')}
                                </div>
                            </div>
                        )}

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
                        <div>
                            <label htmlFor="plant-search" className="block text-sm font-medium flex items-center gap-2">Planta / Sede {isPlantsLoading && <Spinner />}</label>
                            <div onBlur={() => setTimeout(() => setShowPlantSuggestions(false), 100)}>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="relative flex-grow">
                                        <input id="plant-search" type="text" value={plantSearchText} onChange={(e) => { const val = e.target.value; setPlantSearchText(val); setFormData(prev => ({ ...prev, empresa_planta: val })); }} onFocus={() => setShowPlantSuggestions(true)} disabled={!formData.form_id_empresa} placeholder="Seleccionar Planta" className="w-full input-style" autoComplete="off" />
                                        {showPlantSuggestions && plantSuggestions.length > 0 && (
                                            <ul className="absolute z-20 w-full bg-base-200 border border-base-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg custom-scrollbar">
                                                {plantSuggestions.map(p => <li key={p.id} onMouseDown={() => handleSelectPlant(p)} className="px-3 py-2 cursor-pointer hover:bg-base-300">{p.nombre}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => setIsNewPlantModalOpen(true)} disabled={!formData.form_id_empresa} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50 text-base-content" title="Crear Nueva Planta"><PlusIcon className="h-5 w-5"/></button>
                                    <button type="button" onClick={() => setIsPlantSearchModalOpen(true)} disabled={!formData.form_id_empresa} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50 text-base-content" title="Buscar Planta"><SearchIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="supervisor-search" className="block text-sm font-medium flex items-center gap-2 whitespace-nowrap">
                                <span className="hidden 2xl:inline">Encargado de Planta</span>
                                <span className="2xl:hidden">Encargado</span>
                                {isSupervisorsLoading && <Spinner />}
                            </label>
                            <div onBlur={() => setTimeout(() => setShowSupervisorSuggestions(false), 100)}>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="relative flex-grow">
                                        <input id="supervisor-search" type="text" value={supervisorSearchText} onChange={(e) => { const val = e.target.value; setSupervisorSearchText(val); setFormData(prev => ({ ...prev, encargado_nombre: val })); }} onFocus={() => setShowSupervisorSuggestions(true)} disabled={!formData.form_id_planta} placeholder="Escribir o buscar encargado..." className="w-full input-style" autoComplete="off" />
                                        {showSupervisorSuggestions && supervisorSuggestions.length > 0 && (
                                            <ul className="absolute z-10 w-full bg-base-200 border border-base-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg custom-scrollbar">
                                                {supervisorSuggestions.map(s => <li key={s.id} onMouseDown={() => handleSelectSupervisor(s)} className="p-3 cursor-pointer hover:bg-base-300">{s.nombres} {s.apellidos}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => setIsNewSupervisorModalOpen(true)} disabled={!formData.form_id_planta} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50 text-base-content" title="Crear Nuevo Encargado"><UserPlusIcon className="h-5 w-5"/></button>
                                    <button type="button" onClick={() => setIsSupervisorSearchModalOpen(true)} disabled={!formData.form_id_planta} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50 text-base-content" title="Buscar Encargado"><SearchIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="encargado_cel" className="block text-sm font-medium whitespace-nowrap">
                                <span className="hidden 2xl:inline">Celular del Encargado</span>
                                <span className="2xl:hidden">Cel. Encargado</span>
                            </label>
                            <input type="text" name="encargado_cel" value={formData.encargado_cel || ''} onChange={handleChange} className="mt-1 block w-full input-style" />
                        </div>
                    </div>
                </div>

                <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg space-y-4 border border-base-border">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Detalles Técnicos</h3>
                    <div>
                        <label className="block text-sm font-medium">Checklist Técnico</label>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
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

                <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg space-y-4 border border-base-border">
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

                <div className="flex justify-between items-center pt-4">
                    <div>
                        {reportId && (
                            <button type="button" onClick={handleDownloadPDF} disabled={isPdfLoading} className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-600/50 flex items-center gap-2">
                                {isPdfLoading ? <Spinner /> : <SaveIcon className="h-5 w-5"/>}
                                {isPdfLoading ? 'Generando...' : 'Descargar PDF'}
                            </button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={onBack} className="bg-base-300 py-2 px-4 rounded-lg hover:bg-neutral/20 transition-colors">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="bg-primary text-white py-2 px-6 rounded-lg hover:bg-primary-focus transition-colors disabled:bg-primary/50 flex items-center gap-2">
                            {isSubmitting && <Spinner />}<SaveIcon className="h-5 w-5" />{isSubmitting ? 'Guardando...' : 'Guardar Reporte'}
                        </button>
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
                    <li className="py-8 text-center text-neutral italic text-sm">No se encontraron empresas.</li>
                )}
            </ul>
        </Modal>
        
        <Modal isOpen={isNewMachineModalOpen} onClose={() => setIsNewMachineModalOpen(false)} title="Añadir Nueva Máquina">
            <MachineForm 
                machine={null} 
                onSave={() => handleMachineSaved()} 
                onCancel={() => setIsNewMachineModalOpen(false)} 
                defaultCompanyName={formData.empresa_nombre || companySearchText}
                defaultPlantName={formData.empresa_planta || plantSearchText}
            />
        </Modal>
        <Modal isOpen={isNewPlantModalOpen} onClose={() => setIsNewPlantModalOpen(false)} title="Añadir Nueva Planta">
            <PlantForm plant={null} onSave={() => handlePlantSaved()} onCancel={() => setIsNewPlantModalOpen(false)}/>
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
                    <li className="py-8 text-center text-neutral italic text-sm">No se encontraron plantas.</li>
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
            </ul>
        </Modal>
        
        <Modal isOpen={isMachineSearchModalOpen} onClose={() => { setIsMachineSearchModalOpen(false); setModalSearchText(''); }} title="Buscar Máquina">
            <div className="p-4 border-b border-base-border sticky top-0 bg-base-200 z-10">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral" />
                    <input type="text" placeholder="Buscar por serie o modelo..." value={modalSearchText} onChange={(e) => setModalSearchText(e.target.value)} className="w-full h-12 input-style pl-11 text-base focus:ring-2" autoFocus />
                </div>
            </div>
            <ul className="max-h-96 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {availableMachinesForPlant.filter(m => (m.serie + (m.modelo || '') + (m.marca || '')).toLowerCase().includes(modalSearchText.toLowerCase())).map(m => (
                    <li key={m.id} onMouseDown={() => { handleSelectMachine(m); setModalSearchText(''); }} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-primary/10 rounded-lg transition-colors group">
                        <div className="p-2 bg-base-300 rounded-md group-hover:bg-primary/20 transition-colors"><UploadIcon className="h-5 w-5 text-primary rotate-180" /></div>
                        <div className="flex flex-col">
                            <span className="font-bold text-base-content text-sm">{m.serie}</span>
                            <span className="text-xs text-neutral">{m.marca} - {m.modelo}</span>
                        </div>
                    </li>
                ))}
                {availableMachinesForPlant.length === 0 && (<li className="py-8 text-center text-neutral italic text-sm">No hay máquinas para esta planta.</li>)}
            </ul>
        </Modal>
    </div>
  );
};

export default VisitReportForm;