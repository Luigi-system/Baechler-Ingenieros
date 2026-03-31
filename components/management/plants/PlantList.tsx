
import React, { useState, useEffect } from 'react';
import type { Plant } from '../../../types';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, ViewIcon, BuildingIcon, ClockIcon, MapPinIcon, HashIcon } from '../../ui/Icons';
import Spinner from '../../ui/Spinner';
import Modal from '../../ui/Modal';
import { useNotification } from '../../../contexts/NotificationContext';
import PlantForm from './PlantForm';

const PlantList: React.FC = () => {
    const { addNotification, confirm } = useNotification();
    const [plants, setPlants] = useState<Plant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
    const [viewingPlant, setViewingPlant] = useState<Plant | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchPlants = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('https://app.lr-system.com/bi/planta/getall');
            if (!response.ok) throw new Error('Error al obtener las plantas');
            const data = await response.json();
            
            // Handle both direct array and object-wrapped array responses
            const sourceData = Array.isArray(data) ? data : (data.data || []);
            
            const formattedData = sourceData.map((p: any) => ({
                ...p,
                empresa_nombre: p.nombreempresa
            }));
            
            setPlants(formattedData as Plant[]);
        } catch (err: any) {
            setError(err.message || "Error al cargar las plantas");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPlants();
    }, []);

    const filteredPlants = plants.filter(plant =>
        (plant.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plant.empresa_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plant.direccion || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (plant: Plant) => {
        setEditingPlant(plant);
        setIsModalOpen(true);
    };

    const handleView = (plant: Plant) => {
        setViewingPlant(plant);
        setIsViewModalOpen(true);
    };

    const handleAdd = () => {
        setEditingPlant(null);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPlant(null);
    }

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setViewingPlant(null);
    }

    const onSave = () => {
        fetchPlants();
        handleCloseModal();
    }

    const handleDelete = async (id: number) => {
        confirm({
            title: '¿Eliminar planta?',
            message: '¿Estás seguro de que quieres eliminar esta planta? Todos los datos asociados se perderán.',
            onConfirm: async () => {
                try {
                    const response = await fetch(`https://app.lr-system.com/bi/planta/delete/${id}`, {
                        method: 'DELETE'
                    });
                    if (!response.ok) throw new Error('Error al eliminar la planta');
                    addNotification({ type: 'success', title: 'Planta Eliminada', message: 'La planta ha sido eliminada correctamente.' });
                    fetchPlants();
                } catch (err: any) {
                    addNotification({ type: 'error', title: 'Error', message: err.message });
                }
            }
        });
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-4 w-4 text-neutral" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar planta por nombre, empresa o dirección..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-9 pr-3 py-2 text-sm bg-base-200 border border-base-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                    />
                </div>
                <button 
                    onClick={handleAdd} 
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-focus transition-all shadow-md active:scale-95 shrink-0 w-full sm:w-auto"
                >
                    <PlusIcon className="h-4 w-4" />
                    Añadir Planta
                </button>
            </div>
            
            {isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center bg-base-200/50 rounded-xl border border-base-border border-dashed">
                    <Spinner className="h-8 w-8 text-primary mb-2" />
                    <p className="text-sm text-neutral animate-pulse">Cargando plantas...</p>
                </div>
            )}
            
            {error && (
                <div className="flex-1 flex flex-col items-center justify-center bg-error/5 rounded-xl border border-error/20 border-dashed p-6 text-center">
                    <p className="text-error font-medium mb-2">{error}</p>
                    <button onClick={fetchPlants} className="text-xs text-primary underline hover:text-primary-focus">Reintentar</button>
                </div>
            )}

            {!isLoading && !error && (
                 <div className="bg-base-200 border border-base-border shadow-sm rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
                    <div className="overflow-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-base-300 border-b border-base-border sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-5 py-3 text-xs font-bold text-neutral uppercase tracking-wider">Nombre de Planta</th>
                                    <th className="px-5 py-3 text-xs font-bold text-neutral uppercase tracking-wider">Empresa Asociada</th>
                                    <th className="px-5 py-3 text-xs font-bold text-neutral uppercase tracking-wider">Dirección</th>
                                    <th className="px-5 py-3 text-xs font-bold text-neutral uppercase tracking-wider">Estado</th>
                                    <th className="px-5 py-3 text-xs font-bold text-neutral uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-base-border">
                                {filteredPlants.length > 0 ? filteredPlants.map(plant => (
                                <tr key={plant.id} className="hover:bg-primary/5 transition-colors group">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3 text-primary shrink-0">
                                                <BuildingIcon className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-semibold text-base-content line-clamp-1">{plant.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-sm text-neutral">
                                        <div className="flex items-center">
                                            <span className="px-2 py-0.5 bg-base-300 rounded text-[10px] font-bold text-neutral uppercase mr-2 truncate max-w-[150px]">
                                                {plant.empresa_nombre || 'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-sm text-neutral line-clamp-2 max-w-[200px]">{plant.direccion || '---'}</td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 inline-flex text-[10px] leading-5 font-bold rounded-full uppercase tracking-wider ${plant.estado ? 'bg-success/10 text-success' : 'bg-base-300 text-neutral'}`}>
                                            {plant.estado ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right space-x-1 whitespace-nowrap">
                                        <button 
                                            onClick={() => handleView(plant)} 
                                            className="inline-flex items-center justify-center h-7 w-7 text-neutral hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                            title="Ver detalles"
                                        >
                                            <ViewIcon className="h-4 w-4"/>
                                        </button>
                                        <button 
                                            onClick={() => handleEdit(plant)} 
                                            className="inline-flex items-center justify-center h-7 w-7 text-neutral hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                            title="Editar"
                                        >
                                            <EditIcon className="h-4 w-4"/>
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(plant.id)} 
                                            className="inline-flex items-center justify-center h-7 w-7 text-neutral hover:text-error hover:bg-error/10 rounded-lg transition-all"
                                            title="Eliminar"
                                        >
                                            <TrashIcon className="h-4 w-4"/>
                                        </button>
                                    </td>
                                </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-10 text-center text-neutral italic text-sm">
                                            No se encontraron plantas registradas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-3 bg-base-300/30 border-t border-base-border text-xs text-neutral flex justify-between items-center mt-auto">
                        <span>Sedes Operativas: {filteredPlants.length}</span>
                        <span className="opacity-50 font-mono">PLANT_MGMT_v1.2</span>
                    </div>
                 </div>
            )}
            
            {/* Modal para Formulario (Crear/Editar) */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingPlant ? 'Configurar Planta' : 'Registro de Nueva Planta'}>
                <PlantForm plant={editingPlant} onSave={onSave} onCancel={handleCloseModal}/>
            </Modal>

            {/* Modal para Ver Detalles */}
            <Modal isOpen={isViewModalOpen} onClose={handleCloseViewModal} title="Detalles de Planta / Sede">
                {viewingPlant && (
                    <div className="space-y-5">
                        <div className="flex items-center pb-5 border-b border-base-border">
                            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mr-4 shadow-sm border border-primary/20">
                                <BuildingIcon className="h-9 w-9" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold text-base-content leading-tight">{viewingPlant.nombre}</h4>
                                <div className="flex items-center mt-1 text-sm text-neutral">
                                    <span className="px-2 py-0.5 bg-base-300 rounded text-xs font-mono mr-2">ID: #{viewingPlant.id}</span>
                                    <span className={`px-2 py-0.5 inline-flex text-[10px] leading-5 font-bold rounded-full uppercase tracking-wider ${viewingPlant.estado ? 'bg-success/10 text-success' : 'bg-base-300 text-neutral'}`}>
                                        {viewingPlant.estado ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-base-200/50 p-4 rounded-xl border border-base-border flex flex-col group hover:border-primary/30 transition-colors">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center">
                                    <BuildingIcon className="h-3 w-3 mr-1" /> Empresa Responsable
                                </span>
                                <span className="text-sm font-semibold text-base-content">{viewingPlant.empresa_nombre || 'No asociada'}</span>
                            </div>

                            <div className="bg-base-200/50 p-4 rounded-xl border border-base-border flex flex-col group hover:border-primary/30 transition-colors">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center">
                                    <ClockIcon className="h-3 w-3 mr-1" /> Fecha de Registro
                                </span>
                                <span className="text-sm font-medium text-base-content">
                                    {viewingPlant.created_at ? new Date(viewingPlant.created_at).toLocaleDateString() : 'Cargado recientemente'}
                                </span>
                            </div>

                            <div className="bg-base-200/50 p-4 rounded-xl border border-base-border flex flex-col md:col-span-2 group hover:border-primary/30 transition-colors">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center">
                                    <MapPinIcon className="h-3 w-3 mr-1" /> Ubicación de la Planta
                                </span>
                                <span className="text-sm font-medium text-base-content leading-relaxed">{viewingPlant.direccion || 'Sin dirección registrada'}</span>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button 
                                onClick={handleCloseViewModal}
                                className="px-8 py-2.5 bg-primary text-white hover:bg-primary-focus rounded-lg transition-all font-semibold shadow-md active:scale-95"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PlantList;
