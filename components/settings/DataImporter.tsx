import React, { useState } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';
import { SaveIcon } from '../ui/Icons';

const sampleJson = JSON.stringify(
  [
    {
      "nombre": "Nuevo Cliente Alfa",
      "ruc": "12345678901",
      "direccion": "Calle Falsa 123"
    },
    {
      "nombre": "Compañía Beta",
      "ruc": "10987654321",
      "direccion": "Avenida Siempre Viva 742"
    }
  ],
  null,
  2
);

const DataImporter: React.FC = () => {
  const { supabase } = useSupabase();
  const [jsonInput, setJsonInput] = useState(sampleJson);
  const [collectionName, setCollectionName] = useState('Empresa');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const handleSave = async () => {
    if (!collectionName.trim()) {
      setFeedback({ type: 'error', message: 'Por favor, especifica el nombre de la colección/tabla.' });
      return;
    }
    if (!supabase) {
        setFeedback({ type: 'error', message: 'El cliente de Supabase no está inicializado. Por favor, ve a la configuración de la base de datos.' });
        return;
    }

    setIsSaving(true);
    setFeedback(null);
    try {
      const dataToInsert = JSON.parse(jsonInput);
      if (!Array.isArray(dataToInsert)) {
        throw new Error("El JSON debe ser un array de objetos.");
      }

      const { error } = await supabase.from(collectionName.trim()).insert(dataToInsert);

      if (error) throw error;

      setFeedback({ type: 'success', message: `¡${dataToInsert.length} registros importados exitosamente en la tabla '${collectionName}'!` });
    } catch (error: any) {
      let errorMessage = 'Ocurrió un error inesperado.';
      if (error instanceof SyntaxError) {
        errorMessage = 'Formato JSON inválido. Por favor, revisa tus datos.';
      } else if (error.message) {
        // Customize Supabase error for clarity
        if(error.message.includes("relation") && error.message.includes("does not exist")) {
            errorMessage = `La tabla '${collectionName}' no existe. Por favor, verifica el nombre.`;
        } else {
            errorMessage = error.message;
        }
      }
      setFeedback({ type: 'error', message: `Error al importar: ${errorMessage}` });
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="space-y-6">
       <div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Importador de Datos</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Importa datos a tus tablas de la base de datos usando formato JSON.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="collection-name" className="font-medium text-sm">Nombre de la Colección/Tabla</label>
        <input
          type="text"
          id="collection-name"
          value={collectionName}
          onChange={(e) => setCollectionName(e.target.value)}
          placeholder="Escribe el nombre de la tabla (ej. Empresa)"
          className="block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary focus:border-primary sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="json-editor" className="block text-sm font-medium mb-1">Datos JSON (Debe ser un array de objetos)</label>
        <textarea
          id="json-editor"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Pega tus datos JSON aquí..."
          className="w-full h-80 p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary"
        />
      </div>

      {feedback && (
        <div className={`p-3 rounded-md text-sm ${feedback.type === 'success' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
          {feedback.message}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 font-medium text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors disabled:bg-primary/50"
        >
          {isSaving ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <SaveIcon className="h-5 w-5" />
          )}
          {isSaving ? 'Importando...' : 'Importar Datos'}
        </button>
      </div>
    </div>
  );
};

export default DataImporter;