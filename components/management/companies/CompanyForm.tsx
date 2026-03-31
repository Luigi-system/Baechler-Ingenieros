import React, { useState } from 'react';
import type { Company } from '../../../types';
import Spinner from '../../ui/Spinner';
import { useNotification } from '../../../contexts/NotificationContext';

interface CompanyFormProps {
    company: Company | null;
    // FIX: Updated onSave to accept an async function and return the saved company.
    onSave: (company: Company) => Promise<void> | void;
    onCancel: () => void;
}

const CompanyForm: React.FC<CompanyFormProps> = ({ company, onSave, onCancel }) => {
    const { addNotification } = useNotification();
    const [formData, setFormData] = useState<Partial<Company>>(company || {
        nombre: '',
        direccion: '',
        distrito: '',
        ruc: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nombre) return;

        setIsSaving(true);
        try {
            const url = company 
                ? `https://app.lr-system.com/bi/empresas/update/${company.id}`
                : 'https://app.lr-system.com/bi/empresas/create';
            
            const method = company ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: formData.nombre,
                    direccion: formData.direccion || '',
                    distrito: formData.distrito || '',
                    ruc: formData.ruc || ''
                })
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const data = await response.json();
            // The API might return the saved object directly or inside a 'data' field.
            const savedCompany = data.data || data;
            
            addNotification({ type: 'success', title: 'Éxito', message: 'Empresa guardada correctamente.' });
            await onSave(savedCompany as Company);
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Error', message: err.message || "Error al guardar la empresa" });
            console.error("Save company error:", err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="nombre" className="block text-sm font-medium">Nombre de la Empresa</label>
                <input type="text" name="nombre" id="nombre" value={formData.nombre || ''} onChange={handleChange} required className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
                <label htmlFor="ruc" className="block text-sm font-medium">RUC</label>
                <input type="text" name="ruc" id="ruc" value={formData.ruc || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
                <label htmlFor="direccion" className="block text-sm font-medium">Dirección</label>
                <input type="text" name="direccion" id="direccion" value={formData.direccion || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
                <label htmlFor="distrito" className="block text-sm font-medium">Distrito</label>
                <input type="text" name="distrito" id="distrito" value={formData.distrito || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving} className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-primary/50 flex items-center">
                    {isSaving && <Spinner />}
                    {isSaving ? 'Guardando...' : 'Guardar Empresa'}
                </button>
            </div>
        </form>
    );
};

export default CompanyForm;