import { GoogleGenAI, Type, FunctionDeclaration, Chat } from "@google/genai";
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AIResponse } from '../types';

// Per guidelines, API key is expected to be in environment variables.
const GEMINI_API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (GEMINI_API_KEY) {
    try {
        ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    } catch (e) {
        console.error("Failed to initialize GoogleGenAI:", e);
    }
}


const allowedTables = [
    'Reporte_Servicio', 'Reporte_Visita', 'Empresa', 'Planta', 
    'Maquinas', 'Encargado', 'Usuarios', 'Roles'
];

const DATABASE_SCHEMA = `
  - Reporte_Servicio (id, codigo_reporte, fecha, problemas_encontrados, acciones_realizadas, operativo, facturado, id_empresa, id_usuario)
  - Empresa (id, nombre, ruc, direccion, distrito)
  - Planta (id, nombre, id_empresa)
  - Maquinas (id, serie, modelo, marca, id_planta)
  - Usuarios (id, nombres, email, rol)
  - Roles (id, nombre)
`;

const executeQueryOnDatabase: FunctionDeclaration = {
  name: 'executeQueryOnDatabase',
  description: "Realiza consultas directas y simples con filtros en la base de datos. Ideal para buscar registros específicos o listas filtradas.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      tableName: { type: Type.STRING, description: `La tabla a consultar. Tablas disponibles: ${allowedTables.join(', ')}.` },
      select: { type: Type.STRING, description: "Campos a seleccionar, separados por comas (ej. 'nombre, ruc'). Defecto: '*'." },
      filters: {
        type: Type.ARRAY, description: "Array de filtros. Cada filtro es un objeto {column, operator, value}.",
        items: {
          type: Type.OBJECT,
          properties: {
            column: { type: Type.STRING },
            operator: { type: Type.STRING, description: "Operador de Supabase (ej. 'eq', 'gt', 'gte', 'lt', 'lte', 'ilike')." },
            value: { type: Type.STRING }
          }
        }
      },
      orderBy: { type: Type.STRING, description: "Columna para ordenar los resultados." },
      ascending: { type: Type.BOOLEAN, description: "Orden: true para ascendente, false para descendente." },
      limit: { type: Type.INTEGER, description: "Máximo de resultados a devolver (def: 10)." }
    },
    required: ["tableName"]
  },
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        displayText: {
            type: Type.STRING,
            description: "El texto principal de la respuesta para el usuario. Debe ser amigable, en español y conversacional."
        },
        table: {
            type: Type.OBJECT,
            description: "Datos tabulares para mostrar al usuario, si la consulta lo requiere. Opcional.",
            properties: {
                headers: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Un array de strings para las cabeceras de la tabla."
                },
                rows: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING, },
                    },
                    description: "Un array de arrays, donde cada array interno es una fila de la tabla. Todos los valores deben ser strings."
                }
            },
        },
        suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Un array de 2 a 3 preguntas de seguimiento sugeridas en español que el usuario podría hacer. Opcional."
        }
    },
    required: ["displayText"]
};

