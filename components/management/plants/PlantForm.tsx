

import React, { useState, useEffect } from 'react';
import type { Plant, Company } from '../../../types';
import Spinner from '../../ui/Spinner';
import SearchableSelect from '../../ui/SearchableSelect';

interface PlantFormProps {
    plant: Plant | null;
    onSave: () => void;
    onCancel: () => void;
    defaultCompanyId?: number;
}

const PlantForm: React.FC<PlantFormProps> = ({ plant, onSave, onCancel, defaultCompanyId }) => {
    const [formData, setFormData] = useState<Partial<Plant>>(plant || {
        nombre: '',
        direccion: '',
        estado: true,
        id_empresa: defaultCompanyId,
    });
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

    useEffect(() => {
        const fetchCompanies = async () => {
            setIsLoadingCompanies(true);
            try {
                const response = await fetch('https://app.lr-system.com/bi/empresas/getall');
                if (!response.ok) throw new Error('Error al obtener empresas');
                const data = await response.json();
                const companiesList = Array.isArray(data) ? data : (data.data || []);
                setCompanies(companiesList as Company[]);
                
                if (!plant && formData.id_empresa === undefined && (defaultCompanyId !== undefined || companiesList.length > 0)) {
                    setFormData(prev => ({ ...prev, id_empresa: defaultCompanyId || companiesList[0]?.id }));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoadingCompanies(false);
            }
        };
        fetchCompanies();
    }, [plant, defaultCompanyId]);
    

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nombre || !formData.id_empresa) {
            alert("Por favor, proporciona un nombre para la planta y selecciona una empresa.");
            return;
        }

        setIsSaving(true);
        try {
            const selectedCompany = companies.find(c => c.id === Number(formData.id_empresa));
            
            const url = plant 
                ? `https://app.lr-system.com/bi/planta/update/${plant.id}`
                : 'https://app.lr-system.com/bi/planta/create';
            
            const method = plant ? 'PUT' : 'POST';
            
            const payload = {
                nombre: formData.nombre,
                direccion: formData.direccion,
                id_empresa: Number(formData.id_empresa),
                nombreempresa: selectedCompany?.nombre || formData.empresa_nombre || plant?.empresa_nombre || '',
                estado: !!formData.estado
            };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Error al guardar la planta');
            
            onSave();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingCompanies) return <div className="flex justify-center p-6"><Spinner /></div>

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-neutral uppercase tracking-wider mb-1">Empresa Responsable</label>
                <SearchableSelect
                    options={companies.map(c => ({ id: c.id, label: c.nombre }))}
                    value={formData.id_empresa}
                    onChange={(id, label) => setFormData(prev => ({ ...prev, id_empresa: Number(id), empresa_nombre: label }))}
                   placeholder="Escribe para buscar una empresa..."
                />
            </div>
            <div>
                <label htmlFor="nombre" className="block text-xs font-bold text-neutral uppercase tracking-wider mb-1">Nombre de la Sede / Planta</label>
                <input 
                    type="text" 
                    name="nombre" 
                    id="nombre" 
                    placeholder="Ej: Planta Sur, Sede Principal..."
                    value={formData.nombre || ''} 
                    onChange={handleChange} 
                    required 
                    className="mt-1 block w-full px-3 py-2 text-sm bg-base-200 border border-base-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                />
            </div>
            <div>
                <label htmlFor="direccion" className="block text-xs font-bold text-neutral uppercase tracking-wider mb-1">Dirección Completa</label>
                <input 
                    type="text" 
                    name="direccion" 
                    id="direccion" 
                    placeholder="Calle, número, ciudad..."
                    value={formData.direccion || ''} 
                    onChange={handleChange} 
                    className="mt-1 block w-full px-3 py-2 text-sm bg-base-200 border border-base-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                />
            </div>
             <div className="flex items-center gap-3 p-3 bg-base-300/30 rounded-lg border border-base-border border-dashed">
                <input 
                    type="checkbox" 
                    name="estado" 
                    id="estado" 
                    checked={formData.estado || false} 
                    onChange={handleChange} 
                    className="h-4 w-4 text-primary bg-base-200 border-base-border rounded focus:ring-primary" 
                />
                <label htmlFor="estado" className="text-sm font-medium text-base-content select-none">Estado Operativo (Activo)</label>
            </div>
            <div className="flex justify-end pt-4 space-x-3">
                <button 
                    type="button" 
                    onClick={onCancel} 
                    className="px-4 py-2 text-sm font-medium text-neutral hover:text-base-content hover:bg-base-300 rounded-lg transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    type="submit" 
                    disabled={isSaving} 
                    className="bg-primary text-white py-2 px-6 rounded-lg hover:bg-primary-focus transition-all disabled:opacity-50 flex items-center shadow-md active:scale-95 font-semibold"
                >
                    {isSaving && <Spinner className="h-4 w-4 mr-2" />}
                    {isSaving ? 'Guardando...' : plant ? 'Actualizar Planta' : 'Registrar Planta'}
                </button>
            </div>
        </form>
    );
};

export default PlantForm;