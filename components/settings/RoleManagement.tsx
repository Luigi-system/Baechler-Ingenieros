
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
                    <h3 className="text-xl font-bold text-base-content">Gestión de Roles</h3>
                    <p className="mt-1 text-sm text-neutral">
                        Define roles y sus permisos de acceso para la aplicación.
                    </p>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-focus">
                    <PlusIcon className="h-5 w-5" />
                    Añadir Rol
                </button>
            </div>

            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-neutral" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar por nombre de rol..."
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
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Nombre del Rol</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-base-border">
                                {filteredRoles.map(role => (
                                    <tr key={role.id} className="hover:bg-base-300/50 even:bg-base-300/20 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-base-content break-words">{role.nombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={() => handleOpenModal(role)} className="text-primary hover:text-primary-focus p-1 rounded-full hover:bg-primary/10 transition"><EditIcon className="h-5 w-5"/></button>
                                            <button onClick={() => handleDelete(role.id)} className="text-error hover:text-error/80 p-1 rounded-full hover:bg-error/10 transition"><TrashIcon className="h-5 w-5"/></button>
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
                        <label htmlFor="roleName" className="block text-sm font-medium">Nombre del Rol</label>
                        <input
                            type="text"
                            id="roleName"
                            value={roleName}
                            onChange={e => setRoleName(e.target.value)}
                            className="mt-1 block w-full input-style"
                            required
                        />
                    </div>
                    <div className="flex justify-end pt-4 space-x-2">
                        <button type="button" onClick={handleCloseModal} className="bg-base-300 py-2 px-4 rounded-lg hover:bg-neutral/20 transition-colors">Cancelar</button>
                        <button type="submit" className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors">Guardar Rol</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default RoleManagement;
