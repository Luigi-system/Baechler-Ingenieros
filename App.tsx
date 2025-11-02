
import React, { useState, useMemo, useCallback, useEffect } from 'react';
// import type { User as SupabaseUser } from '@supabase/supabase-js'; // Removed SupabaseUser import
import Login from './components/auth/Login';
import Layout from './components/layout/Layout';
import { AuthContext } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SupabaseProvider, useSupabase } from './contexts/SupabaseContext';
import { AiServiceProvider } from './contexts/AiServiceContext';
import { ChatProvider } from './contexts/ChatContext';
import Spinner from './components/ui/Spinner'; // Import Spinner
import type { User } from './types';

const AppContent: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true); // New state for authentication loading
    const { supabase } = useSupabase();

    // fetchUserProfile is now called after a successful custom login or during initial check.
    // It takes the user data directly from the Usuarios table.
    const fetchUserProfile = useCallback(async (userDataFromDb: any): Promise<User> => {
        if (!supabase || !userDataFromDb.usuario) { // Changed to userDataFromDb.usuario
            throw new Error("Supabase client or user usuario not available from DB.");
        }
        try {
            // Step 1: User data already fetched from 'Usuarios' table for login validation
            // Now enrich with roles and permissions

            // Step 2: Fetch permissions (existing logic)
            let permissions: string[] = [];
            const roleName = userDataFromDb.role?.nombre || 'Usuario';
            const roleId = userDataFromDb.rol;

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
                .eq('id_usuario', userDataFromDb.id)
                .eq('key', 'user_theme_settings') // Use the new user-specific key
                .maybeSingle(); 

            let themeSettings: { color_palette_name?: string } = {};
            if (configError) {
                console.warn(`Could not fetch theme settings for user ${userDataFromDb.id}: ${configError.message}. Using defaults.`);
            } else if (configData && configData.value) {
                try {
                    // The value is stored as a JSON string, so it needs to be parsed.
                    themeSettings = JSON.parse(configData.value);
                } catch(e) {
                     console.error("Failed to parse theme settings JSON:", e);
                }
            }
            
            // Step 4: Combine all data into the final User object
            return {
                id: userDataFromDb.id,
                nombres: userDataFromDb.nombres,
                usuario: userDataFromDb.usuario, // Changed from email
                email: userDataFromDb.email, // Keep email if it exists in DB for other purposes
                rol: userDataFromDb.rol,
                roleName: roleName,
                permissions: permissions,
                dni: userDataFromDb.dni,
                celular: userDataFromDb.celular,
                color_palette_name: themeSettings.color_palette_name,
                pass: userDataFromDb.pass, // Changed from password
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`An unexpected error occurred fetching profile: ${errorMessage}. A temporary profile will be used.`);
        }
        
        // Fallback user profile - this part should ideally not be reached if login was successful
        return {
            id: userDataFromDb.id, // Use ID from fetched data
            nombres: userDataFromDb.usuario?.split('@')[0] || 'Usuario sin nombre', // Changed from email
            usuario: userDataFromDb.usuario || '', // Changed from email
            rol: 0, // Default role ID, consider a 'guest' role if needed
            roleName: 'Usuario',
            permissions: ['dashboard']
        };
    }, [supabase]);

    // Effect for initial session check on component mount (simplified, no Supabase Auth session check)
    useEffect(() => {
        const checkInitialAuthStatus = async () => {
            setIsLoadingAuth(false); // Directly set to false, as there's no session to fetch.
                                    // The Login component will handle pre-filling username from localStorage.
        };
        checkInitialAuthStatus();
    }, []); // Removed supabase and fetchUserProfile from dependencies, as there is no session to fetch automatically

    // Removed the useEffect that handled Supabase authentication state changes (onAuthStateChange)
    // as we are implementing custom authentication.


    // Custom login function
    const login = async (username: string, password: string): Promise<void> => { // Changed email to username
        if (!supabase) throw new Error("Cliente Supabase no inicializado.");
        
        try {
            const trimmedUsername = username.trim();
            const trimmedPassword = password.trim();

            // Step 1: Query the 'Usuarios' table directly for the user
            const { data: userData, error: userError } = await supabase
                .from('Usuarios')
                .select('*, role:Roles(nombre)') // Select all columns, including joined role name
                .eq('usuario', trimmedUsername) // Changed from 'email' to 'usuario'
                .single();

            if (userError || !userData) {
                // Log detailed error for debugging if needed, but return generic message to user
                console.error("Login query failed:", userError?.message || "No user data found.");
                throw new Error("Credenciales de inicio de sesión inválidas.");
            }

            // Step 2: Compare the provided password with the password stored in the database
            // WARNING: This assumes a plaintext password column in your 'Usuarios' table.
            // For production, passwords should ALWAYS be hashed (e.g., bcrypt) and compared securely.
            // Current schema has 'pass' as BIGINT, so we attempt to parse the input password to a number.
            console.warn("WARNING: Comparing plaintext numeric passwords directly is highly insecure. Please use hashed passwords for production.");
            const numericPassword = parseInt(trimmedPassword, 10);
            if (isNaN(numericPassword) || userData.pass !== numericPassword) {
                throw new Error("Credenciales de inicio de sesión inválidas.");
            }

            // Step 3: If passwords match, fetch the full user profile
            const profile = await fetchUserProfile(userData);
            setUser(profile);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Error de autenticación desconocido.";
            console.error("Error during custom login:", errorMessage);
            setUser(null);
            throw error; // Re-throw to be caught by the Login component
        }
    };

    const logout = async () => {
        if (!supabase) return;
        // For custom auth, simply clear local user state. No backend signOut needed.
        setUser(null); 
        // Optionally, clear remembered username if it's considered part of "session" management for this custom flow
        localStorage.removeItem('remembered_username'); // Changed from 'remembered_email'
    };

    const updateUser = useCallback((updates: Partial<User>) => {
        setUser(currentUser => {
            if (!currentUser) return null;
            return { ...currentUser, ...updates };
        });
    }, []);
    
    const authContextValue = useMemo(() => ({ user, login, logout, updateUser }), [user, updateUser]);

    if (isLoadingAuth) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-base-100">
                <Spinner />
                <span className="ml-2 text-base-content">Cargando sesión...</span>
            </div>
        );
    }

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
            <AppContent />
          </ChatProvider>
        </ThemeProvider>
      </AiServiceProvider>
    </SupabaseProvider>
  );
};

export default App;