const systemInstruction = `
  Eres un asistente experto y analista de datos para una aplicación de gestión de reportes de servicio.
  Tu misión es responder preguntas consultando la base de datos y DEVOLVER SIEMPRE UN OBJETO JSON estructurado según el schema proporcionado.
  La fecha de hoy es ${new Date().toISOString().split('T')[0]}.

  **PROTOCOLO DE RESPUESTA JSON:**
  1.  **displayText:** Proporciona siempre un texto introductorio o un resumen en lenguaje natural y en español.
  2.  **table (Opcional):** Si la consulta devuelve una lista de datos (reportes, empresas, etc.), formatea el resultado en este objeto.
      - \`headers\`: Un array con los nombres de las columnas.
      - \`rows\`: Un array de arrays, donde cada array interno representa una fila. **Todos los valores en las filas deben ser strings.** Formatea fechas a 'DD/MM/YYYY'.
  3.  **suggestions (Opcional):** Ofrece 2 o 3 preguntas de seguimiento relevantes en español.

  **TUS CAPACIDADES:**
  - Usa la herramienta \`executeQueryOnDatabase\` para obtener los datos que necesitas.
  - Para preguntas complejas (ej. "reportes por usuario"), puedes realizar una consulta amplia y luego analizar los datos internamente para construir la respuesta final.
  - **NUNCA** incluyas el JSON crudo de la base de datos en el \`displayText\`. Tu trabajo es procesarlo y presentarlo de forma limpia.

  **ESQUEMA DE DATOS:** ${DATABASE_SCHEMA}

  **REGLAS DE ORO:**
  - **RESPUESTA SIEMPRE EN JSON.** Cada una de tus respuestas finales al usuario debe ser un objeto JSON que valide con el schema.
  - **ERES UN ANALISTA DE SOLO LECTURA.** No tienes permitido modificar, insertar o eliminar datos. Si te lo piden, responde en el \`displayText\`: "Mi función es analizar y consultar la información. No tengo permisos para modificar o eliminar datos."
`;

let chat: Chat | null = null;

export const getAIInsight = async (prompt: string, supabase: SupabaseClient): Promise<AIResponse> => {
    if (!ai) {
        return { displayText: "El servicio de IA (Gemini) no está inicializado. Asegúrate de que la API Key esté configurada correctamente." };
    }
    
    if (!chat) {
        chat = ai.chats.create({
            model: 'gemini-2.5-pro',
            config: {
                tools: [{ functionDeclarations: [executeQueryOnDatabase] }],
                systemInstruction: systemInstruction,
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });
    }

    try {
        let result = await chat.sendMessage({ message: prompt });

        while (result.functionCalls && result.functionCalls.length > 0) {
            const functionCalls = result.functionCalls;
            
            const toolExecutionPromises = functionCalls.map(async (call) => {
                const args = call.args;
                let callResponsePayload;

                if (call.name === 'executeQueryOnDatabase') {
                    if (typeof args.tableName !== 'string' || !allowedTables.includes(args.tableName)) {
                        callResponsePayload = { error: `Acceso denegado a la tabla '${args.tableName}'.` };
                    } else {
                        let query = supabase.from(args.tableName).select(args.select as string || '*');
                        
                        if (args.filters && Array.isArray(args.filters)) {
                            args.filters.forEach((filter: any) => {
                                if (filter.column && filter.operator && filter.value !== undefined) {
                                    query = query.filter(filter.column, filter.operator, filter.value);
                                }
                            });
                        }
                        if (args.orderBy) {
                            query = query.order(args.orderBy as string, { ascending: args.ascending !== false });
                        }
                        query = query.limit(args.limit as number || 10);
                        const { data: dbData, error } = await query;
                        callResponsePayload = error ? { error: error.message } : { results: dbData };
                    }
                } else {
                    callResponsePayload = { error: "Función no soportada." };
                }

                return {
                    functionResponse: {
                        name: call.name,
                        response: { result: JSON.stringify(callResponsePayload) },
                    },
                };
            });

            const toolResponseParts = await Promise.all(toolExecutionPromises);
            result = await chat.sendMessage({ message: toolResponseParts });
        }

        const responseText = result.text;
        if (!responseText) {
            throw new Error("La IA no generó una respuesta de texto.");
        }
        
        const parsedJson = JSON.parse(responseText);
        return parsedJson as AIResponse;

    } catch (error) {
        console.error("Error en getAIInsight:", error);
        const chatError = error as any;
        if (chatError.message?.includes('SAFETY')) {
            return { displayText: "Tu consulta fue bloqueada por políticas de seguridad. Por favor, reformula tu pregunta."};
        }
        return { displayText: `Lo siento, ocurrió un error al procesar tu solicitud con la IA: ${chatError.message}` };
    }
};
