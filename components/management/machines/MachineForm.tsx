import React, { useState, useEffect } from 'react';
import type { Machine, Plant, Company } from '../../../types';
import { useSupabase } from '../../../contexts/SupabaseContext';
import Spinner from '../../ui/Spinner';

interface MachineFormProps {
    machine: Machine | null;
    // FIX: Updated onSave to accept an async function and return the saved machine.
    onSave: (machine: Machine) => Promise<void> | void;
    onCancel: () => void;
    defaultCompanyId?: number; // New prop for default company
    defaultPlantId?: number;   // New prop for default plant
}

const MachineForm: React.FC<MachineFormProps> = ({ machine, onSave, onCancel, defaultCompanyId, defaultPlantId }) => {
    const { supabase } = useSupabase();
    const [formData, setFormData] = useState<Partial<Machine>>(machine || {
        serie: '',
        modelo: '',
        marca: '',
        linea: '',
        estado: true,
        id_empresa: defaultCompanyId, // Initialize with defaultCompanyId
        id_planta: defaultPlantId,   // Initialize with defaultPlantId
    });

    const [companies, setCompanies] = useState<Company[]>([]);
    const [allPlants, setAllPlants] = useState<Plant[]>([]);
    const [filteredPlants, setFilteredPlants] = useState<Plant[]>([]);
    
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        const fetchDataAndInitialize = async () => {
            if (!supabase) {
                setIsLoadingData(false);
                return;
            }
            setIsLoadingData(true);

            // Fetch companies and plants in parallel for efficiency
            const [companiesRes, plantsRes] = await Promise.all([
                supabase.from('Empresa').select('id, nombre'),
                supabase.from('Planta').select('id, nombre, id_empresa')
            ]);

            const companiesData = (companiesRes.data as Company[]) || [];
            const allPlantsData = (plantsRes.data as Plant[]) || [];

            setCompanies(companiesData);
            setAllPlants(allPlantsData);

            if (machine) {
                // Editing an existing machine.
                let machineCompanyId = machine.id_empresa;

                // **LOGIC FIX**: If the machine is missing a company ID but has a plant ID,
                // find the company ID through the plant's relationships.
                if (!machineCompanyId && machine.id_planta) {
                    const associatedPlant = allPlantsData.find(p => p.id === machine.id_planta);
                    if (associatedPlant) {
                        machineCompanyId = associatedPlant.id_empresa;
                    }
                }
                
                // Set the form data with the (potentially derived) company ID.
                setFormData({ ...machine, id_empresa: machineCompanyId });

            } else {
                // Creating a new machine, set a default company if available.
                const defaultCompany = defaultCompanyId !== undefined
                    ? companiesData.find(c => c.id === defaultCompanyId)
                    : (companiesData.length > 0 ? companiesData[0] : undefined);
                
                const defaultPlant = defaultPlantId !== undefined
                    ? allPlantsData.find(p => p.id === defaultPlantId && p.id_empresa === defaultCompany?.id)
                    : undefined;

                setFormData(prev => ({ 
                    ...prev, 
                    id_empresa: defaultCompany?.id,
                    id_planta: defaultPlant?.id
                }));
            }

            setIsLoadingData(false);
        };

        fetchDataAndInitialize();
    }, [supabase, machine, defaultCompanyId, defaultPlantId]);
    
    // This useEffect remains crucial for a responsive UI. It filters the plants
    // whenever the selected company changes in the form.
    useEffect(() => {
        if (formData.id_empresa) {
            const relevantPlants = allPlants.filter(p => p.id_empresa === Number(formData.id_empresa));
            setFilteredPlants(relevantPlants);
            // If the current plant doesn't belong to the selected company, reset it.
            if (formData.id_planta && !relevantPlants.some(p => p.id === formData.id_planta)) {
                 setFormData(prev => ({ ...prev, id_planta: undefined }));
            }
        } else {
            setFilteredPlants([]);
        }
    }, [formData.id_empresa, allPlants]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (name === 'id_empresa') {
            setFormData(prev => ({ ...prev, id_empresa: Number(value), id_planta: undefined }));
        } else {
            const isCheckbox = type === 'checkbox';
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase || !formData.serie || !formData.id_planta || !formData.id_empresa) {
             alert("Por favor, proporciona un N° de Serie, selecciona una Empresa y una Planta.");
            return;
        }
        
        setIsSaving(true);
        const payload = { 
            ...formData, 
            id_planta: Number(formData.id_planta),
            id_empresa: Number(formData.id_empresa)
        };

        // FIX: Modified Supabase query to use .select() to get the saved data back.
        const request = machine
            ? supabase.from('Maquinas').update(payload).eq('id', machine.id)
            : supabase.from('Maquinas').insert([payload]);
        
        const { data, error } = await request.select().single();

        setIsSaving(false);
        if (error) {
            alert(`Error: ${error.message}`);
        } else if (data) {
            // FIX: Pass the returned data to the onSave callback.
            await onSave(data as Machine);
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
            <div>
                <label htmlFor="serie" className="block text-sm font-medium">N° de Serie</label>
                <input type="text" name="serie" id="serie" value={formData.serie || ''} onChange={handleChange} required className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
                <label htmlFor="modelo" className="block text-sm font-medium">Modelo</label>
                <input type="text" name="modelo" id="modelo" value={formData.modelo || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
                <label htmlFor="marca" className="block text-sm font-medium">Marca</label>
                <input type="text" name="marca" id="marca" value={formData.marca || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
                <label htmlFor="linea" className="block text-sm font-medium">Línea</label>
                <input type="text" name="linea" id="linea" value={formData.linea || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
             <div className="flex items-center">
                <input type="checkbox" name="estado" id="estado" checked={formData.estado || false} onChange={handleChange} className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary" />
                <label htmlFor="estado" className="ml-2 block text-sm">Activo</label>
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving} className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-primary/50 flex items-center">
                    {isSaving && <Spinner />}
                    {isSaving ? 'Guardando...' : 'Guardar Máquina'}
                </button>
            </div>
        </form>
    );
};

export default MachineForm;