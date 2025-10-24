



import React, { useContext, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import { useSupabase } from '../../contexts/SupabaseContext';
import { COLOR_PALETTES } from '../../constants/themes';
import { SaveIcon, PaletteIcon, BuildingIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';
import type { ColorPalette } from '../../types';

const CustomizationSettings: React.FC = () => {
  const { 
    currentPalette, setPalette, 
    logoUrl, setLogoUrl, 
    appTitle, setAppTitle 
  } = useTheme();

  const { supabase } = useSupabase();
  const auth = useContext(AuthContext);

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const groupedPalettes = COLOR_PALETTES.reduce((acc, palette) => {
    (acc[palette.category] = acc[palette.category] || []).push(palette);
    return acc;
  }, {} as Record<string, typeof COLOR_PALETTES>);
  
  const handleSave = async () => {
    if (!supabase || !auth?.user) {
        setFeedback({ type: 'error', message: 'No se puede guardar: usuario no autenticado o conexión a la base de datos no disponible.' });
        return;
    }
    setIsSaving(true);
    setFeedback(null);

    // Task 1: Save General Branding
    const saveBranding = async () => {
        const brandingValue = { app_title: appTitle, logo_url: logoUrl };
        const { data: existing, error: selectError } = await supabase
            .from('Configuracion')
            .select('id')
            .eq('key', 'general_branding')
            .is('id_usuario', null)
            .maybeSingle();

        if (selectError) return selectError;
        
        if (existing) {
            const { error } = await supabase.from('Configuracion').update({ value: JSON.stringify(brandingValue) }).eq('id', existing.id);
            return error;
        } else {
            const { error } = await supabase.from('Configuracion').insert({ key: 'general_branding', value: JSON.stringify(brandingValue), id_usuario: null });
            return error;
        }
    };

    // Task 2: Save User Theme
    const saveTheme = async () => {
        const themeValue = { color_palette_name: currentPalette.name };
        const { data: existing, error: selectError } = await supabase
            .from('Configuracion')
            .select('id')
            .eq('key', 'user_theme_settings')
            .eq('id_usuario', auth.user.id)
            .maybeSingle();

        if (selectError) return { error: selectError, data: themeValue };

        if (existing) {
            const { error } = await supabase.from('Configuracion').update({ value: JSON.stringify(themeValue) }).eq('id', existing.id);
            return { error, data: themeValue };
        } else {
            const { error } = await supabase.from('Configuracion').insert({ key: 'user_theme_settings', value: JSON.stringify(themeValue), id_usuario: auth.user.id });
            return { error, data: themeValue };
        }
    };

    const [brandingError, themeResult] = await Promise.all([saveBranding(), saveTheme()]);

    setIsSaving(false);

    if (brandingError || themeResult.error) {
        const bError = brandingError ? `Branding: ${brandingError.message}` : '';
        const tError = themeResult.error ? `Theme: ${themeResult.error.message}` : '';
        setFeedback({ type: 'error', message: `Error al guardar: ${bError} ${tError}`.trim() });
    } else {
        auth.updateUser({ color_palette_name: themeResult.data.color_palette_name });
        setFeedback({ type: 'success', message: '¡Configuración guardada exitosamente!' });
    }
  };


  return (
    <div className="space-y-8">
        <div className="bg-base-200 p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl">
            <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary p-3 rounded-lg">
                    <BuildingIcon className="h-8 w-8" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-base-content">Branding de la Aplicación</h3>
                    <p className="mt-1 text-sm text-neutral">
                    Personaliza el título y el logo de la aplicación. Estos cambios son generales y afectarán a todos los usuarios.
                    </p>
                </div>
            </div>
            <div className="mt-6 space-y-4 pt-6 border-t border-base-border">
                <div>
                    <label htmlFor="appTitle" className="block text-sm font-medium">Título de la Aplicación</label>
                    <input
                        id="appTitle"
                        type="text"
                        value={appTitle}
                        onChange={(e) => setAppTitle(e.target.value)}
                        placeholder="Ej: Mi Empresa App"
                        className="mt-1 block w-full max-w-sm input-style"
                    />
                </div>
                <div>
                    <label htmlFor="logoUrl" className="block text-sm font-medium">URL del Logo</label>
                    <div className="flex items-center space-x-4 mt-1">
                    <img src={logoUrl} alt="Current Logo" className="h-12 w-12 bg-base-300 p-1 rounded-full object-contain"/>
                    <input
                        id="logoUrl"
                        type="text"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="Ingresa la URL del logo"
                        className="block w-full max-w-sm input-style"
                    />
                    </div>
                </div>
            </div>
        </div>
      
        <div className="bg-base-200 p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl">
             <div className="flex items-start gap-4">
                <div className="bg-secondary/10 text-secondary p-3 rounded-lg">
                    <PaletteIcon className="h-8 w-8" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-base-content">Paleta de Colores</h3>
                    <p className="mt-1 text-sm text-neutral">Selecciona un esquema de colores que se ajuste a tu marca. Este cambio es específico para tu usuario.</p>
                </div>
            </div>
            <div className="mt-6 pt-6 border-t border-base-border">
                {Object.entries(groupedPalettes).map(([category, palettes]) => (
                <div key={category} className="mb-6">
                    <h5 className="font-medium text-neutral mb-3">{category}</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {palettes.map((palette: ColorPalette) => (
                        <div
                        key={palette.name}
                        onClick={() => setPalette(palette)}
                        className={`cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 ${
                            currentPalette.name === palette.name
                            ? 'border-primary shadow-lg scale-105'
                            : 'border-base-border hover:border-primary/50'
                        }`}
                        >
                        <div className="flex space-x-2">
                            <div style={{ backgroundColor: palette.light.primary }} className="h-8 w-8 rounded-full"></div>
                            <div style={{ backgroundColor: palette.light.secondary }} className="h-8 w-8 rounded-full"></div>
                            <div style={{ backgroundColor: palette.light.accent }} className="h-8 w-8 rounded-full"></div>
                        </div>
                        <p className="mt-2 text-sm font-medium text-center">{palette.name}</p>
                        </div>
                    ))}
                    </div>
                </div>
                ))}
            </div>
        </div>
      
       {feedback && (
        <div className={`p-3 rounded-md text-sm ${feedback.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
          {feedback.message}
        </div>
      )}

      <div className="flex justify-end pt-6">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-5 py-2.5 font-medium text-white bg-primary rounded-lg hover:bg-primary-focus focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors disabled:bg-primary/50"
          >
            {isSaving ? ( <Spinner /> ) : ( <SaveIcon className="h-5 w-5" /> )}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

    </div>
  );
};

export default CustomizationSettings;