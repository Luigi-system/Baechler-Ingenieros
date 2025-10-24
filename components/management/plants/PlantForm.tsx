
import React, { useState, useEffect } from 'react';
import type { Plant, Company } from '../../../types';
import { useSupabase } from '../../../contexts/SupabaseContext';
import Spinner from '../../ui/Spinner';

interface PlantFormProps {
    plant: Plant | null;
    onSave: (plant: Plant) => Promise<void> | void;
    onCancel: () => void;
}

const PlantForm: React.FC<PlantFormProps> = ({ plant, onSave, onCancel }) => {
    const { supabase } = useSupabase();
    const [formData, setFormData] = useState<Partial<Plant>>(plant || {
        nombre: '',
        direccion: '',
        estado: true,
        id_empresa: undefined,
    });
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

    useEffect(() => {
        const fetchCompanies = async () => {
            if (!supabase) return;
            setIsLoadingCompanies(true);
            const { data, error } = await supabase.from('Empresa').select('id, nombre');
            if (!error && data) {
                setCompanies(data as Company[]);
                if (!plant && data.length > 0) {
                    setFormData(prev => ({...prev, id_empresa: data[0]?.id}))
                }
            }
            setIsLoadingCompanies(false);
        };
        fetchCompanies();
    }, [supabase, plant]);
    

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase || !formData.nombre || !formData.id_empresa) {
            alert("Por favor, proporciona un nombre para la planta y selecciona una empresa.");
            return;
        }

        setIsSaving(true);
        const payload = { ...formData, id_empresa: Number(formData.id_empresa) };

        // FIX: Chained .select().single() to the query builder before awaiting to get the saved record back.
        const { data, error } = await (plant
            ? supabase.from('Planta').update(payload).eq('id', plant.id)
            : supabase.from('Planta').insert([payload])
        ).select().single();

        setIsSaving(false);
        if (error) {
            alert(`Error: ${error.message}`);
        } else if(data) {
            await onSave(data as Plant);
        }
    };

    if (isLoadingCompanies) return <div className="flex justify-center"><Spinner /></div>

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
                <label htmlFor="nombre" className="block text-sm font-medium">Nombre de la Planta</label>
                <input type="text" name="nombre" id="nombre" value={formData.nombre || ''} onChange={handleChange} required className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
                <label htmlFor="direccion" className="block text-sm font-medium">Dirección</label>
                <input type="text" name="direccion" id="direccion" value={formData.direccion || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
             <div className="flex items-center">
                <input type="checkbox" name="estado" id="estado" checked={formData.estado || false} onChange={handleChange} className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary" />
                <label htmlFor="estado" className="ml-2 block text-sm">Activo</label>
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving} className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-primary/50 flex items-center">
                    {isSaving && <Spinner />}
                    {isSaving ? 'Guardando...' : 'Guardar Planta'}
                </button>
            </div>
        </form>
    );
};

export default PlantForm;
