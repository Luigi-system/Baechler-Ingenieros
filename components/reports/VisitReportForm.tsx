
import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';
import { AuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { generateVisitReport } from '../../services/pdfGenerator';
import type { VisitReport, Company, Plant, Supervisor } from '../../types';
import { BackIcon, SaveIcon, ViewIcon, EyeOffIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';
import ImageUpload from '../ui/ImageUpload';

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

    const [formData, setFormData] = useState<Partial<VisitReport>>({ fecha: new Date().toISOString().split('T')[0] });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Relational Data
    const [companies, setCompanies] = useState<Company[]>([]);
    const [plants, setPlants] = useState<Plant[]>([]);
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    
    // File state
    const [fotoFirma, setFotoFirma] = useState<File[]>([]);

    // UI & Simulator States
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isSimulatorVisible, setIsSimulatorVisible] = useState(true);
    const [pdfPreviewUri, setPdfPreviewUri] = useState<string | null>(null);
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const debounceTimeout = useRef<number | null>(null);

    // Fetch relational data
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!supabase) return;
            setIsDataLoading(true);
            try {
                const [companyRes, plantRes, supervisorRes] = await Promise.all([
                    supabase.from('Empresa').select('*'),
                    supabase.from('Planta').select('*'),
                    supabase.from('Encargado').select('*'),
                ]);
                if (companyRes.error) throw companyRes.error;
                if (plantRes.error) throw plantRes.error;
                if (supervisorRes.error) throw supervisorRes.error;
                
                setCompanies(companyRes.data);
                setPlants(plantRes.data);
                setSupervisors(supervisorRes.data);

                if (reportId) {
                    // Fetch and set editing report data
                }

            } catch (error: any) {
                 console.error("Error fetching dropdown data", error);
            } finally {
                setIsDataLoading(false);
            }
        };
        fetchInitialData();
    }, [supabase, reportId]);

    // PDF Preview Generation (Debounced)
    useEffect(() => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        setIsPdfLoading(true);
        debounceTimeout.current = window.setTimeout(async () => {
            try {
                const fotoFirmaBase64 = fotoFirma[0] ? await fileToBase64(fotoFirma[0]) : undefined;

                const enrichedData: VisitReport = {
                    ...formData,
                    empresa: companies.find(c => c.id === Number(formData.id_empresa)) || null,
                    planta: plants.find(p => p.id === Number(formData.id_planta)) || null,
                    encargado: supervisors.find(s => s.id === Number(formData.id_encargado)) || null,
                    usuario: { nombres: auth?.user?.nombres || 'N/A' },
                    fotoFirmaBase64
                };
                const uri = await generateVisitReport(enrichedData, logoUrl, 'datauristring');
                setPdfPreviewUri(uri as string);
            } catch (e) {
                console.error("Error generating PDF preview:", e);
            } finally {
                 setIsPdfLoading(false);
            }
        }, 500); // 500ms debounce
    }, [formData, companies, plants, supervisors, logoUrl, auth?.user, fotoFirma]);


    // Form handlers
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (!supabase || !auth?.user) return;

        const payload = { ...formData, id_usuario: auth.user.id };

        const { error } = reportId
            ? await supabase.from('Reporte_Visita').update(payload).eq('id', reportId)
            : await supabase.from('Reporte_Visita').insert(payload);
        
        setIsSubmitting(false);
        if (error) {
            alert("Error al guardar el reporte: " + error.message);
        } else {
            alert("¡Reporte de visita guardado exitosamente!");
            onBack();
        }
    };
    
    // Memoized lists for dependent dropdowns
    const filteredPlants = useMemo(() => plants.filter(p => p.id_empresa === Number(formData.id_empresa)), [plants, formData.id_empresa]);
    const filteredSupervisors = useMemo(() => supervisors.filter(s => s.id_planta === Number(formData.id_planta)), [supervisors, formData.id_planta]);

    if (isDataLoading) return <div className="flex justify-center items-center h-full"><Spinner /> Cargando datos...</div>

  return (
    <div className="flex h-full gap-4">
        {/* Form Section */}
        <div className="flex-1 overflow-y-auto pr-2">
             <div className="flex items-center mb-6">
                <button onClick={onBack} className="p-2 mr-4 rounded-full hover:bg-base-300 transition"><BackIcon className="h-6 w-6" /></button>
                <h2 className="text-3xl font-bold">{reportId ? 'Editar Reporte de Visita' : 'Crear Reporte de Visita'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Client Info */}
                <div className="bg-base-200 p-6 rounded-xl shadow-lg space-y-4">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Información General</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label htmlFor="codigo_reporte" className="block text-sm font-medium">Código Reporte</label><input type="text" name="codigo_reporte" value={formData.codigo_reporte || ''} onChange={handleChange} className="mt-1 block w-full input-style" /></div>
                        <div><label htmlFor="fecha" className="block text-sm font-medium">Fecha</label><input type="date" name="fecha" value={formData.fecha || ''} onChange={handleChange} required className="mt-1 block w-full input-style" /></div>
                        <div>
                           <label htmlFor="id_empresa" className="block text-sm font-medium">Empresa</label>
                           <select name="id_empresa" value={formData.id_empresa || ''} onChange={handleChange} required className="mt-1 block w-full input-style">
                                <option value="" disabled>Seleccionar empresa...</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                           </select>
                        </div>
                         <div>
                           <label htmlFor="id_planta" className="block text-sm font-medium">Planta / Sede</label>
                           <select name="id_planta" value={formData.id_planta || ''} onChange={handleChange} required disabled={!formData.id_empresa} className="mt-1 block w-full input-style">
                                <option value="" disabled>Seleccionar planta...</option>
                                {filteredPlants.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                           </select>
                        </div>
                        <div className="md:col-span-2">
                           <label htmlFor="id_encargado" className="block text-sm font-medium">Encargado / Contacto</label>
                           <select name="id_encargado" value={formData.id_encargado || ''} onChange={handleChange} required disabled={!formData.id_planta} className="mt-1 block w-full input-style">
                                <option value="" disabled>Seleccionar encargado...</option>
                                {filteredSupervisors.map(s => <option key={s.id} value={s.id}>{s.nombre} {s.apellido}</option>)}
                           </select>
                        </div>
                    </div>
                </div>
                {/* Visit Details */}
                <div className="bg-base-200 p-6 rounded-xl shadow-lg space-y-4">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Detalles de la Visita</h3>
                    <div><label htmlFor="motivo_visita" className="block text-sm font-medium">Motivo de la Visita</label><textarea name="motivo_visita" rows={2} value={formData.motivo_visita || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea></div>
                    <div><label htmlFor="temas_tratados" className="block text-sm font-medium">Temas Tratados</label><textarea name="temas_tratados" rows={4} value={formData.temas_tratados || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea></div>
                    <div><label htmlFor="acuerdos" className="block text-sm font-medium">Acuerdos</label><textarea name="acuerdos" rows={3} value={formData.acuerdos || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea></div>
                    <div><label htmlFor="pendientes" className="block text-sm font-medium">Pendientes</label><textarea name="pendientes" rows={3} value={formData.pendientes || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea></div>
                    <div><label htmlFor="observaciones" className="block text-sm font-medium">Observaciones</label><textarea name="observaciones" rows={2} value={formData.observaciones || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea></div>
                </div>
                {/* Signature */}
                 <div className="bg-base-200 p-6 rounded-xl shadow-lg space-y-4">
                     <h3 className="text-xl font-semibold border-b border-base-border pb-2">Conformidad del Cliente</h3>
                     <div><label htmlFor="nombre_firmante" className="block text-sm font-medium">Nombre del Receptor</label><input type="text" name="nombre_firmante" value={formData.nombre_firmante || ''} onChange={handleChange} className="mt-1 block w-full input-style" /></div>
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

        {/* Simulator Section */}
        <div className={`relative transition-all duration-300 ease-in-out ${isSimulatorVisible ? 'w-1/2' : 'w-12'}`}>
            <div className="sticky top-0 h-full flex flex-col bg-base-300/50 rounded-lg shadow-inner">
                <div className="flex-shrink-0 p-2 bg-base-200 rounded-t-lg border-b border-base-border">
                     <button 
                        onClick={() => setIsSimulatorVisible(!isSimulatorVisible)} 
                        className="p-2 rounded-full hover:bg-base-300"
                        title={isSimulatorVisible ? "Ocultar Previsualización" : "Mostrar Previsualización"}
                    >
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
    </div>
  );
};

export default VisitReportForm;
