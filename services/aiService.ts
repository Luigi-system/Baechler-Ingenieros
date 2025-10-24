

import { Type, FunctionDeclaration } from "@google/genai";
import type { SupabaseClient } from '@supabase/supabase-js';

const allTables = [
    'Reporte_Servicio', 'Reporte_Visita', 'Empresa', 'Planta', 'Maquinas', 'Encargado',
    'Usuarios', 'Roles', 'Configuracion', 'role_permissions'
];

const DATABASE_SCHEMA = `
  - Reporte_Servicio (id, codigo_reporte, fecha, problemas_encontrados, acciones_realizadas, operativo, facturado, id_empresa, id_usuario)
  - Reporte_Visita (id, codigo_reporte, fecha, motivo_visita, acuerdos, id_empresa, id_usuario)
  - Empresa (id, nombre, ruc, direccion, distrito)
  - Planta (id, nombre, id_empresa)
  - Maquinas (id, serie, modelo, marca, id_planta)
  - Usuarios (id, nombres, email, rol)
  - Roles (id, nombre)
`;

// --- GEMINI FUNCTION DECLARATIONS ---

export const executeQueryOnDatabase_Gemini: FunctionDeclaration = {
  name: 'executeQueryOnDatabase',
  description: "Realiza consultas SELECT simples en la base de datos para obtener listas de registros. Ideal para 'listar', 'mostrar' o 'buscar' datos.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      tableName: { type: Type.STRING, description: `La tabla a consultar. Tablas disponibles: ${allTables.join(', ')}.` },
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
      ascending: { type: Type.STRING, description: "Orden: 'true' para ascendente (defecto), 'false' para descendente." },
      limit: { type: Type.INTEGER, description: "Máximo de resultados a devolver (def: 10)." }
    },
    required: ["tableName"]
  },
};

export const getAggregateData_Gemini: FunctionDeclaration = {
    name: 'getAggregateData',
    description: "Realiza consultas de agregación para contar registros, sumar valores o agrupar datos. Ideal para preguntas como 'cuántos', 'total de', o 'agrupado por'.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            tableName: { type: Type.STRING, description: `La tabla a consultar. Tablas disponibles: ${allTables.join(', ')}.` },
            aggregationType: { type: Type.STRING, description: "Tipo de agregación: 'COUNT' o 'SUM'."},
            groupByColumn: { type: Type.STRING, description: "Columna por la cual agrupar los resultados (ej. 'id_empresa')." },
            valueColumn: { type: Type.STRING, description: "La columna a sumar si el tipo es 'SUM' (ej. 'total_facturado')." },
            filters: {
                type: Type.ARRAY, description: "Array de filtros a aplicar ANTES de la agregación.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        column: { type: Type.STRING },
                        operator: { type: Type.STRING },
                        value: { type: Type.STRING }
                    }
                }
            }
        },
        required: ["tableName", "aggregationType"]
    }
};

export const performAction_Gemini: FunctionDeclaration = {
    name: 'performAction',
    description: "Ejecuta una acción específica como actualizar ('UPDATE') o crear ('INSERT') un registro. Usar solo cuando el usuario explícitamente lo pida o después de que complete un formulario.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            tableName: { type: Type.STRING, description: `La tabla a modificar. Tablas disponibles: ${allTables.join(', ')}.` },
            actionType: { type: Type.STRING, description: "La acción a realizar: 'UPDATE' o 'INSERT'." },
            filters: {
                type: Type.ARRAY, description: "Filtros para identificar el/los registro(s) a actualizar (solo para UPDATE).",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        column: { type: Type.STRING },
                        operator: { type: Type.STRING },
                        value: { type: Type.STRING }
                    }
                }
            },
            updates: {
                type: Type.STRING,
                description: "Un string JSON con los pares columna-valor a actualizar (para UPDATE) o el objeto completo del nuevo registro (para INSERT). Ejemplo: '{\"nombre\": \"Nueva Empresa\", \"facturado\": true}'"
            }
        },
        required: ["tableName", "actionType", "updates"]
    }
};

// --- OPENAI FUNCTION DECLARATIONS ---

