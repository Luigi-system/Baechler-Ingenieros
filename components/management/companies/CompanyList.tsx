import React, { useState, useEffect } from 'react';
import type { Company } from '../../../types';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, ViewIcon, BuildingIcon, ClockIcon, MapPinIcon, HashIcon } from '../../ui/Icons';
import Spinner from '../../ui/Spinner';
import Modal from '../../ui/Modal';
import { useNotification } from '../../../contexts/NotificationContext';
import CompanyForm from './CompanyForm';

const CompanyList: React.FC = () => {
    const { addNotification, confirm } = useNotification();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCompanies = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('https://app.lr-system.com/bi/empresas/getall');
            const data = await response.json();
            const companiesList = Array.isArray(data) ? data : (data.data || []);
            setCompanies(companiesList);
        } catch (err: any) {
            setError(err.message || "Error al cargar las empresas");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);
    
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

    const handleView = (company: Company) => {
        setViewingCompany(company);
        setIsViewModalOpen(true);
    };

    const handleAdd = () => {
        setEditingCompany(null);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCompany(null);
    }

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setViewingCompany(null);
    }

    const onSave = (_company: Company) => {
        fetchCompanies();
        handleCloseModal();
    }

    const handleDelete = async (id: number) => {
        confirm({
            title: '¿Eliminar empresa?',
            message: '¿Estás seguro de que quieres eliminar esta empresa? Todos los datos asociados se perderán.',
            onConfirm: async () => {
                try {
                    const response = await fetch(`https://app.lr-system.com/bi/empresas/delete/${id}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error('Error al eliminar');
                    addNotification({ type: 'success', title: 'Empresa Eliminada', message: 'La empresa ha sido eliminada correctamente.' });
                    fetchCompanies();
                } catch (err: any) {
                    addNotification({ type: 'error', title: 'Error', message: err.message });
                }
            }
        });
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center bg-base-200/50 p-4 rounded-2xl border border-base-border">
                <div className="relative flex-1">
                    <SearchIcon className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-neutral" />
                    <input
                        type="text"
                        placeholder="Buscar empresa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-base-100 border border-base-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                    />
                </div>
                <button 
                    onClick={handleAdd} 
                    className="flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 text-sm font-black text-white bg-primary rounded-xl hover:bg-primary-focus transition-all shadow-lg active:scale-95 uppercase tracking-widest"
                >
                    <PlusIcon className="h-4 w-4" />
                    <span>Añadir Empresa</span>
                </button>
            </div>

             {isLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                      <Spinner className="h-10 w-10 text-primary mb-2" />
                      <p className="text-[10px] text-neutral font-black uppercase tracking-widest animate-pulse">Sincronizando Empresas...</p>
                  </div>
             ) : error ? (
                  <p className="text-error text-center py-10 font-bold">{error}</p>
             ) : (
                  <div className="bg-base-200 border border-base-border shadow-sm rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0">
                    <div className="overflow-auto flex-1 custom-scrollbar">
                        {/* Desktop View */}
                        <table className="hidden lg:table w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-base-300 border-b border-base-border sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-neutral uppercase tracking-widest">Nombre</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-neutral uppercase tracking-widest">Dirección</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-neutral uppercase tracking-widest">Distrito / RUC</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-neutral uppercase tracking-widest text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-base-border">
                                {filteredCompanies.map(company => (
                                <tr key={company.id} className="hover:bg-primary/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center mr-3 text-primary shrink-0 border border-primary/10">
                                                <BuildingIcon className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-black text-base-content leading-tight group-hover:text-primary transition-colors">{company.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-medium text-neutral max-w-[250px] truncate">{company.direccion || '---'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-base-content uppercase">{company.distrito || '---'}</span>
                                            <span className="text-[9px] font-mono text-neutral opacity-70">RUC: {company.ruc || '---'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                                        <button onClick={() => handleView(company)} className="h-8 w-8 inline-flex items-center justify-center text-neutral hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Ver"><ViewIcon className="h-4 w-4"/></button>
                                        <button onClick={() => handleEdit(company)} className="h-8 w-8 inline-flex items-center justify-center text-neutral hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Editar"><EditIcon className="h-4 w-4"/></button>
                                        <button onClick={() => handleDelete(company.id)} className="h-8 w-8 inline-flex items-center justify-center text-neutral hover:text-error hover:bg-error/10 rounded-lg transition-all" title="Eliminar"><TrashIcon className="h-4 w-4"/></button>
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Mobile View */}
                        <div className="lg:hidden divide-y divide-base-border">
                            {filteredCompanies.map(company => (
                                <div key={company.id} className="p-4 space-y-4 hover:bg-primary/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                                            <BuildingIcon className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-base font-black text-base-content leading-tight truncate">{company.nombre}</span>
                                            <span className="text-[10px] text-neutral font-bold flex items-center gap-1 uppercase">
                                                <MapPinIcon className="h-3 w-3 opacity-50" />
                                                {company.distrito || 'Sin Distrito'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-base-300/30 rounded-xl space-y-2">
                                        <div className="flex justify-between text-[10px]">
                                            <span className="font-bold uppercase tracking-tight text-neutral">RUC:</span>
                                            <span className="font-mono font-black">{company.ruc || 'S/N'}</span>
                                        </div>
                                        <div className="flex flex-col text-[10px]">
                                            <span className="font-bold uppercase tracking-tight text-neutral">Dirección:</span>
                                            <span className="font-medium mt-0.5 leading-relaxed">{company.direccion || 'No registrada'}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleView(company)} className="flex-1 py-2 bg-base-300/50 rounded-xl text-neutral flex items-center justify-center gap-2 text-[10px] font-black uppercase"><ViewIcon className="h-4 w-4"/> Ver</button>
                                        <button onClick={() => handleEdit(company)} className="flex-1 py-2 bg-primary/10 rounded-xl text-primary flex items-center justify-center gap-2 text-[10px] font-black uppercase"><EditIcon className="h-4 w-4"/> Editar</button>
                                        <button onClick={() => handleDelete(company.id)} className="flex-1 py-2 bg-error/10 rounded-xl text-error flex items-center justify-center gap-2 text-[10px] font-black uppercase"><TrashIcon className="h-4 w-4"/> Borrar</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 bg-base-300/30 border-t border-base-border text-[10px] text-neutral font-black uppercase tracking-widest flex justify-between items-center">
                        <span>Total: {filteredCompanies.length}</span>
                        <span className="opacity-40">Empresas BI</span>
                    </div>
                  </div>
             )}
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCompany ? 'Editar Empresa' : 'Añadir Nueva Empresa'}>
                <CompanyForm company={editingCompany} onSave={onSave} onCancel={handleCloseModal}/>
            </Modal>
            <Modal isOpen={isViewModalOpen} onClose={handleCloseViewModal} title="Detalles de la Empresa">
                {viewingCompany && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 pb-6 border-b border-base-border">
                            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/10"><BuildingIcon className="h-8 w-8" /></div>
                            <div>
                                <h4 className="text-xl font-black text-base-content leading-tight uppercase">{viewingCompany.nombre}</h4>
                                <p className="text-xs text-neutral font-bold mt-1 uppercase tracking-widest opacity-60">ID: #{viewingCompany.id}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-base-200/50 rounded-2xl border border-base-border">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">RUC</span>
                                <span className="text-sm font-mono font-black">{viewingCompany.ruc || '---'}</span>
                            </div>
                            <div className="p-4 bg-base-200/50 rounded-2xl border border-base-border">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Sede / Distrito</span>
                                <span className="text-sm font-black uppercase">{viewingCompany.distrito || '---'}</span>
                            </div>
                            <div className="p-4 bg-base-200/50 rounded-2xl border border-base-border md:col-span-2">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Dirección Principal</span>
                                <span className="text-sm font-medium leading-relaxed">{viewingCompany.direccion || 'No registrada'}</span>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4"><button onClick={handleCloseViewModal} className="w-full sm:w-auto px-10 py-3 bg-primary text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95">Cerrar</button></div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CompanyList;
