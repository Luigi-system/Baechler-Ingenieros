

import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { SaveIcon, LockIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';
import type { User } from '../../types';

const ProfileSettings: React.FC = () => {
    const auth = useContext(AuthContext);

    if (!auth || !auth.user) {
        return <div>Cargando perfil...</div>;
    }
    
    const [formData, setFormData] = useState<Partial<User>>({
        nombres: auth.user.nombres || '',
        apellidos: auth.user.apellidos || '',
        dni: auth.user.dni || '',
        celular: auth.user.celular || '',
    });
    
    // Sync local form state if user data is updated in background (e.g. from App.tsx validation)
    React.useEffect(() => {
        if (auth.user) {
            setFormData({
                nombres: auth.user.nombres || '',
                apellidos: auth.user.apellidos || '',
                dni: auth.user.dni || '',
                celular: auth.user.celular || '',
            });
        }
    }, [auth.user]);

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
        if (!auth.user) return;

        setIsSavingInfo(true);
        setFeedback(null);

        try {
            const response = await fetch(`https://app.lr-system.com/bi/usuarios/update/${auth.user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombres: formData.nombres,
                    apellidos: formData.apellidos,
                    numero_doc: formData.dni, // Map back to API field name
                    celular: formData.celular
                })
            });

            if (!response.ok) throw new Error('Error al actualizar la información');

            // Update global context state
            auth.updateUser({ 
                nombres: formData.nombres,
                apellidos: formData.apellidos,
                dni: formData.dni,
                celular: formData.celular,
            });
            
            setFeedback({ type: 'success', message: '¡Información actualizada correctamente!' });
        } catch (error: any) {
            setFeedback({ type: 'error', message: error.message || 'Error al guardar la información' });
        } finally {
            setIsSavingInfo(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
        
        try {
            const response = await fetch(`https://app.lr-system.com/bi/usuarios/update/${auth.user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pass: passwordData.newPassword
                })
            });

            if (!response.ok) throw new Error('Error al actualizar la contraseña');

            setFeedback({ type: 'success', message: '¡Contraseña actualizada correctamente!' });
            setPasswordData({ newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            setFeedback({ type: 'error', message: error.message || 'Error al cambiar la contraseña' });
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black text-base-content uppercase tracking-widest border-l-4 border-primary pl-4">Mi Perfil</h2>
            
            {/* Personal Information Form */}
            <form onSubmit={handleInfoSubmit} className="bg-base-200/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl border border-base-border space-y-8 transition-all duration-300 hover:bg-base-200">
                 <div className="flex items-center gap-3 border-b border-base-border pb-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <SaveIcon className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold uppercase tracking-wider">Información Personal</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-1.5">
                        <label htmlFor="nombres" className="text-[10px] font-black uppercase tracking-widest text-neutral ml-1">Nombres</label>
                        <input type="text" name="nombres" value={formData.nombres} onChange={handleInfoChange} className="w-full px-4 py-3 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium" required />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="apellidos" className="text-[10px] font-black uppercase tracking-widest text-neutral ml-1">Apellidos</label>
                        <input type="text" name="apellidos" value={formData.apellidos} onChange={handleInfoChange} className="w-full px-4 py-3 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium" />
                    </div>
                     <div className="space-y-1.5">
                        <label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-neutral ml-1">Email / Usuario</label>
                        <input type="text" name="email" value={auth.user.email} className="w-full px-4 py-3 bg-base-300 border border-base-border rounded-xl text-sm font-medium opacity-70 cursor-not-allowed" disabled />
                    </div>
                     <div className="space-y-1.5">
                        <label htmlFor="dni" className="text-[10px] font-black uppercase tracking-widest text-neutral ml-1">DNI / Documento</label>
                        <input type="text" name="dni" value={formData.dni || ''} onChange={handleInfoChange} className="w-full px-4 py-3 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-mono font-bold" />
                    </div>
                     <div className="space-y-1.5">
                        <label htmlFor="celular" className="text-[10px] font-black uppercase tracking-widest text-neutral ml-1">Celular</label>
                        <input type="text" name="celular" value={formData.celular || ''} onChange={handleInfoChange} className="w-full px-4 py-3 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium" />
                    </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-base-border">
                    <button type="submit" disabled={isSavingInfo} className="flex items-center justify-center gap-2 px-8 py-3 text-xs font-black uppercase tracking-widest text-white bg-primary rounded-xl hover:bg-primary-focus transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50">
                        {isSavingInfo ? <Spinner className="h-4 w-4" /> : <SaveIcon className="h-4 w-4" />}
                        {isSavingInfo ? 'Guardando...' : 'Guardar Información'}
                    </button>
                </div>
            </form>

            {/* Change Password Form */}
            <form onSubmit={handlePasswordSubmit} className="bg-base-200/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl border border-base-border space-y-8 transition-all duration-300 hover:bg-base-200">
                <div className="flex items-center gap-3 border-b border-base-border pb-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <LockIcon className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold uppercase tracking-wider">Cambiar Contraseña</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-1.5">
                        <label htmlFor="newPassword text-[10px] font-black uppercase tracking-widest text-neutral ml-1">Nueva Contraseña</label>
                        <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} className="w-full px-4 py-3 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium" required />
                    </div>
                     <div className="space-y-1.5">
                        <label htmlFor="confirmPassword text-[10px] font-black uppercase tracking-widest text-neutral ml-1">Confirmar Contraseña</label>
                        <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} className="w-full px-4 py-3 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium" required />
                    </div>
                 </div>
                 <div className="flex justify-end pt-4 border-t border-base-border">
                    <button type="submit" disabled={isSavingPassword} className="flex items-center justify-center gap-2 px-8 py-3 text-xs font-black uppercase tracking-widest text-white bg-primary rounded-xl hover:bg-primary-focus transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50">
                        {isSavingPassword ? <Spinner className="h-4 w-4" /> : <LockIcon className="h-4 w-4" />}
                        {isSavingPassword ? 'Actualizando...' : 'Cambiar Contraseña'}
                    </button>
                </div>
            </form>

             {feedback && (
                <div className={`p-4 rounded-xl text-xs font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-2 duration-300 ${feedback.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'}`}>
                    <div className="flex items-center gap-2">
                        {feedback.type === 'success' ? <SaveIcon className="h-4 w-4" /> : <LockIcon className="h-4 w-4" />}
                        {feedback.message}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileSettings;
