
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Supervisor, Company, Plant } from '../../../types';
import { 
    PlusIcon, EditIcon, TrashIcon, SearchIcon, ViewIcon, 
    UserIcon, MapPinIcon, BuildingIcon, ClockIcon, 
    ChevronDownIcon, ChevronRightIcon, CheckCircleIcon,
    MailIcon, PhoneIcon
} from '../../ui/Icons';
import Spinner from '../../ui/Spinner';
import Modal from '../../ui/Modal';
import SupervisorForm from './SupervisorForm';

interface LocationSelection {
    type: 'all' | 'company' | 'plant';
    id?: number;
    name?: string;
    parentName?: string;
}

const SupervisorList: React.FC = () => {
    // Data states
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [plants, setPlants] = useState<Plant[]>([]);

    // UI states
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null);
    const [viewingSupervisor, setViewingSupervisor] = useState<Supervisor | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [locationSelection, setLocationSelection] = useState<LocationSelection>({ type: 'all' });

    // Custom Dropdown state
    const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
    const [hoveredCompany, setHoveredCompany] = useState<number | null>(null);
    const pickerRef = useRef<HTMLDivElement>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [superRes, compRes, plantRes] = await Promise.all([
                fetch('https://app.lr-system.com/bi/encargado/getall').then(r => r.json()),
                fetch('https://app.lr-system.com/bi/empresas/getall').then(r => r.json()),
                fetch('https://app.lr-system.com/bi/planta/getall').then(r => r.json())
            ]);

            const superList = Array.isArray(superRes) ? superRes : (superRes.data || []);
            const compList = Array.isArray(compRes) ? compRes : (compRes.data || []);
            const plantList = Array.isArray(plantRes) ? plantRes : (plantRes.data || []);

            setSupervisors(superList as Supervisor[]);
            setCompanies(compList as Company[]);
            setPlants(plantList as Plant[]);

        } catch (err: any) {
            setError(err.message || 'Error al conectar con la API');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setIsLocationPickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredSupervisors = useMemo(() => {
        return supervisors.filter(s => {
            const fullName = `${s.nombres || ''} ${s.apellidos || ''}`.toLowerCase();
            const searchMatch = searchTerm === '' || 
                fullName.includes(searchTerm.toLowerCase()) ||
                (s.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (s.dni || '').includes(searchTerm);

            let locationMatch = true;
            if (locationSelection.type === 'company') {
                locationMatch = (s.nombreEmpresa || '').trim().toLowerCase() === (locationSelection.name || '').trim().toLowerCase();
            } else if (locationSelection.type === 'plant') {
                locationMatch = (s.nombrePlanta || '').trim().toLowerCase() === (locationSelection.name || '').trim().toLowerCase() &&
                                (s.nombreEmpresa || '').trim().toLowerCase() === (locationSelection.parentName || '').trim().toLowerCase();
            }

            return searchMatch && locationMatch;
        });
    }, [supervisors, searchTerm, locationSelection]);

    const handleEdit = (supervisor: Supervisor) => {
        setEditingSupervisor(supervisor);
        setIsModalOpen(true);
    };

    const handleView = (supervisor: Supervisor) => {
        setViewingSupervisor(supervisor);
        setIsViewModalOpen(true);
    };

    const handleAdd = () => {
        setEditingSupervisor(null);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSupervisor(null);
    }

    const onSave = () => {
        fetchData();
        handleCloseModal();
    }

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar a este encargado?')) return;
        try {
            const res = await fetch(`https://app.lr-system.com/bi/encargado/delete/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Error al eliminar');
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
                <div className="flex flex-col md:flex-row gap-3 flex-1 w-full">
                    {/* Search Field */}
                    <div className="relative flex-1">
                        <SearchIcon className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-neutral" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o DNI..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-9 pr-3 py-2.5 text-sm bg-base-200 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                        />
                    </div>
                    
                    {/* Unified Hierarchical Filter */}
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
                                <div className="w-1/2 border-r border-base-border bg-base-200/50 flex flex-col max-h-[400px]">
                                    <div className="p-2 border-b border-base-border bg-base-300/30">
                                        <button onClick={() => selectLocation({ type: 'all' })} className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/10 rounded-xl transition-all">
                                            Ver Todo el Perú
                                            {locationSelection.type === 'all' && <CheckCircleIcon className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                                        {companies.map(c => (
                                            <div key={c.id} onMouseEnter={() => setHoveredCompany(c.id)} className={`group flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all ${hoveredCompany === c.id ? 'bg-primary text-white' : 'text-neutral hover:bg-base-300'}`}>
                                                <div className="flex items-center gap-2 truncate">
                                                    <BuildingIcon className="h-4 w-4 opacity-70" />
                                                    <span className="truncate">{c.nombre}</span>
                                                </div>
                                                <ChevronRightIcon className="h-4 w-4 opacity-50" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="w-1/2 flex flex-col bg-base-100 max-h-[400px]">
                                    {hoveredCompany ? (
                                        <>
                                            <div className="p-3 border-b border-base-border bg-base-200/20">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral mb-1 px-2">Sedes de</h4>
                                                <div className="text-sm font-bold text-base-content px-2 truncate">{companies.find(c => c.id === hoveredCompany)?.nombre}</div>
                                            </div>
                                            <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                                                <button onClick={() => { const c = companies.find(c => c.id === hoveredCompany); if(c) selectLocation({ type: 'company', id: c.id, name: c.nombre }); }} className="w-full text-left px-4 py-2 rounded-xl text-sm font-bold text-primary hover:bg-primary/10 transition-all border border-dashed border-primary/30 mb-2">Filtrar por Empresa</button>
                                                {plants.filter(p => p.id_empresa === hoveredCompany).map(p => (
                                                    <button key={p.id} onClick={() => selectLocation({ type: 'plant', id: p.id, name: p.nombre, parentName: companies.find(c => c.id === hoveredCompany)?.nombre })} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${locationSelection.type === 'plant' && locationSelection.id === p.id ? 'bg-primary/10 text-primary' : 'text-neutral hover:bg-base-200'}`}>
                                                        <span className="truncate">{p.nombre}</span>
                                                        {locationSelection.type === 'plant' && locationSelection.id === p.id && <CheckCircleIcon className="h-4 w-4" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center p-8 opacity-40 text-xs font-bold uppercase tracking-widest text-center">Selecciona una empresa</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={handleAdd} className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-focus transition-all shadow-lg shadow-primary/20 active:scale-95 whitespace-nowrap">
                        <PlusIcon className="h-4 w-4" />
                        Nuevo Encargado
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center font-sans">
                     <Spinner className="h-8 w-8 text-primary mb-2" />
                     <p className="text-sm text-neutral animate-pulse">Cargando gestión de personal...</p>
                </div>
            ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center text-error border border-error/20 rounded-xl bg-error/5 border-dashed">
                    <p className="font-bold">{error}</p>
                    <button onClick={fetchData} className="mt-2 text-xs underline">Reintentar</button>
                </div>
            ) : (
                <div className="bg-base-200 border border-base-border shadow-sm rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
                    <div className="overflow-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead className="bg-base-300 border-b border-base-border sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-5 py-3 text-xs font-bold text-neutral uppercase tracking-wider">Identidad y Contacto</th>
                                    <th className="px-5 py-3 text-xs font-bold text-neutral uppercase tracking-wider">Cargo</th>
                                    <th className="px-5 py-3 text-xs font-bold text-neutral uppercase tracking-wider">Asignación</th>
                                    <th className="px-5 py-3 text-xs font-bold text-neutral uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-base-border">
                                {filteredSupervisors.length > 0 ? filteredSupervisors.map(s => (
                                    <tr key={s.id} className="hover:bg-primary/5 transition-colors group">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 text-primary group-hover:bg-primary group-hover:text-white transition-all overflow-hidden border border-primary/20">
                                                    {s.foto ? <img src={s.foto} alt="" className="h-full w-full object-cover" /> : <UserIcon className="h-6 w-6" />}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-base-content">{s.nombres} {s.apellidos}</div>
                                                    <div className="text-[10px] text-neutral font-medium flex items-center gap-2">
                                                        <MailIcon className="h-2.5 w-2.5" /> {s.email || 'N/A'}
                                                        <span className="opacity-30">|</span>
                                                        <PhoneIcon className="h-2.5 w-2.5" /> {s.celular || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="px-2 py-1 bg-base-300 rounded-lg text-[10px] font-bold text-neutral uppercase tracking-wider">{s.cargo || 'Funcionario'}</span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-base-content">{s.nombreEmpresa || 'No asignado'}</span>
                                                <span className="text-[10px] text-neutral flex items-center mt-0.5">
                                                    <MapPinIcon className="h-2.5 w-2.5 mr-1" /> {s.nombrePlanta || 'Sin Sede'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-right space-x-1 whitespace-nowrap">
                                            <button onClick={() => handleView(s)} className="inline-flex items-center justify-center h-8 w-8 text-neutral hover:text-primary hover:bg-primary/10 rounded-lg transition-all"><ViewIcon className="h-4 w-4"/></button>
                                            <button onClick={() => handleEdit(s)} className="inline-flex items-center justify-center h-8 w-8 text-neutral hover:text-primary hover:bg-primary/10 rounded-lg transition-all"><EditIcon className="h-4 w-4"/></button>
                                            <button onClick={() => handleDelete(s.id)} className="inline-flex items-center justify-center h-8 w-8 text-neutral hover:text-error hover:bg-error/10 rounded-lg transition-all"><TrashIcon className="h-4 w-4"/></button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} className="px-5 py-12 text-center text-neutral italic text-sm">No se encontraron encargados.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-3 bg-base-300/30 border-t border-base-border text-[10px] text-neutral flex justify-between items-center mt-auto font-mono uppercase tracking-widest">
                        <span>Total: {supervisors.length} registros</span>
                        <span>Filtro activo: {locationSelection.type === 'all' ? 'NACIONAL' : locationSelection.name}</span>
                    </div>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingSupervisor ? 'Configuración de Perfil' : 'Alta de Encargado'}>
                <SupervisorForm supervisor={editingSupervisor} onSave={onSave} onCancel={handleCloseModal}/>
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Ficha de Personal">
                {viewingSupervisor && (
                    <div className="space-y-6">
                        <div className="flex items-center pb-6 border-b border-base-border">
                            <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mr-6 shadow-md border border-primary/20 overflow-hidden">
                                {viewingSupervisor.foto ? <img src={viewingSupervisor.foto} className="h-full w-full object-cover" /> : <UserIcon className="h-12 w-12" />}
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-base-content leading-none mb-1">{viewingSupervisor.nombres} {viewingSupervisor.apellidos}</h4>
                                <p className="text-primary font-bold text-sm uppercase tracking-widest">{viewingSupervisor.cargo || 'Funcionario General'}</p>
                                <div className="mt-3 flex gap-4">
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold text-neutral uppercase opacity-50">DNI</p>
                                        <p className="text-xs font-mono font-bold">{viewingSupervisor.dni || '---'}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold text-neutral uppercase opacity-50">Celular</p>
                                        <p className="text-xs font-mono font-bold">{viewingSupervisor.celular || '---'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-base-200/50 p-4 rounded-xl border border-base-border">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 block">Empresa</span>
                                <div className="flex items-center gap-2">
                                    <BuildingIcon className="h-4 w-4 text-neutral" />
                                    <span className="text-sm font-bold text-base-content">{viewingSupervisor.nombreEmpresa || 'No asignada'}</span>
                                </div>
                            </div>
                            <div className="bg-base-200/50 p-4 rounded-xl border border-base-border">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 block">Sede / Planta</span>
                                <div className="flex items-center gap-2">
                                    <MapPinIcon className="h-4 w-4 text-neutral" />
                                    <span className="text-sm font-bold text-base-content">{viewingSupervisor.nombrePlanta || 'No asignada'}</span>
                                </div>
                            </div>
                            <div className="bg-base-200/50 p-4 rounded-xl border border-base-border col-span-full">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 block">Correo Electrónico</span>
                                <div className="flex items-center gap-2">
                                    <MailIcon className="h-4 w-4 text-neutral" />
                                    <span className="text-sm font-medium text-base-content">{viewingSupervisor.email || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                             <button onClick={() => setIsViewModalOpen(false)} className="px-8 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary-focus transition-all text-xs uppercase tracking-widest">Cerrar Ficha</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default SupervisorList;