export const executeQueryOnDatabase_OpenAI = {
  name: 'executeQueryOnDatabase',
  description: "Realiza consultas SELECT simples en la base de datos para obtener listas de registros. Ideal para 'listar', 'mostrar' o 'buscar' datos.",
  parameters: {
    type: "object",
    properties: {
      tableName: { type: "string", description: `La tabla a consultar. Tablas disponibles: ${allTables.join(', ')}.` },
      select: { type: "string", description: "Campos a seleccionar, separados por comas (ej. 'nombre, ruc'). Defecto: '*'." },
      filters: {
        type: "array", description: "Array de filtros. Cada filtro es un objeto {column, operator, value}.",
        items: {
          type: "object",
          properties: {
            column: { type: "string" },
            operator: { type: "string", description: "Operador de Supabase (ej. 'eq', 'gt', 'gte', 'lt', 'lte', 'ilike')." },
            value: { type: "string" }
          }
        }
      },
      orderBy: { type: "string", description: "Columna para ordenar los resultados." },
      ascending: { type: "boolean", description: "Orden: true para ascendente (defecto), false para descendente." },
      limit: { type: "integer", description: "Máximo de resultados a devolver (def: 10)." }
    },
    required: ["tableName"]
  },
};

export const getAggregateData_OpenAI = {
    name: 'getAggregateData',
    description: "Realiza consultas de agregación para contar registros, sumar valores o agrupar datos. Ideal para preguntas como 'cuántos', 'total de', o 'agrupado por'.",
    parameters: {
        type: "object",
        properties: {
            tableName: { type: "string", description: `La tabla a consultar. Tablas disponibles: ${allTables.join(', ')}.` },
            aggregationType: { type: "string", "enum": ["COUNT", "SUM"], description: "Tipo de agregación: 'COUNT' o 'SUM'."},
            groupByColumn: { type: "string", description: "Columna por la cual agrupar los resultados (ej. 'id_empresa')." },
            valueColumn: { type: "string", description: "La columna a sumar si el tipo es 'SUM' (ej. 'total_facturado')." },
            filters: {
                type: "array", description: "Array de filtros a aplicar ANTES de la agregación.",
                items: {
                    type: "object",
                    properties: {
                        column: { type: "string" },
                        operator: { type: "string" },
                        value: { type: "string" }
                    }
                }
            }
        },
        required: ["tableName", "aggregationType"]
    }
};

export const performAction_OpenAI = {
    name: 'performAction',
    description: "Ejecuta una acción específica como actualizar ('UPDATE') o crear ('INSERT') un registro. Usar solo cuando el usuario explícitamente lo pida o después de que complete un formulario.",
    parameters: {
        type: "object",
        properties: {
            tableName: { type: "string", description: `La tabla a modificar. Tablas disponibles: ${allTables.join(', ')}.` },
            actionType: { type: "string", "enum": ["UPDATE", "INSERT"], description: "La acción a realizar: 'UPDATE' o 'INSERT'." },
            filters: {
                type: "array", description: "Filtros para identificar el/los registro(s) a actualizar (solo para UPDATE).",
                items: {
                    type: "object",
                    properties: {
                        column: { type: "string" },
                        operator: { type: "string" },
                        value: { type: "string" }
                    }
                }
            },
            updates: {
                type: "string",
                description: "Un string JSON con los pares columna-valor a actualizar (para UPDATE) o el objeto completo del nuevo registro (para INSERT). Ejemplo: '{\"nombre\": \"Nueva Empresa\", \"facturado\": true}'"
            }
        },
        required: ["tableName", "actionType", "updates"]
    }
};


export const responseSchema = {
    type: Type.OBJECT,
    properties: {
        displayText: { type: Type.STRING, description: "El texto principal de la respuesta para el usuario. Debe ser amigable, en español y conversacional." },
        table: {
            type: Type.OBJECT,
            properties: {
                headers: { type: Type.ARRAY, items: { type: Type.STRING } },
                rows: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } }
            }
        },
        chart: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, description: "'bar' o 'pie'." },
                data: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            value: { type: Type.NUMBER }
                        }
                    }
                }
            }
        },
        actions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    label: { type: Type.STRING },
                    prompt: { type: Type.STRING }
                }
            }
        },
        form: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, description: "'text', 'select', 'checkbox'." },
                    name: { type: Type.STRING },
                    label: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["displayText"]
};

