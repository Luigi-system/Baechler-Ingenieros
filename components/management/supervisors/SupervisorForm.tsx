

import React, { useState } from 'react';
import type { Supervisor } from '../../../types';
import { useSupabase } from '../../../contexts/SupabaseContext';
import Spinner from '../../ui/Spinner';

interface SupervisorFormProps {
    supervisor: Supervisor | null;
    onSave: (supervisor: Supervisor) => Promise<void> | void;
    onCancel: () => void;
    defaultCompanyName?: string;
    defaultPlantName?: string;
}

const SupervisorForm: React.FC<SupervisorFormProps> = ({ supervisor, onSave, onCancel, defaultCompanyName, defaultPlantName }) => {
    const { supabase } = useSupabase();
    const [formData, setFormData] = useState<Partial<Supervisor>>(supervisor || {
        nombre: '',
        apellido: '',
        dni: '',
        nacimiento: '',
        email: '',
        celular: undefined,
        cargo: '',
        nombreEmpresa: defaultCompanyName || '',
        nombrePlanta: defaultPlantName || '',
    });
    
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase || !formData.nombre) {
            alert("Por favor, proporciona al menos un nombre.");
            return;
        }
        
        setIsSaving(true);
        const payload = { 
            ...formData, 
            celular: formData.celular ? Number(formData.celular) : null 
        };

        const { data, error } = await (supervisor
            ? supabase.from('Encargado').update(payload).eq('id', supervisor.id)
            : supabase.from('Encargado').insert([payload])
        ).select().single();

        setIsSaving(false);
        if (error) {
            alert(`Error: ${error.message}`);
        } else if (data) {
            await onSave(data as Supervisor);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="nombre" className="block text-sm font-medium">Nombres</label>
                    <input type="text" name="nombre" id="nombre" value={formData.nombre || ''} onChange={handleChange} required className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label htmlFor="apellido" className="block text-sm font-medium">Apellidos</label>
                    <input type="text" name="apellido" id="apellido" value={formData.apellido || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                </div>
                 <div>
                    <label htmlFor="dni" className="block text-sm font-medium">DNI</label>
                    <input type="text" name="dni" id="dni" value={formData.dni || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label htmlFor="nacimiento" className="block text-sm font-medium">Fecha de Nacimiento</label>
                    <input type="date" name="nacimiento" id="nacimiento" value={formData.nacimiento || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium">Email</label>
                    <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label htmlFor="celular" className="block text-sm font-medium">Celular</label>
                    <input type="number" name="celular" id="celular" value={formData.celular || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label htmlFor="cargo" className="block text-sm font-medium">Cargo</label>
                    <input type="text" name="cargo" id="cargo" value={formData.cargo || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                </div>
            </div>
             <div>
                <label htmlFor="nombreEmpresa" className="block text-sm font-medium">Nombre de Empresa</label>
                <input type="text" name="nombreEmpresa" id="nombreEmpresa" value={formData.nombreEmpresa || ''} onChange={handleChange} placeholder="Empresa a la que pertenece" className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
             <div>
                <label htmlFor="nombrePlanta" className="block text-sm font-medium">Nombre de Planta / Sede</label>
                <input type="text" name="nombrePlanta" id="nombrePlanta" value={formData.nombrePlanta || ''} onChange={handleChange} placeholder="Planta a la que pertenece" className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>

            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving} className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-primary/50 flex items-center">
                    {isSaving && <Spinner />}
                    {isSaving ? 'Guardando...' : 'Guardar Encargado'}
                </button>
            </div>
        </form>
    );
};

export default SupervisorForm;