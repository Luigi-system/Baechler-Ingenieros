

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Supervisor, Company, Plant } from '../../../types';
import { useSupabase } from '../../../contexts/SupabaseContext';
import Spinner from '../../ui/Spinner';
import Modal from '../../ui/Modal';
import CompanyForm from '../companies/CompanyForm';
import PlantForm from '../plants/PlantForm';
import { PlusIcon, SearchIcon, UserPlusIcon } from '../../ui/Icons';


interface SupervisorFormProps {
    supervisor: Supervisor | null;
    onSave: (supervisor: Supervisor) => Promise<void> | void;
    onCancel: () => void;
    defaultCompanyName?: string;
    defaultPlantName?: string;
}

const SupervisorForm: React.FC<SupervisorFormProps> = ({ supervisor, onSave, onCancel, defaultCompanyName, defaultPlantName }) => {
    const { supabase } = useSupabase();
    const [formData, setFormData] = useState<Partial<Supervisor>>(() => {
        const initialData = supervisor || {
            nombre: '',
            apellido: '',
            dni: '',
            nacimiento: '',
            email: '',
            celular: undefined,
            cargo: '',
            nombreEmpresa: defaultCompanyName || '',
            nombrePlanta: defaultPlantName || '',
        };
        return initialData;
    });
    
    // Internal states for managing relationships with Companies and Plants
    const [companies, setCompanies] = useState<Company[]>([]);
    const [plants, setPlants] = useState<Plant[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>(undefined);
    const [selectedPlantId, setSelectedPlantId] = useState<number | undefined>(undefined);
    
    // UI States for search and modals
    const [companySearchText, setCompanySearchText] = useState(formData.nombreEmpresa || '');
    const [plantSearchText, setPlantSearchText] = useState(formData.nombrePlanta || '');

    const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
    const [showPlantSuggestions, setShowPlantSuggestions] = useState(false);
    
    const [isNewCompanyModalOpen, setIsNewCompanyModalOpen] = useState(false);
    const [isCompanySearchModalOpen, setIsCompanySearchModalOpen] = useState(false);
    const [isNewPlantModalOpen, setIsNewPlantModalOpen] = useState(false);
    const [isPlantSearchModalOpen, setIsPlantSearchModalOpen] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const fetchAllCompaniesAndPlants = useCallback(async () => {
        if (!supabase) return { companies: [], plants: [] };
        try {
            const [companiesRes, plantsRes] = await Promise.all([
                supabase.from('Empresa').select('id, nombre'),
                supabase.from('Planta').select('id, nombre, id_empresa'),
            ]);
            if (companiesRes.error) throw companiesRes.error;
            if (plantsRes.error) throw plantsRes.error;
            
            setCompanies(companiesRes.data);
            setPlants(plantsRes.data);
            return { companies: companiesRes.data, plants: plantsRes.data };
        } catch (error: any) {
            console.error("Error fetching companies and plants", error);
            return { companies: [], plants: [] };
        }
    }, [supabase]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoadingData(true);
            const { companies: fetchedCompanies, plants: fetchedPlants } = await fetchAllCompaniesAndPlants();

            if (supervisor) {
                // If editing, try to pre-fill based on current supervisor's company/plant names
                const currentCompany = fetchedCompanies.find(c => c.nombre === supervisor.nombreEmpresa);
                if (currentCompany) {
                    setSelectedCompanyId(currentCompany.id);
                    setCompanySearchText(currentCompany.nombre);
                    setFormData(prev => ({ ...prev, nombreEmpresa: currentCompany.nombre }));
                }
                const currentPlant = fetchedPlants.find(p => p.nombre === supervisor.nombrePlanta && (currentCompany ? p.id_empresa === currentCompany.id : true));
                if (currentPlant) {
                    setSelectedPlantId(currentPlant.id);
                    setPlantSearchText(currentPlant.nombre);
                    setFormData(prev => ({ ...prev, nombrePlanta: currentPlant.nombre }));
                }
            } else {
                // For new supervisor, use defaults from props if available
                if (defaultCompanyName) {
                    const defaultComp = fetchedCompanies.find(c => c.nombre === defaultCompanyName);
                    if (defaultComp) {
                        setSelectedCompanyId(defaultComp.id);
                        setCompanySearchText(defaultComp.nombre);
                        setFormData(prev => ({ ...prev, nombreEmpresa: defaultComp.nombre }));
                    }
                }
                if (defaultPlantName) {
                    const defaultPlt = fetchedPlants.find(p => p.nombre === defaultPlantName && (selectedCompanyId ? p.id_empresa === selectedCompanyId : true));
                    if (defaultPlt) {
                        setSelectedPlantId(defaultPlt.id);
                        setPlantSearchText(defaultPlt.nombre);
                        setFormData(prev => ({ ...prev, nombrePlanta: defaultPlt.nombre }));
                    }
                }
            }
            setIsLoadingData(false);
        };
        loadData();
    }, [supabase, supervisor, defaultCompanyName, defaultPlantName, fetchAllCompaniesAndPlants, formData.nombreEmpresa, formData.nombrePlanta, selectedCompanyId]);
    
    // Filtered plants for selection based on selected company
    const filteredPlantsOptions = useMemo(() => {
        if (!selectedCompanyId) return [];
        return plants.filter(p => p.id_empresa === selectedCompanyId);
    }, [selectedCompanyId, plants]);

    // Suggestions for company and plant search inputs
    const companySuggestions = useMemo(() => companySearchText ? companies.filter(c => (c.nombre || '').toLowerCase().includes(companySearchText.toLowerCase())).slice(0, 5) : [], [companySearchText, companies]);
    const plantSuggestions = useMemo(() => plantSearchText ? filteredPlantsOptions.filter(p => (p.nombre || '').toLowerCase().includes(plantSearchText.toLowerCase())).slice(0, 5) : [], [plantSearchText, filteredPlantsOptions]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectCompany = useCallback((company: Company) => {
        setSelectedCompanyId(company.id);
        setSelectedPlantId(undefined); // Reset plant selection when company changes
        setFormData(prev => ({ ...prev, nombreEmpresa: company.nombre, nombrePlanta: undefined }));
        setCompanySearchText(company.nombre);
        setPlantSearchText(''); // Clear plant search text
        setShowCompanySuggestions(false);
        setIsCompanySearchModalOpen(false);
    }, []);

    const handleSelectPlant = useCallback((plant: Plant) => {
        setSelectedPlantId(plant.id);
        setFormData(prev => ({ ...prev, nombrePlanta: plant.nombre }));
        setPlantSearchText(plant.nombre);
        setShowPlantSuggestions(false);
        setIsPlantSearchModalOpen(false);
    }, []);

    const handleCompanySaved = useCallback(async (newCompany: Company) => {
        await fetchAllCompaniesAndPlants(); // Re-fetch to update lists
        handleSelectCompany(newCompany);
        setIsNewCompanyModalOpen(false);
    }, [fetchAllCompaniesAndPlants, handleSelectCompany]);
    
    const handlePlantSaved = useCallback(async (newPlant: Plant) => {
        await fetchAllCompaniesAndPlants(); // Re-fetch to update lists
        // Ensure the newly created plant's company is still selected, then select the plant
        if (newPlant.id_empresa === selectedCompanyId) {
            handleSelectPlant(newPlant);
        } else {
            // If the new plant belongs to a different company, select that company first.
            const newCompany = companies.find(c => c.id === newPlant.id_empresa);
            if (newCompany) {
                handleSelectCompany(newCompany);
                // After selecting the company, then select the plant. This might require a small delay or a more complex state update.
                // For simplicity, we directly update formData and search text here.
                setSelectedPlantId(newPlant.id);
                setFormData(prev => ({ ...prev, nombrePlanta: newPlant.nombre }));
                setPlantSearchText(newPlant.nombre);
            }
        }
        setIsNewPlantModalOpen(false);
    }, [fetchAllCompaniesAndPlants, handleSelectCompany, handleSelectPlant, selectedCompanyId, companies]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase || !formData.nombre) {
            alert("Por favor, proporciona al menos un nombre.");
            return;
        }
        
        setIsSaving(true);
        const payload = { 
            ...formData, 
            celular: formData.celular ? Number(formData.celular) : null,
            nacimiento: formData.nacimiento || null, // Ensure empty string becomes null
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
    
    if (isLoadingData) return <div className="flex justify-center items-center h-full"><Spinner /> Cargando datos...</div>

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
                    <input type="number" name="celular" id="celular" value={formData.celular?.toString() || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label htmlFor="cargo" className="block text-sm font-medium">Cargo</label>
                    <input type="text" name="cargo" id="cargo" value={formData.cargo || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                </div>
            </div>
             {/* Empresa Combobox/Search */}
            <div>
                <label htmlFor="company-search" className="block text-sm font-medium">Nombre de Empresa</label>
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
             {/* Planta Combobox/Search */}
            <div>
                <label htmlFor="plant-search" className="block text-sm font-medium">Nombre de Planta / Sede</label>
                <div onBlur={() => setTimeout(() => setShowPlantSuggestions(false), 100)}>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="relative flex-grow">
                            <input id="plant-search" type="text" value={plantSearchText} onChange={(e) => setPlantSearchText(e.target.value)} onFocus={() => setShowPlantSuggestions(true)} disabled={!selectedCompanyId} placeholder="Seleccionar Planta" className="w-full input-style" autoComplete="off" />
                            {showPlantSuggestions && plantSuggestions.length > 0 && (
                                <ul className="absolute z-20 w-full bg-base-200 border border-base-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg custom-scrollbar">
                                    {plantSuggestions.map(p => <li key={p.id} onMouseDown={() => handleSelectPlant(p)} className="px-3 py-2 cursor-pointer hover:bg-base-300">{p.nombre}</li>)}
                                </ul>
                            )}
                        </div>
                        <button type="button" onClick={() => setIsNewPlantModalOpen(true)} disabled={!selectedCompanyId} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50" title="Crear Nueva Planta"><PlusIcon className="h-5 w-5"/></button>
                        <button type="button" onClick={() => setIsPlantSearchModalOpen(true)} disabled={!selectedCompanyId} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50" title="Buscar Planta"><SearchIcon className="h-5 w-5"/></button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving} className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-primary/50 flex items-center">
                    {isSaving && <Spinner />}
                    {isSaving ? 'Guardando...' : 'Guardar Encargado'}
                </button>
            </div>

            {/* Modals for Company and Plant management */}
            <Modal isOpen={isNewCompanyModalOpen} onClose={() => setIsNewCompanyModalOpen(false)} title="Añadir Nueva Empresa">
                <CompanyForm company={null} onSave={handleCompanySaved} onCancel={() => setIsNewCompanyModalOpen(false)}/>
            </Modal>
            <Modal isOpen={isCompanySearchModalOpen} onClose={() => setIsCompanySearchModalOpen(false)} title="Buscar Empresa">
                <ul className="max-h-80 overflow-y-auto divide-y divide-base-border custom-scrollbar">
                    {companies.map(c => <li key={c.id} onMouseDown={() => handleSelectCompany(c)} className="p-3 cursor-pointer hover:bg-base-300">{c.nombre}</li>)}
                </ul>
            </Modal>
            
            <Modal isOpen={isNewPlantModalOpen} onClose={() => setIsNewPlantModalOpen(false)} title="Añadir Nueva Planta">
                <PlantForm 
                    plant={null} 
                    onSave={handlePlantSaved} 
                    onCancel={() => setIsNewPlantModalOpen(false)}
                    defaultCompanyId={selectedCompanyId} // Pre-fill company if one is selected
                />
            </Modal>
            <Modal isOpen={isPlantSearchModalOpen} onClose={() => setIsPlantSearchModalOpen(false)} title="Buscar Planta">
                <ul className="max-h-80 overflow-y-auto divide-y divide-base-border custom-scrollbar">
                    {filteredPlantsOptions.map(p => <li key={p.id} onMouseDown={() => handleSelectPlant(p)} className="p-3 cursor-pointer hover:bg-base-300">{p.nombre}</li>)}
                    {filteredPlantsOptions.length === 0 && selectedCompanyId && (
                        <li className="px-3 py-2 text-center text-neutral">No hay plantas para la empresa seleccionada.</li>
                    )}
                    {!selectedCompanyId && (
                         <li className="px-3 py-2 text-center text-neutral">Selecciona una empresa primero para ver las plantas.</li>
                    )}
                </ul>
            </Modal>
        </form>
    );
};

export default SupervisorForm;