export const systemInstruction = `
  Eres un asistente experto y analista de datos para una aplicación de gestión de reportes de servicio.
  Tu misión es responder preguntas y ejecutar acciones consultando la base de datos y DEVOLVER SIEMPRE UN OBJETO JSON estructurado según el schema.
  La fecha de hoy es ${new Date().toISOString().split('T')[0]}.

  **PROTOCOLO DE RESPUESTA JSON:**
  1.  **displayText:** Proporciona siempre un resumen en lenguaje natural y en español. Sé conciso pero informativo.
  2.  **table (Opcional):** Usa 'table' para presentar listas detalladas de datos tabulares (e.g., resultados de búsquedas, detalles de varios registros).
      Ejemplo de cuándo usar 'table': "Aquí están los últimos 5 reportes de servicio:\n\n\`\`\`json\n{\n  \"displayText\": \"Aquí están los últimos 5 reportes de servicio.\",\n  \"table\": {\n    \"headers\": [\"Código\", \"Fecha\", \"Empresa\", \"Estado\"],\n    \"rows\": [\n      [\"RS-001\", \"2024-07-20\", \"Empresa A\", \"Facturado\"],\n      [\"RS-002\", \"2024-07-19\", \"Empresa B\", \"Pendiente\"]\n    ]\n  },\n  \"suggestions\": [\"Ver más detalles del RS-001\", \"Listar reportes de la Empresa A\"]\n}\n\`\`\`
  3.  **chart (Opcional):** Usa 'chart' para visualizar datos agregados o para mostrar distribuciones y comparaciones.
      - Usa \`"type": "pie"\` para proporciones o composición (e.g., distribución de estados de reportes).
      - Usa \`"type": "bar"\` para comparar cantidades entre categorías (e.g., número de reportes por empresa).
      Ejemplo de cuándo usar 'chart': "Aquí tienes un gráfico de barras mostrando los reportes creados por cada empresa:\n\n\`\`\`json\n{\n  \"displayText\": \"Aquí tienes un gráfico de barras mostrando los reportes creados por cada empresa.\",\n  \"chart\": {\n    \"type\": \"bar\",\n    \"data\": [\n      {\"name\": \"Empresa A\", \"value\": 15},\n      {\"name\": \"Empresa B\", \"value\": 10}\n    ]\n  },\n  \"suggestions\": [\"Ver reportes de Empresa A\", \"Total de reportes facturados\"]\n}\n\`\`\`
  4.  **actions (Opcional):** Incluye botones de 'actions' cuando la respuesta implique una posible acción de seguimiento que el usuario podría querer ejecutar fácilmente. Estos prompts de acción deben ser claros y directos.
      Ejemplo de cuándo usar 'actions': "El reporte RS-005 de la Empresa C está pendiente de facturación. ¿Qué deseas hacer?\n\n\`\`\`json\n{\n  \"displayText\": \"El reporte RS-005 de la Empresa C está pendiente de facturación. ¿Qué deseas hacer?\",\n  \"actions\": [\n    {\"label\": \"Marcar como facturado\", \"prompt\": \"Marca el reporte RS-005 como facturado\"},\n    {\"label\": \"Editar reporte\", \"prompt\": \"Quiero editar el reporte RS-005\"}\n  ],\n  \"suggestions\": [\"Ver otros reportes pendientes\"]\n}\n\`\`\`
  5.  **form (Opcional):** Utiliza un 'form' cuando necesites recopilar información estructurada del usuario para una acción (ej. crear un nuevo registro). Define los campos necesarios (type, name, label, options).
      Ejemplo de cuándo usar 'form': "Necesito algunos datos para crear la nueva empresa. Por favor, completa este formulario:\n\n\`\`\`json\n{\n  \"displayText\": \"Necesito algunos datos para crear la nueva empresa. Por favor, completa este formulario:\",\n  \"form\": [\n    {\"type\": \"text\", \"name\": \"nombre\", \"label\": \"Nombre de la Empresa\"},\n    {\"type\": \"text\", \"name\": \"ruc\", \"label\": \"RUC\"},\n    {\"type\": \"select\", \"name\": \"distrito\", \"label\": \"Distrito\", \"options\": [\"Lima\", \"Miraflores\"]},\n    {\"type\": \"checkbox\", \"name\": \"activo\", \"label\": \"¿Está activa?\"}\n  ],\n  \"suggestions\": [\"Cancelar creación\", \"Ver empresas existentes\"]\n}\n\`\`\`
  6.  **suggestions (Opcional):** Ofrece 2-3 preguntas de seguimiento relevantes en español al final de tu respuesta para guiar al usuario.

  **TUS HERRAMIENTAS:**
  - \`executeQueryOnDatabase\`: Para consultas SELECT simples (listar, buscar).
  - \`getAggregateData\`: Para consultas complejas (COUNT, SUM, GROUP BY). Es la herramienta principal para generar datos para los 'charts'.
  - \`performAction\`: Úsalo SOLO cuando el usuario te pida explícitamente modificar datos (ej. "marca el reporte X como facturado") o después de que el usuario haya completado un formulario para crear un nuevo registro.

  **FLUJO PARA CREAR DATOS:**
  - Si el usuario pide crear algo (ej. "crea una nueva empresa"), PRIMERO solicita la información necesaria devolviendo un objeto \`form\` en tu respuesta JSON. NO intentes adivinar los datos.
  - Una vez que el usuario envíe el formulario, recibirás sus datos y DEBERÁS llamar a \`performAction\` con \`actionType: 'INSERT'\` y los datos del formulario en el campo \`updates\` (como un string JSON).

  **ESQUEMA DE DATOS:** ${DATABASE_SCHEMA}

  **REGLAS DE ORO:**
  - **RESPUESTA SIEMPRE EN JSON.**
  - **ERES UN ANALISTA, NO UN OPERADOR POR DEFECTO.** No modifiques datos a menos que el usuario te lo ordene explícitamente. Si te piden eliminar algo, responde en el \`displayText\`: "No tengo permisos para eliminar datos por seguridad."
`;

