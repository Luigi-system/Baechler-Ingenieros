

import React, { useState, useMemo, useCallback } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import Login from './components/auth/Login';
import Layout from './components/layout/Layout';
import { AuthContext } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SupabaseProvider, useSupabase } from './contexts/SupabaseContext';
import { AiServiceProvider } from './contexts/AiServiceContext';
import { ChatProvider } from './contexts/ChatContext';
import { GoogleAuthContext, GoogleAuthProvider } from './contexts/GoogleAuthContext'; // Import new context and provider
import type { User } from './types';

const AppContent: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const { supabase } = useSupabase();

    const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User> => {
        if (!supabase || !supabaseUser.email) {
            throw new Error("Supabase client or user email not available.");
        }
        try {
            // Step 1: Fetch core user data from 'Usuarios'
            const { data: userData, error: userError } = await supabase
                .from('Usuarios')
                .select('id, nombres, email, rol, role:Roles(nombre)')
                .eq('email', supabaseUser.email)
                .single();

            if (userError) throw new Error(`Error fetching user profile: ${userError.message}`);
            
            if (userData) {
                // Step 2: Fetch permissions (existing logic)
                let permissions: string[] = [];
                const roleName = (userData.role as any)?.nombre || 'Usuario';
                const roleId = userData.rol;

                const { data: permissionsData, error: permissionsError } = await supabase
                    .from('role_permissions')
                    .select('permission_name')
                    .eq('role_id', roleId);
                
                if (permissionsError) {
                    console.error(`Could not fetch permissions for role ${roleId}:`, permissionsError.message);
                    permissions = ['dashboard'];
                } else {
                    permissions = permissionsData.map(p => p.permission_name);
                    if (permissions.length === 0) {
                        permissions.push('dashboard');
                    }
                }
                
                // Step 3: Fetch user-specific theme settings from 'Configuracion'
                const { data: configData, error: configError } = await supabase
                    .from('Configuracion')
                    .select('value')
                    .eq('id_usuario', userData.id)
                    .eq('key', 'user_theme_settings') // Use the new user-specific key
                    .maybeSingle(); 

                let themeSettings: { color_palette_name?: string } = {};
                if (configError) {
                    console.warn(`Could not fetch theme settings for user ${userData.id}: ${configError.message}. Using defaults.`);
                } else if (configData && configData.value) {
                    try {
                        // The value is stored as a JSON string, so it needs to be parsed.
                        themeSettings = JSON.parse(configData.value);
                    } catch(e) {
                         console.error("Failed to parse theme settings JSON:", e);
                    }
                }
                
                // Step 4: Combine all data into the final User object
                // App title and logo are no longer part of the user profile; they are loaded globally.
                return {
                    id: userData.id,
                    nombres: userData.nombres,
                    email: userData.email,
                    rol: userData.rol,
                    roleName: roleName,
                    permissions: permissions,
                    color_palette_name: themeSettings.color_palette_name,
                };
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`An unexpected error occurred fetching profile: ${errorMessage}. A temporary profile will be used.`);
        }
        
        // Fallback user profile
        return {
            id: supabaseUser.id,
            nombres: supabaseUser.email?.split('@')[0] || 'Usuario sin nombre',
            email: supabaseUser.email || '',
            rol: 0,
            roleName: 'Usuario',
            permissions: ['dashboard']
        };
    };

    const login = async (email: string, password: string): Promise<void> => {
        if (!supabase) throw new Error("Cliente Supabase no inicializado.");
        
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

        if (data.user) {
            const profile = await fetchUserProfile(data.user);
            setUser(profile);
        } else {
            throw new Error("No se pudo obtener la información del usuario después del inicio de sesión.");
        }
    };

    const logout = async () => {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) console.error("Error al cerrar sesión:", error);
        setUser(null);
    };

    const updateUser = useCallback((updates: Partial<User>) => {
        setUser(currentUser => {
            if (!currentUser) return null;
            return { ...currentUser, ...updates };
        });
    }, []);
    
    const authContextValue = useMemo(() => ({ user, login, logout, updateUser }), [user, updateUser]);

    return (
        <AuthContext.Provider value={authContextValue}>
          <div className="bg-base-100 text-base-content min-h-screen">
            {user ? <Layout /> : <Login />}
          </div>
        </AuthContext.Provider>
    );
};


const App: React.FC = () => {
  return (
    <SupabaseProvider>
      <AiServiceProvider>
        <ThemeProvider>
          <ChatProvider>
            <GoogleAuthProvider> {/* Wrap AppContent with GoogleAuthProvider */}
              <AppContent />
            </GoogleAuthProvider>
          </ChatProvider>
        </ThemeProvider>
      </AiServiceProvider>
    </SupabaseProvider>
  );
};

export default App;