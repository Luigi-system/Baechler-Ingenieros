
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// import type { User as SupabaseUser } from '@supabase/supabase-js'; // Removed SupabaseUser import
import Login from './components/auth/Login';
import Layout from './components/layout/Layout';
import { AuthContext } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Spinner from './components/ui/Spinner'; // Import Spinner
import type { User } from './types';
import ReportPreviewPage from './components/reports/ReportPreviewPage';

const AppContent: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true); // New state for authentication loading

    // fetchUserProfile is now called after a successful custom login or during initial check.
    // It takes the user data directly from the Usuarios table or the new API response.
    const fetchUserProfile = useCallback(async (userDataFromDb: any): Promise<User> => {
        // Basic user identifier
        const userIdentifier = userDataFromDb.email || userDataFromDb.usuario || 'Usuario';
        
            // Step 2: Set default permissions
            let permissions: string[] = ['dashboard', 'reports', 'management', 'settings']; 
            let roleName = userDataFromDb.rol_nombre || (userDataFromDb.rol === 1 ? 'Administrador' : 'Usuario');
            let roleId = userDataFromDb.rol;
            
        return {
            id: userDataFromDb.id?.toString() || Date.now().toString(),
            nombres: userDataFromDb.nombres || userIdentifier.split('@')[0],
            apellidos: userDataFromDb.apellidos || '',
            usuario: userIdentifier,
            email: userDataFromDb.email || (userIdentifier.includes('@') ? userIdentifier : undefined),
            rol: roleId || 0,
            roleName: roleName,
            permissions: permissions,
            dni: userDataFromDb.numero_doc || userDataFromDb.dni,
            celular: userDataFromDb.celular,
            cargo: userDataFromDb.cargo,
            foto: userDataFromDb.foto,
            nacimiento: userDataFromDb.nacimiento,
            color_palette_name: userDataFromDb.color_palette_name,
            pass: userDataFromDb.pass || userDataFromDb.password,
        };
    }, []);

    // Function to validate user still exists on the server
    const validateUserSession = useCallback(async (userToValidate: User): Promise<boolean | User> => {
        try {
            if (!userToValidate.id) return false;

            // Use the specific get endpoint as confirmed by user
            const response = await fetch(`https://app.lr-system.com/bi/usuarios/get/${userToValidate.id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                console.error("Error al validar sesión en el servidor:", response.status);
                return false;
            }

            const result = await response.json();
            const userRecord = result.data || (Array.isArray(result) ? result[0] : result);
            
            if (!userRecord) {
                console.warn("Usuario no encontrado en la base de datos.");
                return false;
            }

            // Return fresh user profile
            return await fetchUserProfile(userRecord);
        } catch (error) {
            console.error("Error validating user session:", error);
            return false;
        }
    }, [fetchUserProfile]);

    // Effect for initial session check on component mount
    useEffect(() => {
        const checkInitialAuthStatus = async () => {
            const savedUser = localStorage.getItem('auth_user');
            if (savedUser) {
                try {
                    const parsedUser = JSON.parse(savedUser);
                    // Set user immediately for a faster UI response
                    setUser(parsedUser);
                    console.log("Sesión persistente encontrada para:", parsedUser.usuario);
                    
                    // Validate in the background/concurrently
                    setIsLoadingAuth(false); // Stop loading early since we have local data

                    const validationResult = await validateUserSession(parsedUser);
                    if (validationResult === false) {
                        console.warn("Sesión de usuario ya no es válida en el servidor. Cerrando sesión...");
                        localStorage.removeItem('auth_user');
                        setUser(null);
                    } else if (typeof validationResult === 'object') {
                        // Update with fresh data if available
                        const freshUser = validationResult as User;
                        setUser(freshUser);
                        localStorage.setItem('auth_user', JSON.stringify(freshUser));
                    }
                } catch (error) {
                    console.error("Error parsing saved user session:", error);
                    localStorage.removeItem('auth_user');
                    setUser(null);
                    setIsLoadingAuth(false);
                }
            } else {
                setIsLoadingAuth(false);
            }
        };
        checkInitialAuthStatus();
    }, [validateUserSession]); // Check for saved session on mount

    // Removed the useEffect that handled Supabase authentication state changes (onAuthStateChange)
    // as we are implementing custom authentication.


    // Custom login function using external API endpoint
    const login = async (username: string, password: string, remember: boolean = false): Promise<void> => {
        try {
            const trimmedUsername = username.trim();
            const trimmedPassword = password.trim();

            const response = await fetch('https://app.lr-system.com/bi/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: trimmedUsername,
                    pass: trimmedPassword
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Credenciales de inicio de sesión inválidas.");
                }
                throw new Error(`Error en el servidor: ${response.statusText}`);
            }

            const result = await response.json();
            const userRecord = result.data || (Array.isArray(result) ? result[0] : result);

            if (!userRecord) {
                throw new Error("Credenciales de inicio de sesión inválidas.");
            }

            // Step 3: Fetch the full user profile
            const profile = await fetchUserProfile(userRecord);
            setUser(profile);
            
            // Only save session for persistence if "Remember Me" is checked
            if (remember) {
                localStorage.setItem('auth_user', JSON.stringify(profile));
            } else {
                localStorage.removeItem('auth_user'); // Ensure previous sessions are cleared
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Error de autenticación desconocido.";
            console.error("Error during custom login:", errorMessage);
            setUser(null);
            throw error;
        }
    };

    const logout = async () => {
        // For custom auth, simply clear local user state and remove persisted session
        setUser(null); 
        localStorage.removeItem('remembered_username');
        localStorage.removeItem('remembered_password');
        localStorage.removeItem('auth_user');
    };

    const updateUser = useCallback((updates: Partial<User>) => {
        setUser(currentUser => {
            if (!currentUser) return null;
            const updatedUser = { ...currentUser, ...updates };
            // Update persisted session
            localStorage.setItem('auth_user', JSON.stringify(updatedUser));
            return updatedUser;
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
            <Routes>
                <Route path="/preview/reporte-visita/:id" element={<ReportPreviewPage type="visit" />} />
                <Route path="/preview/reporte-servicio/:id" element={<ReportPreviewPage type="service" />} />
                <Route path="/*" element={user ? <Layout /> : <Login />} />
            </Routes>
          </div>
        </AuthContext.Provider>
    );
};


const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <NotificationProvider>
            <AppContent />
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;