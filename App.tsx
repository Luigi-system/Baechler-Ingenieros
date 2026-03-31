
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
        const userIdentifier = userDataFromDb.usuario || userDataFromDb.email || 'Usuario';
        
            // Step 2: Set default permissions
            let permissions: string[] = ['dashboard', 'reports', 'management', 'settings']; 
            let roleName = userDataFromDb.role?.nombre || 'Usuario';
            let roleId = userDataFromDb.rol;
            let themeSettings: { color_palette_name?: string } = {};
            
        return {
            id: userDataFromDb.id?.toString() || Date.now().toString(),
            nombres: userDataFromDb.nombres || userIdentifier.split('@')[0],
            usuario: userIdentifier,
            email: userDataFromDb.email || (userIdentifier.includes('@') ? userIdentifier : undefined),
            rol: roleId || 0,
            roleName: roleName,
            permissions: permissions,
            dni: userDataFromDb.dni,
            celular: userDataFromDb.celular,
            color_palette_name: themeSettings.color_palette_name || userDataFromDb.color_palette_name,
            pass: userDataFromDb.pass,
        };
    }, []);

    // Effect for initial session check on component mount
    useEffect(() => {
        const checkInitialAuthStatus = async () => {
            const savedUser = localStorage.getItem('auth_user');
            if (savedUser) {
                try {
                    const parsedUser = JSON.parse(savedUser);
                    setUser(parsedUser);
                } catch (error) {
                    console.error("Error parsing saved user session:", error);
                    localStorage.removeItem('auth_user');
                }
            }
            setIsLoadingAuth(false);
        };
        checkInitialAuthStatus();
    }, []); // Check for saved session on mount

    // Removed the useEffect that handled Supabase authentication state changes (onAuthStateChange)
    // as we are implementing custom authentication.


    // Custom login function using external API endpoint
    const login = async (username: string, password: string): Promise<void> => {
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

            const userData = await response.json();

            if (!userData || (Array.isArray(userData) && userData.length === 0)) {
                throw new Error("Credenciales de inicio de sesión inválidas.");
            }

            // The API might return an array or a single object.
            // Based on previous logic, we expect a user object or the first element of an array.
            const userRecord = Array.isArray(userData) ? userData[0] : userData;

            if (!userRecord) {
                throw new Error("Credenciales de inicio de sesión inválidas.");
            }

            // Step 3: Fetch the full user profile (roles, permissions, etc.)
            // Note: fetchUserProfile now uses the REST API.
            const profile = await fetchUserProfile(userRecord);
            setUser(profile);
            // Save session for persistence
            localStorage.setItem('auth_user', JSON.stringify(profile));

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