import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Supervisor, Company, Plant } from '../../../types';
import Spinner from '../../ui/Spinner';
import SearchableSelect from '../../ui/SearchableSelect';
import { PlusIcon, SearchIcon, BuildingIcon, MapPinIcon, UserIcon, LockIcon } from '../../ui/Icons';

interface SupervisorFormProps {
    supervisor: Supervisor | null;
    onSave: (supervisor: Supervisor) => void;
    onCancel: () => void;
    defaultCompanyName?: string;
    defaultPlantName?: string;
}

const SupervisorForm: React.FC<SupervisorFormProps> = ({ supervisor, onSave, onCancel, defaultCompanyName, defaultPlantName }) => {
    const [formData, setFormData] = useState<Partial<Supervisor>>(() => ({
        nombres: supervisor?.nombres || '',
        apellidos: supervisor?.apellidos || '',
        dni: supervisor?.dni || '',
        nacimiento: supervisor?.nacimiento || '',
        email: supervisor?.email || '',
        pass: supervisor?.pass || '',
        celular: supervisor?.celular,
        cargo: supervisor?.cargo || '',
        nombreEmpresa: supervisor?.nombreEmpresa || defaultCompanyName || '',
        nombrePlanta: supervisor?.nombrePlanta || defaultPlantName || '',
        foto: supervisor?.foto || ''
    }));

    const [companies, setCompanies] = useState<Company[]>([]);
    const [plants, setPlants] = useState<Plant[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [compRes, plantRes] = await Promise.all([
                fetch('https://app.lr-system.com/bi/empresas/getall').then(r => r.json()),
                fetch('https://app.lr-system.com/bi/planta/getall').then(r => r.json())
            ]);
            setCompanies(Array.isArray(compRes) ? compRes : (compRes.data || []));
            setPlants(Array.isArray(plantRes) ? plantRes : (plantRes.data || []));
        } catch (error) {
            console.error("Error al cargar auxiliares:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const url = supervisor 
            ? `https://app.lr-system.com/bi/encargado/update/${supervisor.id}`
            : 'https://app.lr-system.com/bi/encargado/create';
        
        const method = supervisor ? 'PUT' : 'POST';

        // Prepare payload according to API documentation
        const payload = {
            nombres: formData.nombres,
            apellidos: formData.apellidos,
            dni: formData.dni,
            nacimiento: formData.nacimiento,
            email: formData.email,
            pass: formData.pass,
            foto: formData.foto,
            celular: formData.celular?.toString(),
            cargo: formData.cargo,
            nombreEmpresa: formData.nombreEmpresa,
            nombrePlanta: formData.nombrePlanta
        };

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Error en el servidor');
            
            onSave(formData as Supervisor);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center"><Spinner /></div>;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-base-200/50 p-6 rounded-2xl border border-base-border space-y-6">
                {/* Personal Information Section */}
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center">
                        <UserIcon className="h-3 w-3 mr-2" /> Datos Personales
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-neutral uppercase ml-1">Nombres</label>
                            <input
                                type="text"
                                name="nombres"
                                value={formData.nombres}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                                placeholder="Ej. Juan Carlos"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-neutral uppercase ml-1">Apellidos</label>
                            <input
                                type="text"
                                name="apellidos"
                                value={formData.apellidos}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                                placeholder="Ej. Pérez García"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-neutral uppercase ml-1">DNI / ID</label>
                            <input
                                type="text"
                                name="dni"
                                value={formData.dni}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium font-mono"
                                placeholder="8 dígitos"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-neutral uppercase ml-1">Fecha Nacimiento</label>
                            <input
                                type="date"
                                name="nacimiento"
                                value={formData.nacimiento}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Account & Contact Section */}
                <div className="pt-4 border-t border-base-border">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center">
                        <LockIcon className="h-3 w-3 mr-2" /> Seguridad y Contacto
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-neutral uppercase ml-1">Email Corporativo</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                                placeholder="usuario@empresa.com"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-neutral uppercase ml-1">Contraseña</label>
                            <input
                                type="password"
                                name="pass"
                                value={formData.pass}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-neutral uppercase ml-1">Celular</label>
                            <input
                                type="text"
                                name="celular"
                                value={formData.celular || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                                placeholder="+51 999..."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-neutral uppercase ml-1">Cargo / Puesto</label>
                            <input
                                type="text"
                                name="cargo"
                                value={formData.cargo}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                                placeholder="Ej. Supervisor de Planta"
                            />
                        </div>
                    </div>
                </div>

                {/* Assignment Section */}
                <div className="pt-4 border-t border-base-border">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center">
                        <BuildingIcon className="h-3 w-3 mr-2" /> Asignación de Ubicación
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-neutral uppercase ml-1">Empresa</label>
                            <SearchableSelect
                                options={companies.map(c => ({ id: c.nombre, label: c.nombre }))}
                                value={formData.nombreEmpresa}
                                onChange={(val) => setFormData(prev => ({ ...prev, nombreEmpresa: val as string, nombrePlanta: '' }))}
                                placeholder="Busca o escribe empresa..."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-neutral uppercase ml-1">Sede / Planta</label>
                            <SearchableSelect
                                options={plants.filter(p => {
                                    if (!formData.nombreEmpresa) return false;
                                    const selectedCo = companies.find(c => c.nombre === formData.nombreEmpresa);
                                    const targetCoName = formData.nombreEmpresa.toLowerCase();
                                    return (p.empresa_nombre || '').toLowerCase() === targetCoName ||
                                           (p.nombreempresa || '').toLowerCase() === targetCoName ||
                                           (selectedCo && Number(p.id_empresa) === Number(selectedCo.id));
                                }).map(p => ({ id: p.nombre, label: p.nombre }))}
                                value={formData.nombrePlanta}
                                onChange={(val) => setFormData(prev => ({ ...prev, nombrePlanta: val as string }))}
                                disabled={!formData.nombreEmpresa}
                                placeholder="Busca o escribe planta..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="sticky bottom-[-24px] bg-base-100/90 backdrop-blur-md pt-4 pb-1 flex justify-end gap-3 mt-6 border-t border-base-border/50">
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
                    {isSaving ? <Spinner className="h-4 w-4" /> : null}
                    {isSaving ? 'Procesando...' : supervisor ? 'Actualizar Perfil' : 'Crear Encargado'}
                </button>
            </div>
        </form>
    );
};

export default SupervisorForm;
