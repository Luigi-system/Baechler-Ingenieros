
import React, { useState, useEffect, useMemo } from 'react';
import type { User } from '../../types';
import { 
    PlusIcon, EditIcon, TrashIcon, SearchIcon, 
    UserIcon, MailIcon, PhoneIcon, ShieldIcon,
    BriefcaseIcon, CalendarIcon, KeyIcon, CameraIcon
} from '../ui/Icons';
import Spinner from '../ui/Spinner';
import Modal from '../ui/Modal';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('https://app.lr-system.com/bi/usuarios/getall');
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : (data.data || []));
        } catch (err: any) {
            setError(err.message || 'Error al conectar con la API');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    const filteredUsers = useMemo(() => {
        return users.filter(user => 
            (user.nombres || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.apellidos || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.cargo || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const handleOpenModal = (user: Partial<User> | null = null) => {
        setCurrentUser(user ? { ...user } : {
            nombres: '',
            apellidos: '',
            email: '',
            cargo: '',
            dni: '',
            celular: '',
            pass: '',
            foto: '',
            nacimiento: ''
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentUser(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        
        setIsSaving(true);
        const isUpdate = !!currentUser.id;
        const url = isUpdate 
            ? `https://app.lr-system.com/bi/usuarios/update/${currentUser.id}`
            : 'https://app.lr-system.com/bi/usuarios/create';
        
        const method = isUpdate ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentUser)
            });

            if (!res.ok) throw new Error('Error al guardar usuario');
            
            await fetchData();
            handleCloseModal();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string | number) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;
        
        try {
            const res = await fetch(`https://app.lr-system.com/bi/usuarios/delete/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Error al eliminar');
            await fetchData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!currentUser) return;
        const { name, value } = e.target;
        setCurrentUser({ ...currentUser, [name]: value });
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-base-200/50 p-4 rounded-2xl border border-base-border">
                <div className="flex-1 w-full relative">
                    <SearchIcon className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-neutral" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email, cargo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                    />
                </div>
                <button 
                    onClick={() => handleOpenModal()} 
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-focus transition-all shadow-lg shadow-primary/20 active:scale-95 whitespace-nowrap"
                >
                    <PlusIcon className="h-4 w-4" />
                    Nuevo Usuario
                </button>
            </div>

            {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                     <Spinner className="h-8 w-8 text-primary mb-2" />
                     <p className="text-sm text-neutral animate-pulse uppercase tracking-[0.2em] font-black">Sincronizando Usuarios...</p>
                </div>
            ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center text-error p-8 border border-error/20 rounded-2xl bg-error/5 border-dashed">
                    <ShieldIcon className="h-12 w-12 mb-4 opacity-50" />
                    <p className="font-bold text-center">{error}</p>
                    <button onClick={fetchData} className="mt-4 px-6 py-2 bg-error text-white rounded-xl font-bold text-xs uppercase transition-all hover:bg-error/80">Reintentar Conexión</button>
                </div>
            ) : (
                <div className="bg-base-200 border border-base-border shadow-sm rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0">
                    <div className="overflow-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-base-300 border-b border-base-border sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-neutral uppercase tracking-widest">Usuario</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-neutral uppercase tracking-widest">Cargo / Puesto</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-neutral uppercase tracking-widest">Contacto</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-neutral uppercase tracking-widest text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-base-border">
                                {filteredUsers.length > 0 ? filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-primary/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all overflow-hidden border border-primary/20">
                                                    {user.foto ? <img src={user.foto} className="h-full w-full object-cover" /> : <UserIcon className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-base-content">{user.nombres} {user.apellidos}</div>
                                                    <div className="text-[10px] text-neutral font-medium uppercase tracking-wider">ID: {user.dni || '---'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-base-300 rounded-lg text-[10px] font-bold text-neutral uppercase tracking-widest border border-base-border">
                                                {user.cargo || 'Funcionario'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-xs text-base-content font-medium">
                                                    <MailIcon className="h-3 w-3 text-primary opacity-70" /> {user.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-neutral">
                                                    <PhoneIcon className="h-3 w-3 text-primary opacity-70" /> {user.celular || '---'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                                            <button onClick={() => handleOpenModal(user)} className="inline-flex items-center justify-center h-9 w-9 text-neutral hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-transparent hover:border-primary/20"><EditIcon className="h-4 w-4"/></button>
                                            <button onClick={() => handleDelete(user.id)} className="inline-flex items-center justify-center h-9 w-9 text-neutral hover:text-error hover:bg-error/10 rounded-xl transition-all border border-transparent hover:border-error/20"><TrashIcon className="h-4 w-4"/></button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center opacity-30">
                                                <SearchIcon className="h-12 w-12 mb-2" />
                                                <p className="text-sm font-bold uppercase tracking-widest">No se encontraron usuarios</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentUser?.id ? 'Configuración de Perfil' : 'Registro de Nuevo Usuario'}>
                {currentUser && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-neutral uppercase ml-1 flex items-center gap-1.5">
                                    <UserIcon className="h-3 w-3" /> Nombres
                                </label>
                                <input type="text" name="nombres" value={currentUser.nombres || ''} onChange={handleFormChange} required className="w-full px-4 py-2.5 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium" placeholder="Nombres" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-neutral uppercase ml-1 flex items-center gap-1.5">
                                    <UserIcon className="h-3 w-3" /> Apellidos
                                </label>
                                <input type="text" name="apellidos" value={currentUser.apellidos || ''} onChange={handleFormChange} required className="w-full px-4 py-2.5 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium" placeholder="Apellidos" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-neutral uppercase ml-1 flex items-center gap-1.5">
                                    <MailIcon className="h-3 w-3" /> Email Institucional
                                </label>
                                <input type="email" name="email" value={currentUser.email || ''} onChange={handleFormChange} required className="w-full px-4 py-2.5 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium" placeholder="usuario@empresa.com" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-neutral uppercase ml-1 flex items-center gap-1.5">
                                    <KeyIcon className="h-3 w-3" /> Contraseña
                                </label>
                                <input type="password" name="pass" value={currentUser.pass || ''} onChange={handleFormChange} {...(!currentUser.id ? { required: true } : {})} className="w-full px-4 py-2.5 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium" placeholder="••••••••" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-neutral uppercase ml-1 flex items-center gap-1.5">
                                    <BriefcaseIcon className="h-3 w-3" /> Cargo / Puesto
                                </label>
                                <input type="text" name="cargo" value={currentUser.cargo || ''} onChange={handleFormChange} className="w-full px-4 py-2.5 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium" placeholder="Ej. Administrador" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-neutral uppercase ml-1 flex items-center gap-1.5">
                                    <ShieldIcon className="h-3 w-3" /> DNI
                                </label>
                                <input type="text" name="dni" value={currentUser.dni || ''} onChange={handleFormChange} className="w-full px-4 py-2.5 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium font-mono" placeholder="8 dígitos" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-neutral uppercase ml-1 flex items-center gap-1.5">
                                    <PhoneIcon className="h-3 w-3" /> Celular
                                </label>
                                <input type="text" name="celular" value={currentUser.celular || ''} onChange={handleFormChange} className="w-full px-4 py-2.5 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium" placeholder="Ej. 999 888 777" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-neutral uppercase ml-1 flex items-center gap-1.5">
                                    <CalendarIcon className="h-3 w-3" /> Fecha de Nacimiento
                                </label>
                                <input type="date" name="nacimiento" value={currentUser.nacimiento || ''} onChange={handleFormChange} className="w-full px-4 py-2.5 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium" />
                            </div>
                            <div className="space-y-1.5 col-span-full">
                                <label className="text-[11px] font-bold text-neutral uppercase ml-1 flex items-center gap-1.5">
                                    <CameraIcon className="h-3 w-3" /> URL de Fotografía (Base64 o Link)
                                </label>
                                <input type="text" name="foto" value={currentUser.foto || ''} onChange={handleFormChange} className="w-full px-4 py-2.5 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium" placeholder="https://..." />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-base-border">
                            <button type="button" onClick={handleCloseModal} className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-neutral hover:bg-base-300 rounded-xl transition-all">Cancelar</button>
                            <button 
                                type="submit" 
                                disabled={isSaving}
                                className="px-10 py-2.5 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-focus transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSaving && <Spinner className="h-3 w-3" />}
                                {isSaving ? 'Guardando...' : 'Confirmar Usuario'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default UserManagement;
