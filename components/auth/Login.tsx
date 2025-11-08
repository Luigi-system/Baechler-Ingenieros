
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
// FIX: Replaced EmailIcon with MailIcon as it is the correct export from ../ui/Icons.
import { MailIcon, LockIcon, LoginIcon, AlertTriangleIcon } from '../ui/Icons';
import { useTheme } from '../../contexts/ThemeContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState(''); // Changed email to username
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false); // New state for "Remember Me"
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useContext(AuthContext);
  const { logoUrl } = useTheme();

  // Load remembered username and password from localStorage on component mount
  useEffect(() => {
    const rememberedUsername = localStorage.getItem('remembered_username');
    const rememberedPassword = localStorage.getItem('remembered_password'); // New: Load remembered password
    if (rememberedUsername) {
      setUsername(rememberedUsername);
      if (rememberedPassword) { // New: Set password if found
        setPassword(rememberedPassword);
      }
      setRememberMe(true); // Automatically check "Remember Me" if username is found
      console.warn("SECURITY WARNING: Plaintext passwords are being stored in localStorage. This is highly insecure. For production, consider using secure authentication methods like hashed passwords and session management.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await auth.login(username, password); // Changed email to username
      // On successful login:
      if (rememberMe) {
        localStorage.setItem('remembered_username', username);
        localStorage.setItem('remembered_password', password); // New: Save password to localStorage
      } else {
        localStorage.removeItem('remembered_username');
        localStorage.removeItem('remembered_password'); // New: Remove password from localStorage
      }
      // App.tsx will handle setting the user after successful login.
    } catch (err: any) {
      const message = err.message;
      if (message === 'Credenciales de inicio de sesión inválidas.') {
        setError('Credenciales de inicio de sesión inválidas. Por favor, verifica tu usuario y contraseña.');
      } else {
        setError(message || 'Ocurrió un error desconocido durante el inicio de sesión.');
      }
      setIsLoading(false);
    }
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      if (error) {
          setError(null);
      }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-base-200 rounded-2xl shadow-2xl transform transition-all">
        <div className="text-center">
            <img src={logoUrl} alt="Report-AI Logo" className="mx-auto h-16 w-auto" />
            <h2 className="mt-6 text-3xl font-extrabold text-base-content">
                Inicia sesión en Report-AI
            </h2>
            <p className="mt-2 text-sm text-neutral">
                Ingresa tus credenciales para acceder a tu cuenta.
            </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-start text-sm text-error bg-error/10 p-3 rounded-md">
                <AlertTriangleIcon className="h-5 w-5 mr-2 shrink-0" aria-hidden="true" />
                <span className="text-left">{error}</span>
            </div>
          )}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MailIcon className="h-5 w-5 text-neutral" />
            </div>
            <input
              id="username"
              name="username"
              type="text" // Type set to text as requested
              autoComplete="username"
              required
              className="appearance-none relative block w-full pl-10 pr-3 py-3 sm:text-sm input-style"
              placeholder="Usuario" // Placeholder changed
              value={username} // Changed email to username
              onChange={handleInputChange(setUsername)} // Changed setEmail to setUsername
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockIcon className="h-5 w-5 text-neutral" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="appearance-none relative block w-full pl-10 pr-3 py-3 sm:text-sm input-style"
              placeholder="Contraseña"
              value={password}
              onChange={handleInputChange(setPassword)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral">
                Recordarme
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !username || !password} // Changed email to username
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus disabled:bg-primary/50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
              ) : (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <LoginIcon className="h-5 w-5 text-primary-light group-hover:text-primary-lighter" />
                </span>
              )}
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
