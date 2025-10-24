
import React, { useState, useEffect } from 'react';
import type { Supervisor, Plant, Company } from '../../../types';
import { useSupabase } from '../../../contexts/SupabaseContext';
import Spinner from '../../ui/Spinner';

interface SupervisorFormProps {
    supervisor: Supervisor | null;
    onSave: (supervisor: Supervisor) => Promise<void> | void;
    onCancel: () => void;
}

const SupervisorForm: React.FC<SupervisorFormProps> = ({ supervisor, onSave, onCancel }) => {
    const { supabase } = useSupabase();
    const [formData, setFormData] = useState<Partial<Supervisor>>(supervisor || {
        nombre: '',
        apellido: '',
        email: '',
        celular: undefined,
        id_empresa: undefined,
        id_planta: undefined,
    });
    
    const [companies, setCompanies] = useState<Company[]>([]);
    const [allPlants, setAllPlants] = useState<Plant[]>([]);
    const [filteredPlants, setFilteredPlants] = useState<Plant[]>([]);
    
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!supabase) return;
            setIsLoadingData(true);
            const { data: companiesData, error: companiesError } = await supabase.from('Empresa').select('id, nombre');
            const { data: plantsData, error: plantsError } = await supabase.from('Planta').select('id, nombre, id_empresa');

            if (!companiesError && companiesData) {
                setCompanies(companiesData as Company[]);
                if (!supervisor && companiesData.length > 0) {
                    setFormData(prev => ({ ...prev, id_empresa: companiesData[0].id }));
                }
            }
            if (!plantsError && plantsData) {
                setAllPlants(plantsData as Plant[]);
            }
            setIsLoadingData(false);
        };
        fetchData();
    }, [supabase, supervisor]);

    useEffect(() => {
        if (formData.id_empresa) {
            const relevantPlants = allPlants.filter(p => p.id_empresa === Number(formData.id_empresa));
            setFilteredPlants(relevantPlants);
            if (formData.id_planta && !relevantPlants.some(p => p.id === formData.id_planta)) {
                 setFormData(prev => ({ ...prev, id_planta: undefined }));
            }
        } else {
            setFilteredPlants([]);
        }
    }, [formData.id_empresa, allPlants]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'id_empresa') {
            setFormData(prev => ({ ...prev, id_empresa: Number(value), id_planta: undefined }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase || !formData.nombre || !formData.id_planta || !formData.id_empresa) {
            alert("Por favor, proporciona un nombre y selecciona una empresa y planta.");
            return;
        }
        
        setIsSaving(true);
        const payload = { 
            ...formData, 
            id_planta: Number(formData.id_planta),
            id_empresa: Number(formData.id_empresa),
            celular: formData.celular ? Number(formData.celular) : null 
        };

        // FIX: Chained .select().single() to the query builder before awaiting to get the saved record back.
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
    
    if (isLoadingData) return <div className="flex justify-center"><Spinner /></div>

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label htmlFor="id_empresa" className="block text-sm font-medium">Empresa</label>
                <select name="id_empresa" id="id_empresa" value={formData.id_empresa || ''} onChange={handleChange} required className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600">
                    <option value="" disabled>Selecciona una empresa</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="id_planta" className="block text-sm font-medium">Planta</label>
                <select name="id_planta" id="id_planta" value={formData.id_planta || ''} onChange={handleChange} required disabled={!formData.id_empresa || filteredPlants.length === 0} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-600">
                    <option value="" disabled>Selecciona una planta</option>
                    {filteredPlants.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="nombre" className="block text-sm font-medium">Nombres</label>
                    <input type="text" name="nombre" id="nombre" value={formData.nombre || ''} onChange={handleChange} required className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label htmlFor="apellido" className="block text-sm font-medium">Apellidos</label>
                    <input type="text" name="apellido" id="apellido" value={formData.apellido || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                </div>
            </div>
             <div>
                <label htmlFor="email" className="block text-sm font-medium">Email</label>
                <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
                <label htmlFor="celular" className="block text-sm font-medium">Celular</label>
                <input type="number" name="celular" id="celular" value={formData.celular || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
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
