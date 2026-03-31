import React, { useState, useEffect } from 'react';
import type { Machine, Plant, Company } from '../../../types';
import Spinner from '../../ui/Spinner';
import SearchableSelect from '../../ui/SearchableSelect';
import { useNotification } from '../../../contexts/NotificationContext';
import { BuildingIcon, MapPinIcon, CpuChipIcon, HashIcon, SettingsIcon, CheckCircleIcon } from '../../ui/Icons';

interface MachineFormProps {
    machine: Machine | null;
    onSave: (m?: Machine) => void;
    onCancel: () => void;
    defaultCompanyName?: string;
    defaultPlantName?: string;
}

const MachineForm: React.FC<MachineFormProps> = ({ machine, onSave, onCancel, defaultCompanyName, defaultPlantName }) => {
    const { addNotification } = useNotification();
    const [formData, setFormData] = useState<Partial<Machine>>(() => ({
        serie: machine?.serie || '',
        modelo: machine?.modelo || '',
        marca: machine?.marca || '',
        linea: machine?.linea || '',
        estado: machine ? machine.estado : true,
        empresa_nombre: machine?.empresa_nombre || defaultCompanyName || '',
        planta_nombre: machine?.planta_nombre || defaultPlantName || '',
    }));

    const [companies, setCompanies] = useState<Company[]>([]);
    const [allPlants, setAllPlants] = useState<Plant[]>([]);
    
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingData(true);
            try {
                const [companiesRes, plantsRes] = await Promise.all([
                    fetch('https://app.lr-system.com/bi/empresas/getall').then(r => r.json()),
                    fetch('https://app.lr-system.com/bi/planta/getall').then(r => r.json())
                ]);

                const companiesData = Array.isArray(companiesRes) ? companiesRes : (companiesRes.data || []);
                const plantsData = Array.isArray(plantsRes) ? plantsRes : (plantsRes.data || []);

                setCompanies(companiesData);
                setAllPlants(plantsData.map((p: any) => ({ ...p, empresa_nombre: p.nombreempresa })));

                if (machine) {
                    setFormData({
                        ...machine,
                        empresa_nombre: machine.empresa_nombre || '',
                        planta_nombre: machine.planta_nombre || ''
                    });
                }
            } catch (err) {
                console.error("Error fetching form data:", err);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();
    }, [machine]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.serie || !formData.empresa_nombre || !formData.planta_nombre) {
             addNotification({ type: 'warning', title: 'Campos requeridos', message: 'Por favor, proporciona al menos el N° de Serie, Empresa y Sede.' });
            return;
        }
        
        setIsSaving(true);
        try {
            const url = machine 
                ? `https://app.lr-system.com/bi/maquinas/update/${machine.id}`
                : 'https://app.lr-system.com/bi/maquinas/create';
            
            const method = machine ? 'PUT' : 'POST';
            
            const payload = {
                marca: formData.marca || '',
                linea: formData.linea || '',
                serie: formData.serie || '',
                modelo: formData.modelo || '',
                estado: formData.estado,
                nombre_empresa: formData.empresa_nombre,
                nombre_planta: formData.planta_nombre
            };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Error al procesar la solicitud');
            
            const result = await response.json();
            addNotification({ type: 'success', title: 'Éxito', message: 'Máquina guardada correctamente.' });
            onSave(result.data || result);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Error', message: `Error: ${err.message}` });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingData) return (
        <div className="flex flex-col items-center justify-center p-12">
            <Spinner className="h-10 w-10 text-primary mb-4" />
            <span className="text-sm text-neutral font-medium animate-pulse">Configurando entorno de trabajo...</span>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative">
            {/* SECCIÓN 1: ASIGNACIÓN DE UBICACIÓN */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                        <BuildingIcon className="h-4 w-4" />
                    </div>
                    <h4 className="text-[12px] font-bold text-base-content/70 uppercase tracking-widest">Asignación de Ubicación</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-base-200/50 rounded-2xl border border-base-border/50">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-neutral uppercase ml-1">Empresa Master</label>
                        <SearchableSelect
                            options={companies.map(c => ({ id: c.nombre, label: c.nombre }))}
                            value={formData.empresa_nombre}
                            onChange={(val) => setFormData(prev => ({ ...prev, empresa_nombre: val as string, planta_nombre: '' }))}
                            placeholder="Busca o escribe empresa..."
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-neutral uppercase ml-1">Sede / Planta Operativa</label>
                        <SearchableSelect
                            options={allPlants.filter(p => {
                                if (!formData.empresa_nombre) return false;
                                const target = formData.empresa_nombre.toLowerCase();
                                return (p.empresa_nombre || '').toLowerCase() === target || 
                                       (p.nombreempresa || '').toLowerCase() === target;
                            }).map(p => ({ id: p.nombre, label: p.nombre }))}
                            value={formData.planta_nombre}
                            onChange={(val) => setFormData(prev => ({ ...prev, planta_nombre: val as string }))}
                            disabled={!formData.empresa_nombre}
                            placeholder="Busca o escribe planta..."
                        />
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: INFORMACIÓN TÉCNICA */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <div className="p-1.5 bg-secondary/10 rounded-lg text-secondary">
                        <CpuChipIcon className="h-4 w-4" />
                    </div>
                    <h4 className="text-[12px] font-bold text-base-content/70 uppercase tracking-widest">Información Técnica</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-neutral uppercase ml-1">Número de Serie (ID Único)</label>
                        <div className="relative group">
                            <HashIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral/50 group-focus-within:text-primary transition-colors" />
                            <input 
                                type="text" 
                                name="serie" 
                                value={formData.serie || ''} 
                                onChange={handleChange} 
                                required 
                                placeholder="Ej: 230R53D21G..."
                                className="w-full pl-10 pr-4 py-2.5 bg-base-200 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-mono" 
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-neutral uppercase ml-1">Modelo de Máquina</label>
                        <div className="relative group">
                            <SettingsIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral/50 group-focus-within:text-primary transition-colors" />
                            <input 
                                type="text" 
                                name="modelo" 
                                value={formData.modelo || ''} 
                                onChange={handleChange} 
                                placeholder="Ej: COMPACT 53C"
                                className="w-full pl-10 pr-4 py-2.5 bg-base-200 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" 
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-neutral uppercase ml-1">Marca / Fabricante</label>
                        <input 
                            type="text" 
                            name="marca" 
                            value={formData.marca || ''} 
                            onChange={handleChange} 
                            placeholder="Ej: EASYPRINT"
                            className="w-full px-4 py-2.5 bg-base-200 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" 
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-neutral uppercase ml-1">Línea de Producción</label>
                        <input 
                            type="text" 
                            name="linea" 
                            value={formData.linea || ''} 
                            onChange={handleChange} 
                            placeholder="Ej: Línea 1"
                            className="w-full px-4 py-2.5 bg-base-200 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" 
                        />
                    </div>
                </div>
            </div>

            {/* SECCIÓN 3: ESTADO OPERATIVO */}
            <div className="p-4 bg-base-200/50 rounded-2xl border border-base-border/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl transition-colors ${formData.estado ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                            <CheckCircleIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-base-content uppercase tracking-tight">Estado de la Máquina</p>
                            <p className="text-[11px] text-neutral font-medium">{formData.estado ? 'Activa y disponible para servicios' : 'Fuera de servicio / En mantenimiento'}</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            name="estado" 
                            checked={formData.estado || false} 
                            onChange={handleChange} 
                            className="sr-only peer" 
                        />
                        <div className="w-12 h-6.5 bg-base-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2.5px] after:left-[2.5px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5.5 after:w-5.5 after:transition-all peer-checked:bg-success shadow-inner"></div>
                    </label>
                </div>
            </div>

            {/* FOOTER FIJO */}
            <div className="sticky bottom-[-24px] bg-base-100/90 backdrop-blur-md pt-6 pb-2 flex justify-end gap-3 mt-4 border-t border-base-border/50">
                <button 
                    type="button" 
                    onClick={onCancel} 
                    className="px-6 py-3 text-sm font-bold text-neutral hover:bg-base-300 rounded-xl transition-all uppercase tracking-wider"
                >
                    Cancelar
                </button>
                <button 
                    type="submit" 
                    disabled={isSaving} 
                    className="px-10 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-focus transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 uppercase tracking-wider text-sm"
                >
                    {isSaving ? <Spinner className="h-4 w-4 text-white" /> : null}
                    {isSaving ? 'Procesando...' : (machine ? 'Actualizar Máquina' : 'Registrar Máquina')}
                </button>
            </div>
        </form>
    );
};

export default MachineForm;