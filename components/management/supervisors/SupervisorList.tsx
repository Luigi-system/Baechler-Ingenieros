
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../../contexts/SupabaseContext';
import type { Supervisor } from '../../../types';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon } from '../../ui/Icons';
import Spinner from '../../ui/Spinner';
import Modal from '../../ui/Modal';
import SupervisorForm from './SupervisorForm';

const SupervisorList: React.FC = () => {
    const { supabase } = useSupabase();
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchSupervisors = async () => {
        if (!supabase) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from('Encargado')
            .select('*')
            .order('apellido');
            
        if (error) {
            setError(error.message);
        } else {
            setSupervisors(data as Supervisor[]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchSupervisors();
    }, [supabase]);
    
    const filteredSupervisors = supervisors.filter(s =>
        (`${s.nombre || ''} ${s.apellido || ''}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.nombreEmpresa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.nombrePlanta || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (supervisor: Supervisor) => {
        setEditingSupervisor(supervisor);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingSupervisor(null);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSupervisor(null);
    }

    const onSave = (_supervisor: Supervisor) => {
        fetchSupervisors();
        handleCloseModal();
    }

    const handleDelete = async (id: number) => {
        if (!supabase || !window.confirm('¿Estás seguro de que quieres eliminar a este encargado?')) return;

        const { error } = await supabase.from('Encargado').delete().eq('id', id);
        if (error) {
            alert(error.message);
        } else {
            fetchSupervisors();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-bold text-base-content">Gestionar Encargados</h3>
                    <p className="mt-1 text-sm text-neutral">
                       Añade, edita o elimina registros de encargados.
                    </p>
                </div>
                <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-focus">
                    <PlusIcon className="h-5 w-5" />
                    Añadir Encargado
                </button>
            </div>
            
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-neutral" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar por nombre, email, empresa o planta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 sm:text-sm input-style"
                />
            </div>

             {isLoading && <div className="flex justify-center"><Spinner /></div>}
            {error && <p className="text-error text-center">{error}</p>}

            {!isLoading && !error && (
                <div className="bg-base-200 shadow-lg rounded-xl overflow-hidden">
                    <div className="overflow-y-auto max-h-[60vh] relative custom-scrollbar">
                        <table className="w-full table-auto">
                            <thead className="bg-base-300 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Empresa</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Planta</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-base-border">
                                {filteredSupervisors.map(s => (
                                <tr key={s.id} className="hover:bg-base-300/50 even:bg-base-300/20 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-base-content break-words">{s.nombre} {s.apellido}</td>
                                    <td className="px-6 py-4 text-sm text-neutral break-words">{s.email || 'N/A'}</td>
                                    <td className="px-6 py-4 text-sm text-neutral break-words">{s.nombreEmpresa || 'N/A'}</td>
                                    <td className="px-6 py-4 text-sm text-neutral break-words">{s.nombrePlanta || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button onClick={() => handleEdit(s)} className="text-primary hover:text-primary-focus p-1 rounded-full hover:bg-primary/10 transition"><EditIcon className="h-5 w-5"/></button>
                                        <button onClick={() => handleDelete(s.id)} className="text-error hover:text-error/80 p-1 rounded-full hover:bg-error/10 transition"><TrashIcon className="h-5 w-5"/></button>
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingSupervisor ? 'Editar Encargado' : 'Añadir Nuevo Encargado'}>
                <SupervisorForm supervisor={editingSupervisor} onSave={onSave} onCancel={handleCloseModal}/>
            </Modal>
        </div>
    );
};

export default SupervisorList;
