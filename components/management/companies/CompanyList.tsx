
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../../contexts/SupabaseContext';
import type { Company } from '../../../types';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon } from '../../ui/Icons';
import Spinner from '../../ui/Spinner';
import Modal from '../../ui/Modal';
import CompanyForm from './CompanyForm';

const CompanyList: React.FC = () => {
    const { supabase } = useSupabase();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCompanies = async () => {
        if (!supabase) {
            setError("Cliente Supabase no disponible. Por favor, configure la base de datos.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        const { data, error } = await supabase.from('Empresa').select('*').order('nombre');
        if (error) {
            setError(error.message);
        } else {
            setCompanies(data as Company[]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCompanies();
    }, [supabase]);
    
    const filteredCompanies = companies.filter(company =>
        (company.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.direccion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.distrito || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.ruc || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (company: Company) => {
        setEditingCompany(company);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingCompany(null);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCompany(null);
    }

    // FIX: Updated onSave to match the new signature of CompanyForm's onSave prop.
    const onSave = (_company: Company) => {
        fetchCompanies();
        handleCloseModal();
    }

    const handleDelete = async (id: number) => {
        if (!supabase || !window.confirm('¿Estás seguro de que quieres eliminar esta empresa? Esto podría afectar a las plantas asociadas.')) return;

        const { error } = await supabase.from('Empresa').delete().eq('id', id);
        if (error) {
            alert(error.message);
        } else {
            fetchCompanies();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Gestionar Empresas</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                       Añade, edita o elimina registros de empresas.
                    </p>
                </div>
                <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark">
                    <PlusIcon className="h-5 w-5" />
                    Añadir Empresa
                </button>
            </div>
            
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar empresa por nombre, dirección, distrito o RUC..."
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dirección</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Distrito</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">RUC</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredCompanies.map(company => (
                                <tr key={company.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white break-words">{company.nombre}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 break-words">{company.direccion || 'N/A'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 break-words">{company.distrito || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{company.ruc || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button onClick={() => handleEdit(company)} className="text-primary hover:text-primary-dark p-1 rounded-full hover:bg-primary/10 transition"><EditIcon className="h-5 w-5"/></button>
                                        <button onClick={() => handleDelete(company.id)} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-500/10 transition"><TrashIcon className="h-5 w-5"/></button>
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 </div>
            )}
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCompany ? 'Editar Empresa' : 'Añadir Nueva Empresa'}>
                <CompanyForm company={editingCompany} onSave={onSave} onCancel={handleCloseModal}/>
            </Modal>
        </div>
    );
};

export default CompanyList;