export const handleFunctionExecution = async (call: any, supabase: SupabaseClient) => {
    const args = call.args;
    let callResponsePayload;

    try {
        if (typeof args.tableName !== 'string' || !allTables.includes(args.tableName)) {
            throw new Error(`Acceso denegado o tabla inválida: '${args.tableName}'.`);
        }

        if (call.name === 'executeQueryOnDatabase') {
            let query = supabase.from(args.tableName).select(args.select as string || '*');
            if (args.filters && Array.isArray(args.filters)) {
                args.filters.forEach((filter: any) => query = query.filter(filter.column, filter.operator, filter.value));
            }
            if (args.orderBy) {
                // This logic handles both boolean (from OpenAI) and string 'false' (from Gemini)
                const ascending = args.ascending !== false && args.ascending !== 'false';
                query = query.order(args.orderBy as string, { ascending });
            }
            query = query.limit(args.limit as number || 10);
            const { data, error } = await query;
            if (error) throw error;
            callResponsePayload = { results: data };
        } else if (call.name === 'getAggregateData') {
            let query: any;
            if(args.aggregationType === 'COUNT') {
                query = supabase.from(args.tableName).select(`${args.groupByColumn}, count:count()`, { count: 'exact' });
            } else if(args.aggregationType === 'SUM') {
                 let initialQuery = supabase.from(args.tableName).select(`${args.groupByColumn}, ${args.valueColumn}`);
                 if (args.filters && Array.isArray(args.filters)) {
                    args.filters.forEach((filter: any) => initialQuery = initialQuery.filter(filter.column, filter.operator, filter.value));
                 }
                 const { data, error } = await initialQuery;
                 if (error) throw error;

                 const groupedSums = data.reduce((acc, item) => {
                     const group = item[args.groupByColumn];
                     const value = item[args.valueColumn];
                     if (group && typeof value === 'number') {
                         acc[group] = (acc[group] || 0) + value;
                     }
                     return acc;
                 }, {} as Record<string, number>);

                 const results = Object.entries(groupedSums).map(([group, total]) => ({ [args.groupByColumn]: group, total }));
                 callResponsePayload = { results };
                 return { functionResponse: { name: call.name, response: { result: JSON.stringify(callResponsePayload) } } };
            } else {
                throw new Error(`Tipo de agregación no soportado: ${args.aggregationType}`);
            }

            if (args.filters && Array.isArray(args.filters)) {
                args.filters.forEach((filter: any) => query = query.filter(filter.column, filter.operator, filter.value));
            }
            if (args.groupByColumn) query = query.group(args.groupByColumn as string);
            
            const { data, error } = await query;
            if (error) throw error;
            callResponsePayload = { results: data };
        } else if (call.name === 'performAction') {
             const updatesObject = JSON.parse(args.updates);
             if (typeof updatesObject !== 'object' || updatesObject === null) {
                throw new Error("El campo 'updates' debe ser un string JSON que represente un objeto válido.");
             }

             if (args.actionType === 'UPDATE') {
                let query = supabase.from(args.tableName).update(updatesObject);
                 if (args.filters && Array.isArray(args.filters)) {
                    args.filters.forEach((filter: any) => query = query.filter(filter.column, filter.operator, filter.value));
                }
                const { data, error } = await query.select();
                if (error) throw error;
                callResponsePayload = { results: data, message: `Se actualizaron ${data?.length || 0} registro(s).` };
             } else if (args.actionType === 'INSERT') {
                const { data, error } = await supabase.from(args.tableName).insert(updatesObject).select();
                if(error) throw error;
                callResponsePayload = { results: data, message: `Se creó ${data?.length || 0} nuevo registro(s) exitosamente.`};
             } else {
                throw new Error(`Acción no soportada: ${args.actionType}. Solo se permiten 'UPDATE' e 'INSERT'.`);
             }
        } else {
            throw new Error("Función no soportada.");
        }
    } catch(e: any) {
        callResponsePayload = { error: e.message };
    }

    return {
        functionResponse: {
            name: call.name,
            response: { result: JSON.stringify(callResponsePayload) },
        },
    };
};
