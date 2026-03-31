import { GoogleGenAI } from '@google/genai';

export const analyzeReportWithAi = async (file: File, type: 'service' | 'visit') => {
    // Convert file to base64
    const reader = new FileReader();
    const fileBase64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });

    const key = localStorage.getItem('GEMINI_API_KEY') || '';
    if (!key) throw new Error("API Key de Gemini no configurada. Agrega tu clave en localStorage con la clave 'GEMINI_API_KEY'.");

    const ai = new GoogleGenAI({ apiKey: key });

    const prompt = type === 'service'
        ? `Analiza este documento técnico de servicio y extrae los siguientes campos en formato JSON puro (sin markdown):
{
  "codigo": "código del reporte o null",
  "fecha": "fecha en formato YYYY-MM-DD o null",
  "hora_entrada": "HH:MM o null",
  "hora_salida": "HH:MM o null",
  "empresa_nombre": "nombre de la empresa cliente o null",
  "empresa_planta": "nombre de la planta/sede o null",
  "encargado_nombre": "nombre del encargado o null",
  "maquina_serie": "número de serie de la máquina o null",
  "maquina_modelo": "modelo o null",
  "maquina_marca": "marca o null",
  "problemas_encontrados": "descripción de problemas o null",
  "acciones_realizadas": "descripción de acciones o null",
  "observaciones": "observaciones adicionales o null"
}`
        : `Analiza este documento de visita técnica y extrae los siguientes campos en formato JSON puro (sin markdown):
{
  "codigo": "código del reporte o null",
  "empresa_nombre": "nombre de la empresa o null",
  "empresa_planta": "nombre de la planta o null",
  "encargado_nombre": "nombre del encargado o null",
  "observaciones": "observaciones o null",
  "sugerencias": "sugerencias o null"
}`;

    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [
            {
                role: 'user',
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            data: fileBase64,
                            mimeType: file.type || 'application/pdf'
                        }
                    }
                ]
            }
        ]
    });

    const text = response.text ?? '';

    // Extract JSON — strip markdown code fences if present
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No se pudo extraer información estructurada del documento.");

    const parsed = JSON.parse(jsonMatch[0]);

    // Clean: remove null values so they don't overwrite existing form data
    return Object.fromEntries(Object.entries(parsed).filter(([_, v]) => v !== null && v !== ''));
};
