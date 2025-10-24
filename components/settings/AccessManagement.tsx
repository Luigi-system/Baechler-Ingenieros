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
    if (error) return <p className="text-red-500 text-center">{error}</p>;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Gestión de Accesos</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Asigna permisos a los roles para controlar el acceso a los módulos del menú.
                </p>
            </div>
            
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar por nombre de rol..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                />
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
                <div className="overflow-y-auto">
                    <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rol</th>
                                {ALL_PERMISSIONS_CONFIG.map(p => (
                                    <th key={p.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{p.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredRoles.map(role => (
                                <tr key={role.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{role.nombre}</td>
                                    {ALL_PERMISSIONS_CONFIG.map(perm => {
                                        const isChecked = permissions.get(generateKey(role.id, perm.id)) || false;
                                        return (
                                            <td key={perm.id} className="px-6 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="h-5 w-5 rounded text-primary focus:ring-primary border-gray-300 dark:border-gray-600 dark:bg-gray-900"
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