
import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';
import type { Role } from '../../types';
import Spinner from '../ui/Spinner';
import { ALL_PERMISSIONS_CONFIG } from '../../constants/permissions';
import { SearchIcon } from '../ui/Icons';

interface RolePermission {
    role_id: number;
    permission_name: string;
}

const AccessManagement: React.FC = () => {
    const { supabase } = useSupabase();
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Map<string, boolean>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const generateKey = (roleId: number, permissionName: string) => `${roleId}-${permissionName}`;

    const fetchData = useCallback(async () => {
        if (!supabase) {
            setError("Cliente Supabase no disponible.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const [rolesRes, permissionsRes] = await Promise.all([
                supabase.from('Roles').select('*'),
                supabase.from('role_permissions').select('*')
            ]);

            if (rolesRes.error) throw rolesRes.error;
            if (permissionsRes.error) throw permissionsRes.error;

            setRoles(rolesRes.data as Role[]);
            
            const permsMap = new Map<string, boolean>();
            (permissionsRes.data as RolePermission[]).forEach(p => {
                permsMap.set(generateKey(p.role_id, p.permission_name), true);
            });
            setPermissions(permsMap);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const filteredRoles = roles.filter(role => 
        (role.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const handlePermissionChange = async (roleId: number, permissionName: string, isChecked: boolean) => {
        if (!supabase) return;

        const key = generateKey(roleId, permissionName);
        
        // Optimistic UI update
        const newPermissions = new Map(permissions);
        newPermissions.set(key, isChecked);
        setPermissions(newPermissions);

        try {
            if (isChecked) {
                // Add permission
                const { error } = await supabase.from('role_permissions').insert([{ role_id: roleId, permission_name: permissionName }]);
                if (error) throw error;
            } else {
                // Remove permission
                const { error } = await supabase.from('role_permissions').delete().match({ role_id: roleId, permission_name: permissionName });
                if (error) throw error;
            }
        } catch (err: any) {
            // Revert UI on error
            alert(`Error al actualizar permisos: ${err.message}`);
            const revertedPermissions = new Map(permissions);
            revertedPermissions.set(key, !isChecked);
            setPermissions(revertedPermissions);
        }
    };

    if (isLoading) return <div className="flex justify-center p-8"><Spinner /></div>;
    if (error) return <p className="text-error text-center">{error}</p>;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-base-content">Gestión de Accesos</h3>
                <p className="mt-1 text-sm text-neutral">
                    Asigna permisos a los roles para controlar el acceso a los módulos del menú.
                </p>
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

            <div className="bg-base-200 shadow-lg rounded-xl overflow-hidden">
                <div className="overflow-y-auto custom-scrollbar">
                    <table className="w-full table-auto">
                        <thead className="bg-base-300">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral uppercase tracking-wider">Rol</th>
                                {ALL_PERMISSIONS_CONFIG.map(p => (
                                    <th key={p.id} className="px-6 py-3 text-center text-xs font-semibold text-neutral uppercase tracking-wider">{p.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-base-border">
                            {filteredRoles.map(role => (
                                <tr key={role.id} className="hover:bg-base-300/50 even:bg-base-300/20 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-base-content">{role.nombre}</td>
                                    {ALL_PERMISSIONS_CONFIG.map(perm => {
                                        const isChecked = permissions.get(generateKey(role.id, perm.id)) || false;
                                        return (
                                            <td key={perm.id} className="px-6 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="h-5 w-5 rounded text-primary focus:ring-primary border-base-border bg-base-100"
                                                    checked={isChecked}
                                                    onChange={(e) => handlePermissionChange(role.id, perm.id, e.target.checked)}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AccessManagement;
