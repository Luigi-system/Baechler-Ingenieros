
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Machine, Company, Plant } from '../../../types';
import { 
    PlusIcon, EditIcon, TrashIcon, SearchIcon, ViewIcon, 
    CogIcon, MapPinIcon, BuildingIcon, ClockIcon, 
    ChevronDownIcon, ChevronRightIcon, CheckCircleIcon 
} from '../../ui/Icons';
import Spinner from '../../ui/Spinner';
import Modal from '../../ui/Modal';
import MachineForm from './MachineForm';

type StatusFilter = 'all' | 'active' | 'inactive';

interface LocationSelection {
    type: 'all' | 'company' | 'plant';
    id?: number;
    name?: string;
    parentName?: string;
}

const MachineList: React.FC = () => {
    // Data states
    const [machines, setMachines] = useState<Machine[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [plants, setPlants] = useState<Plant[]>([]);

    // UI states
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
    const [viewingMachine, setViewingMachine] = useState<Machine | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrand, setSelectedBrand] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
    const [locationSelection, setLocationSelection] = useState<LocationSelection>({ type: 'all' });

    // Custom Dropdown state
    const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
    const [hoveredCompany, setHoveredCompany] = useState<number | null>(null);
    const pickerRef = useRef<HTMLDivElement>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [machinesRes, companiesRes, plantsRes] = await Promise.all([
                 fetch('https://app.lr-system.com/bi/maquinas/getall').then(r => r.json()),
                 fetch('https://app.lr-system.com/bi/empresas/getall').then(r => r.json()),
                 fetch('https://app.lr-system.com/bi/planta/getall').then(r => r.json())
            ]);

            const machinesList = Array.isArray(machinesRes) ? machinesRes : (machinesRes.data || []);
            const companiesList = Array.isArray(companiesRes) ? companiesRes : (companiesRes.data || []);
            const plantsList = Array.isArray(plantsRes) ? plantsRes : (plantsRes.data || []);

            const formattedMachines = machinesList.map((m: any) => ({
                ...m, 
                planta_nombre: m.nombre_planta,
                empresa_nombre: m.nombre_empresa
            }));

            setMachines(formattedMachines as Machine[]);
            setCompanies(companiesList as Company[]);
            setPlants(plantsList.map((p: any) => ({ ...p, empresa_nombre: p.nombreempresa })) as Plant[]);

        } catch(err: any) {
            setError(err.message || 'Error al cargar los datos');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        
        // Close picker when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsLocationPickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const availableBrands = useMemo(() => {
        const brands = new Set(machines.map(m => m.marca).filter(Boolean));
        return Array.from(brands).sort();
    }, [machines]);

    const filteredMachines = useMemo(() => {
        return machines.filter(machine => {
            const searchMatch = searchTerm === '' ||
                (machine.serie || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (machine.modelo || '').toLowerCase().includes(searchTerm.toLowerCase());

            // Brand selection
            const brandMatch = selectedBrand === 'all' || machine.marca === selectedBrand;
            
            // Status selection
            const statusMatch = selectedStatus === 'all' ||
                (selectedStatus === 'active' && machine.estado) ||
                (selectedStatus === 'inactive' && !machine.estado);

            // Location selection (Hierarchical logic)
            let locationMatch = true;
            if (locationSelection.type === 'company') {
                locationMatch = (machine.empresa_nombre || '').trim().toLowerCase() === (locationSelection.name || '').trim().toLowerCase();
            } else if (locationSelection.type === 'plant') {
                locationMatch = (machine.planta_nombre || '').trim().toLowerCase() === (locationSelection.name || '').trim().toLowerCase() &&
                                (machine.empresa_nombre || '').trim().toLowerCase() === (locationSelection.parentName || '').trim().toLowerCase();
            }

            return searchMatch && brandMatch && statusMatch && locationMatch;
        });
    }, [machines, searchTerm, selectedBrand, selectedStatus, locationSelection]);
    
    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedBrand('all');
        setSelectedStatus('all');
        setLocationSelection({ type: 'all' });
    }

    const handleEdit = (machine: Machine) => {
        setEditingMachine(machine);
        setIsModalOpen(true);
    };

    const handleView = (machine: Machine) => {
        setViewingMachine(machine);
        setIsViewModalOpen(true);
    };

    const handleAdd = () => {
        setEditingMachine(null);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMachine(null);
    }

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setViewingMachine(null);
    }

    const onSave = () => {
        fetchData();
        handleCloseModal();
    }

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta máquina?')) return;
        try {
            const response = await fetch(`https://app.lr-system.com/bi/maquinas/delete/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Error al eliminar');
            fetchData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const selectLocation = (selection: LocationSelection) => {
        setLocationSelection(selection);
        setIsLocationPickerOpen(false);
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex flex-col xl:flex-row gap-4 items-center">
                {/* Unified Search and Hierarchical Filter Bar */}
                <div className="flex flex-col md:flex-row gap-3 flex-1 w-full">
                    {/* Search Field */}
                    <div className="relative flex-1">
                        <SearchIcon className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-neutral" />
                        <input
                            type="text"
                            placeholder="Buscar por serie o modelo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-9 pr-3 py-2.5 text-sm bg-base-200 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                        />
                    </div>
                    
                    {/* Hierarchical Location Picker (Wow Factor) */}
                    <div className="relative z-20" ref={pickerRef}>
                        <button 
                            onClick={() => setIsLocationPickerOpen(!isLocationPickerOpen)}
                            className={`flex items-center gap-2 px-4 py-2.5 bg-base-200 border border-base-border rounded-xl text-sm font-semibold transition-all shadow-sm hover:bg-base-300 w-full md:w-[280px] justify-between ${locationSelection.type !== 'all' ? 'border-primary ring-1 ring-primary/20 text-primary' : 'text-base-content'}`}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <MapPinIcon className="h-4 w-4" />
                                <span className="truncate">
                                    {locationSelection.type === 'all' ? 'Todas las ubicaciones' : 
                                     locationSelection.type === 'company' ? locationSelection.name : 
                                     `${locationSelection.parentName} > ${locationSelection.name}`}
                                </span>
                            </div>
                            <ChevronDownIcon className={`h-4 w-4 transition-transform ${isLocationPickerOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isLocationPickerOpen && (
                            <div className="absolute top-full left-0 mt-2 bg-base-100 border border-base-border rounded-2xl shadow-2xl overflow-hidden flex min-w-[500px] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* Level 1: Companies */}
                                <div className="w-1/2 border-r border-base-border bg-base-200/50 flex flex-col max-h-[400px]">
                                    <div className="p-2 border-b border-base-border bg-base-300/30">
                                        <button 
                                            onClick={() => selectLocation({ type: 'all' })}
                                            className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/10 rounded-xl transition-all"
                                        >
                                            Ver Todo el Perú
                                            {locationSelection.type === 'all' && <CheckCircleIcon className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                                        {companies.map(c => (
                                            <div 
                                                key={c.id}
                                                onMouseEnter={() => setHoveredCompany(c.id)}
                                                className={`group flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all ${hoveredCompany === c.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-neutral hover:bg-base-300'}`}
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <BuildingIcon className="h-4 w-4 opacity-70" />
                                                    <span className="truncate">{c.nombre}</span>
                                                </div>
                                                <ChevronRightIcon className="h-4 w-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Level 2: Plants */}
                                <div className="w-1/2 flex flex-col bg-base-100 max-h-[400px]">
                                    {hoveredCompany ? (
                                        <>
                                            <div className="p-3 border-b border-base-border bg-base-200/20">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral mb-1 px-2">Plantas / Sedes de</h4>
                                                <div className="text-sm font-bold text-base-content px-2 truncate">
                                                    {companies.find(c => c.id === hoveredCompany)?.nombre}
                                                </div>
                                            </div>
                                            <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                                                <button 
                                                    onClick={() => {
                                                        const company = companies.find(c => c.id === hoveredCompany);
                                                        if (company) selectLocation({ type: 'company', id: company.id, name: company.nombre });
                                                    }}
                                                    className="w-full text-left px-4 py-2 rounded-xl text-sm font-bold text-primary hover:bg-primary/10 transition-all border border-dashed border-primary/30 mb-2"
                                                >
                                                    Filtrar por TODA la empresa
                                                </button>
                                                {plants.filter(p => p.id_empresa === hoveredCompany).length > 0 ? (
                                                    plants.filter(p => p.id_empresa === hoveredCompany).map(p => (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => selectLocation({ 
                                                                type: 'plant', 
                                                                id: p.id, 
                                                                name: p.nombre, 
                                                                parentName: companies.find(c => c.id === hoveredCompany)?.nombre 
                                                            })}
                                                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${locationSelection.type === 'plant' && locationSelection.id === p.id ? 'bg-primary/10 text-primary border border-primary/20' : 'text-neutral hover:bg-base-200'}`}
                                                        >
                                                            <div className="flex items-center gap-2 truncate">
                                                                <MapPinIcon className="h-3.5 w-3.5 opacity-60" />
                                                                <span className="truncate">{p.nombre}</span>
                                                            </div>
                                                            {locationSelection.type === 'plant' && locationSelection.id === p.id && <CheckCircleIcon className="h-4 w-4" />}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-8 text-center text-xs text-neutral italic">No hay sedes registradas</div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral">
                                            <MapPinIcon className="h-12 w-12 opacity-10 mb-3" />
                                            <p className="text-xs font-medium uppercase tracking-widest opacity-40">Selecciona una empresa para ver sus sedes</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Brand Selector */}
                    <div className="relative">
                        <select 
                            value={selectedBrand} 
                            onChange={e => setSelectedBrand(e.target.value)} 
                            className="block w-full md:w-[200px] px-4 py-2.5 text-sm bg-base-200 border border-base-border rounded-xl outline-none cursor-pointer font-semibold shadow-sm hover:bg-base-300 transition-all appearance-none pr-10"
                        >
                            <option value="all">Todas las Marcas</option>
                            {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral pointer-events-none" />
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={handleClearFilters}
                            className="px-4 py-2.5 text-xs font-bold text-neutral border border-base-border rounded-xl hover:bg-base-300 transition-all whitespace-nowrap uppercase tracking-wider"
                        >
                            Limpiar
                        </button>
                        <button 
                            onClick={handleAdd} 
                            className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-focus transition-all shadow-lg shadow-primary/20 active:scale-95 whitespace-nowrap"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Alta de Máquina
                        </button>
                    </div>
                </div>
            </div>
            
            {isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center bg-base-200/50 rounded-xl border border-base-border border-dashed font-sans">
                    <Spinner className="h-8 w-8 text-primary mb-2" />
                    <p className="text-sm text-neutral animate-pulse">Cargando parque de máquinas...</p>
                </div>
            )}
            
            {error && (
                <div className="flex-1 flex flex-col items-center justify-center bg-error/5 rounded-xl border border-error/20 border-dashed p-6 text-center">
                    <p className="text-error font-medium mb-2">{error}</p>
                    <button onClick={fetchData} className="text-xs text-primary underline hover:text-primary-focus">Reintentar</button>
                </div>
            )}

            {!isLoading && !error && (
                 <div className="bg-base-200 border border-base-border shadow-sm rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
                    <div className="overflow-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead className="bg-base-300 border-b border-base-border sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-5 py-3 text-xs font-bold text-neutral uppercase tracking-wider">Información de Máquina</th>
                                    <th className="px-5 py-3 text-xs font-bold text-neutral uppercase tracking-wider">Marca</th>
                                    <th className="px-5 py-3 text-xs font-bold text-neutral uppercase tracking-wider">Ubicación Actual</th>
                                    <th className="px-5 py-3 text-xs font-bold text-neutral uppercase tracking-wider">Estado</th>
                                    <th className="px-5 py-3 text-xs font-bold text-neutral uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-base-border">
                                {filteredMachines.length > 0 ? filteredMachines.map(machine => (
                                <tr key={machine.id} className="hover:bg-primary/5 transition-colors group">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center">
                                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mr-3 text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                                                <CogIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-base-content uppercase font-mono">{machine.serie}</div>
                                                <div className="text-[10px] text-neutral font-medium uppercase tracking-tight">{machine.modelo || 'S/M'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-sm font-semibold text-neutral">{machine.marca || '---'}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-base-content line-clamp-1 truncate max-w-[200px]">{machine.empresa_nombre || 'No asignada'}</span>
                                            <span className="text-[10px] text-neutral flex items-center mt-0.5">
                                                <MapPinIcon className="h-2.5 w-2.5 mr-1" /> {machine.planta_nombre || 'Sin Sede'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 inline-flex text-[10px] leading-5 font-bold rounded-full uppercase tracking-wider ${machine.estado ? 'bg-success/10 text-success' : 'bg-base-300 text-neutral'}`}>
                                            {machine.estado ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right space-x-1 whitespace-nowrap">
                                        <button 
                                            onClick={() => handleView(machine)} 
                                            className="inline-flex items-center justify-center h-8 w-8 text-neutral hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                            title="Ver detalles"
                                        >
                                            <ViewIcon className="h-4 w-4"/>
                                        </button>
                                        <button 
                                            onClick={() => handleEdit(machine)} 
                                            className="inline-flex items-center justify-center h-8 w-8 text-neutral hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                            title="Editar"
                                        >
                                            <EditIcon className="h-4 w-4"/>
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(machine.id)} 
                                            className="inline-flex items-center justify-center h-8 w-8 text-neutral hover:text-error hover:bg-error/10 rounded-lg transition-all"
                                            title="Eliminar"
                                        >
                                            <TrashIcon className="h-4 w-4"/>
                                        </button>
                                    </td>
                                </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-12 text-center text-neutral italic text-sm">
                                            No se encontraron máquinas con los criterios de búsqueda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-3 bg-base-300/30 border-t border-base-border text-xs text-neutral flex justify-between items-center mt-auto">
                        <div className="flex items-center gap-4">
                            <span>Total Máquinas: {machines.length}</span>
                            <span>Filtradas: {filteredMachines.length}</span>
                        </div>
                        <span className="opacity-50 font-mono">MACHINE_ASSET_v2.0</span>
                    </div>
                 </div>
            )}
            
            {/* Modal para Formulario */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingMachine ? 'Configurar Máquina' : 'Alta de Nueva Unidad'}>
                <MachineForm machine={editingMachine} onSave={onSave} onCancel={handleCloseModal}/>
            </Modal>

            {/* Modal para Ver Detalles */}
            <Modal isOpen={isViewModalOpen} onClose={handleCloseViewModal} title="Ficha Técnica de Máquina">
                {viewingMachine && (
                    <div className="space-y-6">
                        <div className="flex items-center pb-6 border-b border-base-border">
                            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mr-5 shadow-sm border border-primary/20">
                                <CogIcon className="h-12 w-12" />
                            </div>
                            <div>
                                <h4 className="text-3xl font-black text-base-content leading-tight tracking-tighter uppercase font-mono">{viewingMachine.serie}</h4>
                                <div className="flex items-center mt-2 text-sm text-neutral">
                                    <span className="px-2 py-0.5 bg-base-300 rounded font-bold mr-3 text-[11px] uppercase tracking-wide">MODELO: {viewingMachine.modelo || 'GENERIC'}</span>
                                    <span className={`px-2 py-0.5 inline-flex text-[10px] leading-5 font-bold rounded-full uppercase tracking-wider ${viewingMachine.estado ? 'bg-success/10 text-success' : 'bg-base-300 text-neutral'}`}>
                                        {viewingMachine.estado ? 'Operativa' : 'Fuera de Servicio'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="bg-base-200/50 p-4 rounded-xl border border-base-border flex flex-col group hover:border-primary/30 transition-colors">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center">
                                    <CogIcon className="h-3 w-3 mr-1" /> Marca Fabricante
                                </span>
                                <span className="text-sm font-bold text-base-content">{viewingMachine.marca || 'Genérica'}</span>
                            </div>

                            <div className="bg-base-200/50 p-4 rounded-xl border border-base-border flex flex-col group hover:border-primary/30 transition-colors">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center">
                                    <BuildingIcon className="h-3 w-3 mr-1" /> Empresa Cliente
                                </span>
                                <span className="text-sm font-bold text-base-content">{viewingMachine.empresa_nombre || 'No asignada'}</span>
                            </div>

                            <div className="bg-base-200/50 p-4 rounded-xl border border-base-border flex flex-col group hover:border-primary/30 transition-colors">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center">
                                    <MapPinIcon className="h-3 w-3 mr-1" /> Planta / Sede
                                </span>
                                <span className="text-sm font-bold text-base-content">{viewingMachine.planta_nombre || 'No asignada'}</span>
                            </div>

                            <div className="bg-base-200/50 p-4 rounded-xl border border-base-border flex flex-col lg:col-span-3 group hover:border-primary/30 transition-colors">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center">
                                    <ClockIcon className="h-3 w-3 mr-1" /> Fecha de Registro en Sistema
                                </span>
                                <span className="text-sm font-medium text-base-content">
                                    {viewingMachine.created_at ? new Date(viewingMachine.created_at).toLocaleString() : 'Registro inicial'}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button 
                                onClick={handleCloseViewModal}
                                className="px-10 py-3 bg-primary text-white hover:bg-primary-focus rounded-xl transition-all font-bold shadow-lg active:scale-95 text-sm uppercase tracking-wider"
                            >
                                Cerrar Ficha
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MachineList;

