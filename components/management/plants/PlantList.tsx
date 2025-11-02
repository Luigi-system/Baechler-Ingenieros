
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../../contexts/SupabaseContext';
import type { Plant } from '../../../types';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon } from '../../ui/Icons';
import Spinner from '../../ui/Spinner';
import Modal from '../../ui/Modal';
import PlantForm from './PlantForm';

const PlantList: React.FC = () => {
    const { supabase } = useSupabase();
    const [plants, setPlants] = useState<Plant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchPlants = async () => {
        if (!supabase) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from('Planta')
            .select('*, empresa:Empresa(nombre)')
            .order('nombre');
            
        if (error) {
            setError(error.message);
        } else {
            const formattedData = data.map((p: any) => ({...p, empresa_nombre: p.empresa.nombre}));
            setPlants(formattedData as Plant[]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchPlants();
    }, [supabase]);

    const filteredPlants = plants.filter(plant =>
        (plant.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plant.empresa_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plant.direccion || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (plant: Plant) => {
        setEditingPlant(plant);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingPlant(null);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPlant(null);
    }

    const onSave = (_plant: Plant) => {
        fetchPlants();
        handleCloseModal();
    }

    const handleDelete = async (id: number) => {
        if (!supabase || !window.confirm('¿Estás seguro de que quieres eliminar esta planta?')) return;

        const { error } = await supabase.from('Planta').delete().eq('id', id);
        if (error) {
            alert(error.message);
        } else {
            fetchPlants();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Gestionar Plantas / Sedes</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                       Añade, edita o elimina registros de plantas/sedes.
                    </p>
                </div>
                <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark">
                    <PlusIcon className="h-5 w-5" />
                    Añadir Planta
                </button>
            </div>
            
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar por nombre de planta, empresa o dirección..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                />
            </div>

             {isLoading && <div className="flex justify-center"><Spinner /></div>}
            {error && <p className="text-red-500 text-center">{error}</p>}

            {!isLoading && !error && (
                 <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
                    <div className="overflow-y-auto max-h-[60vh] relative custom-scrollbar">
                        <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Empresa</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dirección</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredPlants.map(plant => (
                                <tr key={plant.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white break-words">{plant.nombre}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 break-words">{plant.empresa_nombre || 'N/A'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 break-words">{plant.direccion || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${plant.estado ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                            {plant.estado ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button onClick={() => handleEdit(plant)} className="text-primary hover:text-primary-dark p-1 rounded-full hover:bg-primary/10 transition"><EditIcon className="h-5 w-5"/></button>
                                        <button onClick={() => handleDelete(plant.id)} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-500/10 transition"><TrashIcon className="h-5 w-5"/></button>
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 </div>
            )}
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingPlant ? 'Editar Planta' : 'Añadir Nueva Planta'}>
                <PlantForm plant={editingPlant} onSave={onSave} onCancel={handleCloseModal}/>
            </Modal>
        </div>
    );
};

export default PlantList;
