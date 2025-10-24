

import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useSupabase } from '../../contexts/SupabaseContext';
import { SaveIcon, LockIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';
import type { User } from '../../types';

const ProfileSettings: React.FC = () => {
    const auth = useContext(AuthContext);
    const { supabase } = useSupabase();

    if (!auth || !auth.user) {
        return <div>Cargando perfil...</div>;
    }
    
    const [formData, setFormData] = useState<Partial<User>>({
        nombres: auth.user.nombres || '',
        dni: auth.user.dni || undefined,
        celular: auth.user.celular || undefined,
    });
    
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    const [isSavingInfo, setIsSavingInfo] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [feedback, setFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);

    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };
    
    const handleInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase || !auth.user) return;

        setIsSavingInfo(true);
        setFeedback(null);

        const { data, error } = await supabase
            .from('Usuarios')
            .update({ 
                nombres: formData.nombres,
                dni: formData.dni ? Number(formData.dni) : null,
                celular: formData.celular ? Number(formData.celular) : null,
            })
            .eq('id', auth.user.id)
            .select()
            .single();

        if (error) {
            setFeedback({ type: 'error', message: `Error al actualizar: ${error.message}` });
        } else if (data) {
            auth.updateUser(data);
            setFeedback({ type: 'success', message: '¡Información actualizada con éxito!' });
        }
        setIsSavingInfo(false);
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setFeedback({ type: 'error', message: 'Las contraseñas no coinciden.' });
            return;
        }
        if (passwordData.newPassword.length < 6) {
             setFeedback({ type: 'error', message: 'La contraseña debe tener al menos 6 caracteres.' });
            return;
        }

        setIsSavingPassword(true);
        setFeedback(null);
        
        const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });

        if (error) {
            setFeedback({ type: 'error', message: `Error al cambiar contraseña: ${error.message}` });
        } else {
            setFeedback({ type: 'success', message: '¡Contraseña cambiada con éxito!' });
            setPasswordData({ newPassword: '', confirmPassword: '' });
        }
        setIsSavingPassword(false);
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold text-base-content">Mi Perfil</h2>
            
            {/* Personal Information Form */}
            <form onSubmit={handleInfoSubmit} className="bg-base-200 p-6 rounded-xl shadow-lg space-y-6 transition-all duration-300 hover:shadow-2xl">
                 <h3 className="text-xl font-semibold border-b border-base-border pb-2">Información Personal</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="nombres" className="block text-sm font-medium">Nombres</label>
                        <input type="text" name="nombres" value={formData.nombres} onChange={handleInfoChange} className="mt-1 block w-full input-style" required />
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium">Email</label>
                        <input type="email" name="email" value={auth.user.email} className="mt-1 block w-full input-style" disabled />
                    </div>
                     <div>
                        <label htmlFor="dni" className="block text-sm font-medium">DNI</label>
                        <input type="number" name="dni" value={formData.dni || ''} onChange={handleInfoChange} className="mt-1 block w-full input-style" />
                    </div>
                     <div>
                        <label htmlFor="celular" className="block text-sm font-medium">Celular</label>
                        <input type="number" name="celular" value={formData.celular || ''} onChange={handleInfoChange} className="mt-1 block w-full input-style" />
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={isSavingInfo} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-focus disabled:bg-primary/50">
                        {isSavingInfo ? <Spinner /> : <SaveIcon className="h-5 w-5" />}
                        {isSavingInfo ? 'Guardando...' : 'Guardar Información'}
                    </button>
                </div>
            </form>

            {/* Change Password Form */}
            <form onSubmit={handlePasswordSubmit} className="bg-base-200 p-6 rounded-xl shadow-lg space-y-6 transition-all duration-300 hover:shadow-2xl">
                <h3 className="text-xl font-semibold border-b border-base-border pb-2">Cambiar Contraseña</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="newPassword">Nueva Contraseña</label>
                        <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} className="mt-1 block w-full input-style" required />
                    </div>
                     <div>
                        <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                        <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} className="mt-1 block w-full input-style" required />
                    </div>
                 </div>
                 <div className="flex justify-end pt-4">
                    <button type="submit" disabled={isSavingPassword} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-focus disabled:bg-primary/50">
                        {isSavingPassword ? <Spinner /> : <LockIcon className="h-5 w-5" />}
                        {isSavingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
                    </button>
                </div>
            </form>

             {feedback && (
                <div className={`p-4 rounded-md text-sm ${feedback.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                {feedback.message}
                </div>
            )}
        </div>
    );
};

export default ProfileSettings;
