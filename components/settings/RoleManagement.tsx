
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';
import type { Role } from '../../types';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';
import Modal from '../ui/Modal';

const RoleManagement: React.FC = () => {
    const { supabase } = useSupabase();
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRole, setCurrentRole] = useState<Role | null>(null);
    const [roleName, setRoleName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchRoles = async () => {
        if (!supabase) return;
        setIsLoading(true);
        const { data, error } = await supabase.from('Roles').select('*').order('created_at', { ascending: false });
        if (error) {
            setError(error.message);
        } else {
            setRoles(data as Role[]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchRoles();
    }, [supabase]);

    const filteredRoles = roles.filter(role => 
        (role.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (role: Role | null = null) => {
        setCurrentRole(role);
        setRoleName(role ? role.nombre : '');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentRole(null);
        setRoleName('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase || !roleName.trim()) return;

        const roleData = { nombre: roleName.trim() };
        
        const request = currentRole
            ? supabase.from('Roles').update(roleData).eq('id', currentRole.id)
            : supabase.from('Roles').insert([roleData]);

        const { error } = await request.select().single();

        if (error) {
            alert(error.message);
        } else {
            handleCloseModal();
            fetchRoles();
        }
    };

    const handleDelete = async (id: number) => {
        if (!supabase || !window.confirm('¿Estás seguro de que quieres eliminar este rol?')) return;

        const { error } = await supabase.from('Roles').delete().eq('id', id);
        if (error) {
            alert(error.message);
        } else {
            fetchRoles();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Gestión de Roles</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Define roles y sus permisos de acceso para la aplicación.
                    </p>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark">
                    <PlusIcon className="h-5 w-5" />
                    Añadir Rol
                </button>
            </div>

            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar por nombre de rol..."
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre del Rol</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredRoles.map(role => (
                                    <tr key={role.id}>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white break-words">{role.nombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={() => handleOpenModal(role)} className="text-primary hover:text-primary-dark p-1 rounded-full hover:bg-primary/10 transition"><EditIcon className="h-5 w-5"/></button>
                                            <button onClick={() => handleDelete(role.id)} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-500/10 transition"><TrashIcon className="h-5 w-5"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentRole ? 'Editar Rol' : 'Añadir Nuevo Rol'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Rol</label>
                        <input
                            type="text"
                            id="roleName"
                            value={roleName}
                            onChange={e => setRoleName(e.target.value)}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                            required
                        />
                    </div>
                    <div className="flex justify-end pt-4 space-x-2">
                        <button type="button" onClick={handleCloseModal} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
                        <button type="submit" className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors">Guardar Rol</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default RoleManagement;
