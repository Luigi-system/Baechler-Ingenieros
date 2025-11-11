
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';
import type { User, Role } from '../../types';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';
import Modal from '../ui/Modal';

const UserManagement: React.FC = () => {
    const { supabase } = useSupabase();
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsersAndRoles = async () => {
        if (!supabase) return;
        setIsLoading(true);
        setError(null);
        try {
            // Fetch roles and users in parallel
            const [rolesRes, usersRes] = await Promise.all([
                supabase.from('Roles').select('id, nombre'),
                supabase.from('Usuarios').select('*, role:Roles(nombre)')
            ]);
            
            if (rolesRes.error) throw rolesRes.error;
            setRoles(rolesRes.data as Role[]);

            if (usersRes.error) throw usersRes.error;
            const formattedUsers = usersRes.data.map((user: any) => ({
                ...user,
                roleName: user.role?.nombre || 'N/A'
            }));

            setUsers(formattedUsers as User[]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsersAndRoles();
    }, [supabase]);
    
    const filteredUsers = users.filter(user => 
        (user.nombres || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.roleName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (user: Partial<User> | null = null) => {
        setCurrentUser(user ? { ...user } : { nombres: '', email: '', rol: roles[0]?.id });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentUser(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase || !currentUser) return;
        
        const userData = {
            nombres: currentUser.nombres,
            email: currentUser.email,
            dni: currentUser.dni,
            celular: currentUser.celular,
            rol: currentUser.rol
        };

        if (currentUser.id) {
            // Update
            const { error } = await supabase.from('Usuarios').update(userData).eq('id', currentUser.id).select().single();
            if (error) {
                alert(error.message);
            } else {
                handleCloseModal();
                fetchUsersAndRoles();
            }
        } else {
            // Create
            alert("La creación de usuarios a través de este formulario no está completamente implementada por razones de seguridad.");
            return;
        }
    };

    const handleDelete = async (id: string) => {
        if (!supabase || !window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;
        
        // Deleting users should be handled carefully, often involving Supabase Auth functions.
        const { error } = await supabase.from('Usuarios').delete().eq('id', id);
        if (error) {
            alert(error.message);
        } else {
            fetchUsersAndRoles();
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!currentUser) return;
        const { name, value } = e.target;
        setCurrentUser({ ...currentUser, [name]: name === 'rol' ? parseInt(value) : value });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-bold text-base-content">Gestión de Usuarios</h3>
                    <p className="mt-1 text-sm text-neutral">
                        Añade, edita o elimina usuarios del sistema.
                    </p>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-focus">
                    <PlusIcon className="h-5 w-5" />
                    Añadir Usuario
                </button>
            </div>
            
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-neutral" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar por nombre, email o rol..."
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
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Rol</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-base-border">
                                {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-base-300/50 even:bg-base-300/20 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-base-content break-words">{user.nombres}</td>
                                    <td className="px-6 py-4 text-sm text-neutral break-words">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral">{user.roleName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button onClick={() => handleOpenModal(user)} className="text-primary hover:text-primary-focus p-1 rounded-full hover:bg-primary/10 transition"><EditIcon className="h-5 w-5"/></button>
                                        <button onClick={() => handleDelete(user.id)} className="text-error hover:text-error/80 p-1 rounded-full hover:bg-error/10 transition"><TrashIcon className="h-5 w-5"/></button>
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentUser?.id ? 'Editar Usuario' : 'Añadir Nuevo Usuario'}>
                {currentUser && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="nombres" className="block text-sm font-medium">Nombre Completo</label>
                            <input type="text" name="nombres" id="nombres" value={currentUser.nombres || ''} onChange={handleFormChange} required className="mt-1 block w-full input-style" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium">Email</label>
                            <input type="email" name="email" id="email" value={currentUser.email || ''} onChange={handleFormChange} required className="mt-1 block w-full input-style" />
                        </div>
                         <div>
                            <label htmlFor="rol" className="block text-sm font-medium">Rol</label>
                            <select name="rol" id="rol" value={currentUser.rol || ''} onChange={handleFormChange} required className="mt-1 block w-full input-style">
                                {roles.map(role => <option key={role.id} value={role.id}>{role.nombre}</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end pt-4 space-x-2">
                            <button type="button" onClick={handleCloseModal} className="bg-base-300 py-2 px-4 rounded-lg hover:bg-neutral/20 transition-colors">Cancelar</button>
                            <button type="submit" className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors">Guardar Usuario</button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default UserManagement;
