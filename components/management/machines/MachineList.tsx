
import React, { useState, useEffect, useMemo } from 'react';
import { useSupabase } from '../../../contexts/SupabaseContext';
import type { Machine, Company, Plant } from '../../../types';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, XIcon } from '../../ui/Icons';
import Spinner from '../../ui/Spinner';
import Modal from '../../ui/Modal';
import MachineForm from './MachineForm';

type StatusFilter = 'all' | 'active' | 'inactive';

const MachineList: React.FC = () => {
    const { supabase } = useSupabase();
    
    // Data states
    const [machines, setMachines] = useState<Machine[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [plants, setPlants] = useState<Plant[]>([]);

    // UI states
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMachine, setEditingMachine] = useState<Machine | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCompany, setSelectedCompany] = useState<string>('all');
    const [selectedPlant, setSelectedPlant] = useState<string>('all');
    const [selectedBrand, setSelectedBrand] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');

    const fetchData = async () => {
        if (!supabase) return;
        setIsLoading(true);
        setError(null);
        try {
            const [machinesRes, companiesRes, plantsRes] = await Promise.all([
                 supabase.from('Maquinas').select('*, planta:Planta(nombre), empresa:Empresa(nombre)').order('serie'),
                 supabase.from('Empresa').select('id, nombre').order('nombre'),
                 supabase.from('Planta').select('id, nombre, id_empresa').order('nombre')
            ]);

            if (machinesRes.error) throw machinesRes.error;
            if (companiesRes.error) throw companiesRes.error;
            if (plantsRes.error) throw plantsRes.error;

            const formattedMachines = machinesRes.data.map((m: any) => ({
                ...m, 
                planta_nombre: m.planta?.nombre,
                empresa_nombre: m.empresa?.nombre
            }));
            setMachines(formattedMachines as Machine[]);
            setCompanies(companiesRes.data as Company[]);
            setPlants(plantsRes.data as Plant[]);

        } catch(err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [supabase]);

    const availablePlants = useMemo(() => {
        if (selectedCompany === 'all') return plants;
        return plants.filter(p => p.id_empresa === parseInt(selectedCompany));
    }, [selectedCompany, plants]);

    const availableBrands = useMemo(() => {
        const brands = new Set(machines.map(m => m.marca).filter(Boolean));
        return Array.from(brands).sort();
    }, [machines]);

    const filteredMachines = useMemo(() => {
        return machines.filter(machine => {
            const searchMatch = searchTerm === '' ||
                (machine.serie || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (machine.modelo || '').toLowerCase().includes(searchTerm.toLowerCase());

            const companyMatch = selectedCompany === 'all' || machine.id_empresa === parseInt(selectedCompany);
            const plantMatch = selectedPlant === 'all' || machine.id_planta === parseInt(selectedPlant);
            const brandMatch = selectedBrand === 'all' || machine.marca === selectedBrand;
            
            const statusMatch = selectedStatus === 'all' ||
                (selectedStatus === 'active' && machine.estado) ||
                (selectedStatus === 'inactive' && !machine.estado);

            return searchMatch && companyMatch && plantMatch && brandMatch && statusMatch;
        });
    }, [machines, searchTerm, selectedCompany, selectedPlant, selectedBrand, selectedStatus]);
    
    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedCompany('all');
        setSelectedPlant('all');
        setSelectedBrand('all');
        setSelectedStatus('all');
    }

    const handleEdit = (machine: Machine) => {
        setEditingMachine(machine);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingMachine(null);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMachine(null);
    }

    // FIX: Updated onSave to match the new signature of MachineForm's onSave prop.
    const onSave = (_machine: Machine) => {
        fetchData();
        handleCloseModal();
    }

    const handleDelete = async (id: number) => {
        if (!supabase || !window.confirm('¿Estás seguro de que quieres eliminar esta máquina?')) return;

        const { error } = await supabase.from('Maquinas').delete().eq('id', id);
        if (error) {
            alert(error.message);
        } else {
            fetchData();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Gestionar Máquinas</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                       Añade, edita o elimina registros de máquinas.
                    </p>
                </div>
                <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark">
                    <PlusIcon className="h-5 w-5" />
                    Añadir Máquina
                </button>
            </div>
            
            {/* Advanced Filters */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Company Filter */}
                    <div>
                        <label htmlFor="company-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Empresa</label>
                        <select id="company-filter" value={selectedCompany} onChange={e => {setSelectedCompany(e.target.value); setSelectedPlant('all');}} className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                           <option value="all">Todas las empresas</option>
                           {companies.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    </div>
                     {/* Plant Filter */}
                    <div>
                        <label htmlFor="plant-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Planta</label>
                        <select id="plant-filter" value={selectedPlant} onChange={e => setSelectedPlant(e.target.value)} disabled={selectedCompany === 'all'} className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:bg-gray-200 dark:disabled:bg-gray-600">
                           <option value="all">Todas las plantas</option>
                           {availablePlants.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                    </div>
                     {/* Brand Filter */}
                    <div>
                        <label htmlFor="brand-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Marca</label>
                        <select id="brand-filter" value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                           <option value="all">Todas las marcas</option>
                           {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                     {/* Text Search */}
                     <div className="relative">
                        <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Serie / Modelo</label>
                        <SearchIcon className="absolute top-9 left-3 h-5 w-5 text-gray-400 pointer-events-none" />
                        <input
                            type="text" id="search-filter"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mt-1 block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                    {/* Status Filter */}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado:</span>
                        <div className="inline-flex rounded-md shadow-sm" role="group">
                            <button type="button" onClick={() => setSelectedStatus('all')} className={`py-1 px-3 text-sm font-medium rounded-l-lg border ${selectedStatus === 'all' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>Todos</button>
                            <button type="button" onClick={() => setSelectedStatus('active')} className={`py-1 px-3 text-sm font-medium border-t border-b ${selectedStatus === 'active' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>Activos</button>
                            <button type="button" onClick={() => setSelectedStatus('inactive')} className={`py-1 px-3 text-sm font-medium rounded-r-md border ${selectedStatus === 'inactive' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>Inactivos</button>
                        </div>
                    </div>
                     {/* Clear Filters Button */}
                     <button onClick={handleClearFilters} className="flex items-center gap-1 text-sm text-primary hover:underline">
                        <XIcon className="h-4 w-4" />
                        Limpiar Filtros
                    </button>
                </div>

            </div>

             {isLoading && <div className="flex justify-center"><Spinner /></div>}
            {error && <p className="text-red-500 text-center">{error}</p>}

            {!isLoading && !error && (
                 <>
                 <p className="text-sm text-gray-500 dark:text-gray-400">Mostrando {filteredMachines.length} de {machines.length} máquinas.</p>
                 <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
                    <div className="overflow-y-auto max-h-[60vh] relative custom-scrollbar">
                        <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">N° de Serie</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Modelo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Empresa</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Planta</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredMachines.length > 0 ? (
                                    filteredMachines.map(machine => (
                                    <tr key={machine.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{machine.serie}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 break-words">{machine.modelo || 'N/A'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 break-words">{machine.empresa_nombre || 'N/A'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 break-words">{machine.planta_nombre || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${machine.estado ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                {machine.estado ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={() => handleEdit(machine)} className="text-primary hover:text-primary-dark p-1 rounded-full hover:bg-primary/10 transition"><EditIcon className="h-5 w-5"/></button>
                                            <button onClick={() => handleDelete(machine.id)} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-500/10 transition"><TrashIcon className="h-5 w-5"/></button>
                                        </td>
                                    </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            No se encontraron máquinas que coincidan con los filtros.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                 </div>
                 </>
            )}
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingMachine ? 'Editar Máquina' : 'Añadir Nueva Máquina'}>
                <MachineForm machine={editingMachine} onSave={onSave} onCancel={handleCloseModal}/>
            </Modal>
        </div>
    );
};

export default MachineList;