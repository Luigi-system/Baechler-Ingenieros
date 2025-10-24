
import React, { useContext, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import { useSupabase } from '../../contexts/SupabaseContext';
import { COLOR_PALETTES } from '../../constants/themes';
import { SaveIcon } from '../ui/Icons';
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

     const settingsValue = {
        app_title: appTitle,
        logo_url: logoUrl,
        color_palette_name: currentPalette.name,
     };
     
     // FIX: Replace `upsert` with a `select` then `update`/`insert` to avoid ON CONFLICT errors
     // when no unique constraint is present on the `onConflict` columns.
     const { data: existingConfig, error: selectError } = await supabase
        .from('Configuracion')
        .select('id')
        .eq('id_usuario', auth.user.id)
        .eq('key', 'branding_settings')
        .maybeSingle();

      if (selectError) {
          setFeedback({ type: 'error', message: `Error al buscar configuración: ${selectError.message}` });
          setIsSaving(false);
          return;
      }
      
      let error;
      const settingsString = JSON.stringify(settingsValue);

      if (existingConfig) {
          // Update
          const { error: updateError } = await supabase
              .from('Configuracion')
              .update({ value: settingsString })
              .eq('id', existingConfig.id);
          error = updateError;
      } else {
          // Insert
          const { error: insertError } = await supabase
              .from('Configuracion')
              .insert({
                  id_usuario: auth.user.id,
                  key: 'branding_settings',
                  value: settingsString,
              });
          error = insertError;
      }

     if (error) {
        setFeedback({ type: 'error', message: `Error al guardar la configuración: ${error.message}` });
     } else {
        setFeedback({ type: 'success', message: '¡Configuración guardada exitosamente!' });
        auth.updateUser(settingsValue);
     }
     setIsSaving(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Personalización de Apariencia</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Personaliza la apariencia de tu aplicación. Los cambios se guardarán en tu perfil de usuario.
        </p>
      </div>

       <div className="space-y-4">
        <h4 className="font-semibold">Título de la Aplicación</h4>
        <input
            type="text"
            value={appTitle}
            onChange={(e) => setAppTitle(e.target.value)}
            placeholder="Ej: Mi Empresa App"
            className="block w-full max-w-sm p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent focus:ring-primary focus:border-primary"
          />
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold">Logo</h4>
        <div className="flex items-center space-x-4">
          <img src={logoUrl} alt="Current Logo" className="h-12 w-12 bg-gray-200 dark:bg-gray-700 p-1 rounded-full"/>
          <input
            type="text"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="Ingresa la URL del logo"
            className="block w-full max-w-sm p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold">Paleta de Colores</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">Selecciona un esquema de colores que se ajuste a tu marca.</p>
        
        {Object.entries(groupedPalettes).map(([category, palettes]) => (
          <div key={category}>
            <h5 className="font-medium text-gray-600 dark:text-gray-300 mb-2">{category}</h5>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {palettes.map((palette: ColorPalette) => (
                <div
                  key={palette.name}
                  onClick={() => setPalette(palette)}
                  className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
                    currentPalette.name === palette.name
                      ? 'border-primary shadow-lg'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'
                  }`}
                >
                  <div className="flex space-x-2">
                    <div style={{ backgroundColor: palette.colors.primary }} className="h-8 w-8 rounded-full"></div>
                    <div style={{ backgroundColor: palette.colors.secondary }} className="h-8 w-8 rounded-full"></div>
                    <div style={{ backgroundColor: palette.colors.accent }} className="h-8 w-8 rounded-full"></div>
                  </div>
                  <p className="mt-2 text-sm font-medium text-center">{palette.name}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
       {feedback && (
        <div className={`p-3 rounded-md text-sm ${feedback.type === 'success' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
          {feedback.message}
        </div>
      )}

      <div className="flex justify-end border-t border-gray-200 dark:border-gray-700 pt-6">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-5 py-2.5 font-medium text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors disabled:bg-primary/50"
          >
            {isSaving ? ( <Spinner /> ) : ( <SaveIcon className="h-5 w-5" /> )}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

    </div>
  );
};

export default CustomizationSettings;
