import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { EmailIcon, LockIcon, LoginIcon, AlertTriangleIcon } from '../ui/Icons';
import { useTheme } from '../../contexts/ThemeContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useContext(AuthContext);
  const { logoUrl } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await auth.login(email, password);
      // On success, the onAuthStateChange listener in App.tsx will handle navigation.
    } catch (err: any) {
      const message = err.message;
      if (message === 'Invalid login credentials') {
        setError('Credenciales de inicio de sesión inválidas.');
      } else {
        setError(message || 'Ocurrió un error desconocido.');
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
              <EmailIcon className="h-5 w-5 text-neutral" />
            </div>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none relative block w-full pl-10 pr-3 py-3 sm:text-sm input-style"
              placeholder="Correo electrónico"
              value={email}
              onChange={handleInputChange(setEmail)}
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

          <div>
            <button
              type="submit"
              disabled={isLoading || !email || !password}
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