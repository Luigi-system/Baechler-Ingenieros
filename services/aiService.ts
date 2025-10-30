

import { Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import type { SupabaseClient } from '@supabase/supabase-js';
import { AgenteClient } from '../services/agenteService'; // Assuming AgenteClient is correctly defined and imported
import { AIResponse, TableData } from '../types'; // Assuming these are correctly defined

const allTables = [
    'Reporte_Servicio', 'Reporte_Visita', 'Empresa', 'Planta', 'Maquinas', 'Encargado',
    'Usuarios', 'Roles', 'Configuracion', 'role_permissions'
];

const DATABASE_SCHEMA = `
  - Reporte_Servicio:
    - id (PK), codigo_reporte (TEXT), fecha (DATE), entrada (TIME), salida (TIME), problemas_encontrados (TEXT), acciones_realizadas (TEXT), observaciones (TEXT), estado_maquina (ENUM: 'operativo', 'inoperativo', 'en_prueba'), estado_garantia (ENUM: 'con_garantia', 'sin_garantia'), facturado (BOOLEAN), no_facturado (BOOLEAN), estado (BOOLEAN: finalizado/en_progreso), fotos_problemas_encontrados_url (TEXT[]), fotos_acciones_realizadas_url (TEXT[]), fotos_observaciones_url (TEXT[]), foto_firma_url (TEXT), nombre_firmante (TEXT), celular_firmante (TEXT), id_empresa (FK -> Empresa.id), id_planta (FK -> Planta.id), id_encargado (FK -> Encargado.id), id_usuario (FK -> Usuarios.id), url_pdf (TEXT)
    - Relaciones: Empresa (id_empresa), Planta (id_planta), Encargado (id_encargado), Usuarios (id_usuario)

  - Reporte_Visita:
    - id (PK), codigo_reporte (TEXT), fecha (DATE), motivo_visita (TEXT), temas_tratados (TEXT), acuerdos (TEXT), pendientes (TEXT), observaciones (TEXT), nombre_firmante (TEXT), id_empresa (FK -> Empresa.id), id_planta (FK -> Planta.id), id_encargado (FK -> Encargado.id), id_usuario (FK -> Usuarios.id), url_pdf (TEXT)
    - Relaciones: Empresa (id_empresa), Planta (id_planta), Encargado (id_encargado), Usuarios (id_usuario)

  - Empresa:
    - id (PK), nombre (TEXT), ruc (TEXT), direccion (TEXT), distrito (TEXT), estado (BOOLEAN)

  - Planta:
    - id (PK), nombre (TEXT), direccion (TEXT), estado (BOOLEAN), id_empresa (FK -> Empresa.id)
    - Relaciones: Empresa (id_empresa)

  - Maquinas:
    - id (PK), serie (TEXT), modelo (TEXT), marca (TEXT), linea (TEXT), estado (BOOLEAN), id_planta (FK -> Planta.id), id_empresa (FK -> Empresa.id)
    - Relaciones: Planta (id_planta), Empresa (id_empresa)

  - Encargado:
    - id (PK), nombre (TEXT), apellido (TEXT), email (TEXT), celular (TEXT), id_planta (FK -> Planta.id), id_empresa (FK -> Empresa.id)
    - Relaciones: Planta (id_planta), Empresa (id_empresa)

  - Usuarios:
    - id (PK), nombres (TEXT), email (TEXT), rol (FK -> Roles.id), dni (TEXT), celular (TEXT)
    - Relaciones: Roles (rol)

  - Roles:
    - id (PK), nombre (TEXT)

  - Configuracion:
    - id (PK), key (TEXT), value (JSONB), id_usuario (FK -> Usuarios.id, puede ser NULL para configuración global)
    - Relaciones: Usuarios (id_usuario)

  - role_permissions:
    - role_id (FK -> Roles.id), permission_name (TEXT)
    - Relaciones: Roles (role_id)
`;


// System instruction for when the AI is directly interacting with Supabase functions
export const directSupabaseSystemInstruction = `
  Eres un asistente experto y analista de datos para una aplicación de gestión de reportes de servicio.
  Tu misión es responder preguntas y ejecutar acciones consultando directamente la base de datos y DEVOLVER SIEMPRE UN OBJETO JSON estructurado según el schema, **priorizando la presentación de información en formatos visualmente atractivos y funcionales como tablas, gráficos, botones y formularios interactivos.**
  La fecha de hoy es ${new Date().toISOString().split('T')[0]}.

  **PROTOCOLO DE RESPUESTA JSON (¡UTILIZA TODOS LOS COMPONENTES POSIBLES PARA MEJOR UX!):**
  1.  **displayText:** Proporciona siempre un resumen en lenguaje natural y en español. Sé conciso pero informativo.
  2.  **table (Opcional - Para listados claros y organizados):** Usa 'table' para presentar listas detalladas de datos tabulares (e.g., resultados de búsquedas, detalles de varios registros). **Siempre que la respuesta involucre una lista de 2 o más elementos con una estructura de datos repetitiva, preséntala como una tabla.**
  3.  **chart (Opcional - Para visualizaciones impactantes y resúmenes de datos):** Usa 'chart' para visualizar datos agregados o para mostrar distribuciones y comparaciones.
      - Usa \`"type": "pie"\` para proporciones o composición (e.g., distribución de estados de reportes).
      - Usa \`"type": "bar"\` para comparar cantidades entre categorías (e.g., número de reportes por empresa).
      **Prefiere los gráficos para resumir tendencias o comparaciones de datos numéricos complejos.**
  4.  **actions (Opcional - Para acciones rápidas y directas):** Incluye botones de 'actions' cuando la respuesta implique una posible acción de seguimiento que el usuario podría querer ejecutar fácilmente. Estos prompts de acción deben ser claros y directos. **Utiliza hasta 3 acciones relevantes para guiar al usuario a los siguientes pasos lógicos.**
  5.  **form (Opcional - ¡FUNDAMENTAL para la interacción estructurada!):** El campo 'form' DEBE ser un **ARRAY de objetos**, donde cada objeto representa un campo del formulario. NO debe ser un solo objeto. Utiliza un 'form' SIEMPRE que necesites recopilar información estructurada del usuario para una acción (ej. crear un nuevo registro). Cada objeto de campo en 'form' DEBE contener las propiedades 'type', 'name' y **'label'**. La **'label' es CRÍTICA** para que el usuario entienda qué dato se le solicita. Define los campos necesarios (type: 'text', 'select' para comboboxes, 'checkbox'), name, label, options y placeholder.
  6.  **statusDisplay (Opcional - Para confirmaciones visuales):** Utiliza 'statusDisplay' para mostrar un mensaje de estado prominente y con un icono después de que una acción de modificación de datos (INSERT/UPDATE) se haya completado con éxito. Usa \`"icon": "success"\` para éxito y \`"icon": "error"\` para fallos.
  7.  **suggestions (Opcional):** Ofrece 2-3 preguntas de seguimiento relevantes en español al final de tu respuesta para guiar al usuario.

  **TUS HERRAMIENTAS:**
  - \`executeQueryOnDatabase\`: Para consultas SELECT simples (listar, buscar).
  - \`getAggregateData\`: Para consultas complexas (COUNT, SUM, GROUP BY). Es la herramienta principal para generar datos para los 'charts'.
  - \`performAction\`: Úsalo SOLO cuando el usuario te lo ordene explícitamente modificar datos o después de que el usuario haya completado un formulario.

  **FLUJO PARA CREAR/ACTUALIZAR DATOS (¡IMPRESCINDIBLE SEGUIR ESTOS PASOS!):**
  1.  Si el usuario pide crear/actualizar algo (ej. "crea una nueva planta", "edita la máquina X"), analiza las dependencias de la tabla del esquema de datos. Por ejemplo, una 'Planta' necesita una 'id_empresa'.
  2.  SI HAY DEPENDENCIAS que requieren una selección (como seleccionar una empresa para una planta), PRIMERO USA la herramienta \`executeQueryOnDatabase\` para obtener la lista de opciones (ej. \`executeQueryOnDatabase({tableName: 'Empresa', columns: ['id', 'nombre']})\`).
  3.  DESPUÉS de obtener los datos de la herramienta, GENERA LA RESPUESTA JSON FINAL CON EL 'form'. El campo dependiente debe ser de \`"type": "select"\`. Sus \`"options"\` deben ser un array de strings, cada uno con el formato "ID: Nombre" (ej. ["1: Empresa A", "2: Empresa B"]). El \`name\` del campo debe ser el nombre de la columna de la clave foránea (ej. "id_empresa").
  4.  Una vez que el usuario envíe el formulario, recibirás sus datos y DEBERÁS llamar a \`performAction\` con \`actionType: 'INSERT'\` o \`'UPDATE'\`. En el \`updates\`, asegúrate de enviar el ID numérico que el usuario seleccionó.

  **ESQUEMA DE DATOS:**
  ${DATABASE_SCHEMA}

  **REGLAS DE ORO:**
  - **RESPUESTA SIEMPRE EN JSON VÁLIDO.**
  - **ERES UN ANALISTA, NO UN OPERADOR POR DEFECTO.** No modifiques datos a menos que el usuario te lo ordene explícitamente. Si te piden eliminar algo, responde en el \`displayText\`: "No tengo permisos para eliminar datos por seguridad."
  - **SI NO PUEDES GENERAR UNA RESPUESTA SIGNIFICATIVA EN JSON, NO INTENTES DEVOLVER JSON MALFORMADO O VACÍO. EN SU LUGAR, DEJA QUE LA RESPUESTA SEA UN STRING SIMPLE CON UN MENSAJE DE ERROR CLARO EN ESPAÑOL, QUE SERÁ MANEJADO POR LA INTERFAZ DE USUARIO.**
`;

// System instruction for when the AI is acting as an orchestrator for the external agent
export const agenteOrchestratorSystemInstruction = `
  Eres un asistente de consultas y creacion de datos.
  Tu rol es ORQUESTAR las interacciones del usuario con un AGENTE externo que maneja la base de datos, 
  La información e interaccion para el usuario se presente de forma rica en informacion, visual y altamente interactiva (utilizando tablas, gráficos, botones, cajas de texto, checkbox, graficos, listas, richtext y formularios).**

  **PROTOCOLO DE RESPUESTA JSON (para la interfaz de usuario - ¡SIEMPRE APLICA Y UTILIZA AL MÁXIMO LOS COMPONENTENTES!):**
  1.  **displayText:** Proporciona siempre un resumen en lenguaje natural y en español.
  2.  **table (Opcional):** Usa 'table' para presentar listas de datos obtenidas del agente.
  3.  **chart (Opcional):** Usa 'chart' para visualizar datos agregados obtenidos del agente.
  4.  **actions (Opcional):** Incluye botones de 'actions' para sugerir siguientes pasos.
  5.  **form (Opcional):** El campo 'form' DEBE ser un **ARRAY de objetos**. Utiliza un 'form' cuando necesites recopilar información del usuario ANTES de enviarla al agente externo. Tú eres el único que genera estos formularios. Cada objeto de campo DEBE contener 'type', 'name' y 'label'.
  6.  **statusDisplay (Opcional):** Utiliza 'statusDisplay' para mostrar un mensaje de estado prominente (éxito/error) después de una operación.
  7.  **suggestions (Opcional):** Ofrece 2-3 preguntas de seguimiento.

  **FLUJO PARA CREAR/ACTUALIZAR DATOS (¡IMPRESCINDIBLE SEGUIR ESTOS PASOS!):**
  1.  Si el usuario pide crear/actualizar algo analiza las dependencias. si te piden crear una maquina o encargado debes pedirle la empresa y planta a la que va pertenercer, si te piden crear una planta le debes pedir la empresa a la que va pertenecer          
  2.  SI HAY DEPENDENCIAS que requieren una selección, PRIMERO USA la herramienta \`callExternalAgentWithQuery\` para obtener la lista de opciones (ej. \`callExternalAgentWithQuery({query: "dame el id y nombre de todas las empresas"})\`).
  3.  Una vez recibida la respuesta del agente con los datos, genera la respuesta JSON final que incluya el 'form'. El campo dependiente debe ser de tipo "select". Sus "options" deben ser un array de strings con el formato "ID: Nombre" (ej. ["1: Empresa A", "2: Empresa B"]). El 'name' del campo debe ser el nombre de la columna de la clave foránea (ej. "id_empresa").
  4.  Cuando el usuario envíe el formulario que tú generaste, recibirás los datos y DEBERÁS usar la herramienta \`callExternalAgentWithData\`. Asegúrate de enviar el ID numérico que el usuario seleccionó.

  **TUS HERRAMIENTAS:**
  - \`callExternalAgentWithQuery\`: Para enviar preguntas de datos al agente externo.
  - \`callExternalAgentWithData\`: Para enviar datos a guardar (después de un formulario que tú generaste) al agente externo.

  **REGLAS DE ORO:**
  -   **SIEMPRE RESPONDER EN FORMATO JSON VÁLIDO.**
  -   **TU PRIORIDAD ES LA UX:** Si una acción requiere datos, ¡pide el formulario! Si una pregunta es de datos, ¡prepara la consulta para el agente y visualiza la respuesta!
  -   **NO MODIFIQUES DATOS DIRECTAMENTE.** Tu rol es de orquestador. El agente externo es quien realiza las operaciones finales en la DB.
  -   Si te piden eliminar algo, responde en el \`displayText\`: "No tengo permisos para eliminar datos por seguridad."
  - **SI NO PUEDES GENERAR UNA RESPUESTA SIGNIFICATIVA EN JSON, NO INTENTES DEVOLVER JSON MALFORMADO O VACÍO. EN SU LUGAR, DEJA QUE LA RESPUESTA SEA UN STRING SIMPLE CON UN MENSAJE DE ERROR CLARO EN ESPAÑOL, QUE SERÁ MANEJADO POR LA INTERFAZ DE USUARIO.**
`;

// Define helper for consistent AI response structure for Gemini tool outputs
interface FunctionResponsePart {
  functionResponse: {
    id: string; // The ID of the tool call this is a response to
    name: string; // The name of the function called
    response: {
      result: string; // The result of the function call, typically JSON stringified
    };
  };
}

// Helper to simulate complex database query results
const simulateDbQuery = (tableName: string, conditions: any, isAggregate: boolean = false): any => {
    // This is a simplified simulation. In a real app, this would query Supabase.
    console.log(`Simulating query on ${tableName} with conditions:`, conditions);
    if (isAggregate) {
        if (tableName === 'Reporte_Servicio') {
            return [{ name: 'Facturados', value: 10 }, { name: 'Pendientes', value: 5 }];
        }
        return [{ count: 50 }]; // Generic count
    }

    if (tableName === 'Empresa') {
        return [
            { id: 1, nombre: 'Empresa A', ruc: '123', direccion: 'Calle 1' },
            { id: 2, nombre: 'Empresa B', ruc: '456', direccion: 'Calle 2' },
        ];
    }
    if (tableName === 'Maquinas') {
        return [
            { id: 101, serie: 'SERIE-001', modelo: 'MODELO-X', marca: 'MARCA-A', id_planta: 1 },
            { id: 102, serie: 'SERIE-002', modelo: 'MODELO-Y', marca: 'MARCA-B', id_planta: 1 },
        ];
    }
    // Default to empty array for other tables
    return [];
};


// --- TOOL DECLARATIONS FOR GEMINI ---
export const executeQueryOnDatabase_Gemini: FunctionDeclaration = {
  name: 'executeQueryOnDatabase',
  description: 'Ejecuta una consulta SELECT para obtener datos específicos de una tabla.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      tableName: { type: Type.STRING, description: 'El nombre de la tabla de la base de datos a consultar.' },
      columns: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Un array de nombres de columnas a seleccionar. Si está vacío, selecciona todas.' },
      conditions: { type: Type.STRING, description: 'Condiciones de filtrado en formato SQL WHERE clause (ej. "id = 1" o "estado = true").' },
      limit: { type: Type.NUMBER, description: 'Número máximo de filas a devolver.' },
    },
    required: ['tableName'],
  },
};

export const getAggregateData_Gemini: FunctionDeclaration = {
  name: 'getAggregateData',
  description: 'Ejecuta consultas de agregación (COUNT, SUM, AVG) en una tabla y devuelve los resultados.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      tableName: { type: Type.STRING, description: 'El nombre de la tabla de la base de datos a consultar.' },
      aggregateFunction: { type: Type.STRING, description: 'La función de agregación a usar (ej. "COUNT", "SUM", "AVG").' },
      aggregateColumn: { type: Type.STRING, description: 'La columna sobre la que se aplicará la función de agregación.' },
      groupByColumn: { type: Type.STRING, description: 'Columna opcional para agrupar los resultados.' },
      conditions: { type: Type.STRING, description: 'Condiciones de filtrado en formato SQL WHERE clause (ej. "id = 1" o "estado = true").' },
    },
    required: ['tableName', 'aggregateFunction', 'aggregateColumn'],
  },
};

export const performAction_Gemini: FunctionDeclaration = {
  name: 'performAction',
  description: 'Realiza una acción de modificación de datos (INSERT o UPDATE) en una tabla específica.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      actionType: { type: Type.STRING, enum: ['INSERT', 'UPDATE'], description: 'Tipo de acción a realizar.' },
      tableName: { type: Type.STRING, description: 'El nombre de la tabla en la que se realizará la acción.' },
      updates: { type: Type.STRING, description: 'Un objeto JSON stringificado con los datos a insertar o actualizar.' },
      conditions: { type: Type.STRING, description: 'Condiciones de filtrado en formato SQL WHERE clause para acciones UPDATE (ej. "id = 1").' },
    },
    required: ['actionType', 'tableName', 'updates'],
  },
};

export const callExternalAgentWithQuery_Gemini: FunctionDeclaration = {
  name: 'callExternalAgentWithQuery',
  description: 'Envía una consulta en lenguaje natural a un agente externo para obtener información de la base de datos.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'La consulta en lenguaje natural a enviar al agente externo.' },
    },
    required: ['query'],
  },
};

export const callExternalAgentWithData_Gemini: FunctionDeclaration = {
  name: 'callExternalAgentWithData',
  description: 'Envía datos estructurados a un agente externo para realizar una operación de INSERT o UPDATE en la base de datos.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      data: { type: Type.OBJECT, description: 'El objeto JSON con los datos estructurados a enviar al agente externo.' },
    },
    required: ['data'],
  },
};

// --- TOOL DECLARATIONS FOR OPENAI (similar structure but slightly different definitions) ---
// OpenAI functions need `name`, `description`, and `parameters` where parameters follows JSON Schema
// The `function` property in the array in ChatContext.tsx is the actual function object for OpenAI.

// executeQueryOnDatabase
export const executeQueryOnDatabase_OpenAI = {
  name: 'executeQueryOnDatabase',
  description: 'Ejecuta una consulta SELECT para obtener datos específicos de una tabla.',
  parameters: {
    type: 'object',
    properties: {
      tableName: { type: 'string', description: 'El nombre de la tabla de la base de datos a consultar.' },
      columns: { type: 'array', items: { type: 'string' }, description: 'Un array de nombres de columnas a seleccionar. Si está vacío, selecciona todas.' },
      conditions: { type: 'string', description: 'Condiciones de filtrado en formato SQL WHERE clause (ej. "id = 1" o "estado = true").' },
      limit: { type: 'number', description: 'Número máximo de filas a devolver.' },
    },
    required: ['tableName'],
  },
};

// getAggregateData
export const getAggregateData_OpenAI = {
  name: 'getAggregateData',
  description: 'Ejecuta consultas de agregación (COUNT, SUM, AVG) en una tabla y devuelve los resultados.',
  parameters: {
    type: 'object',
    properties: {
      tableName: { type: 'string', description: 'El nombre de la tabla de la base de datos a consultar.' },
      aggregateFunction: { type: 'string', description: 'La función de agregación a usar (ej. "COUNT", "SUM", "AVG").' },
      aggregateColumn: { type: 'string', description: 'La columna sobre la que se aplicará la función de agregación.' },
      groupByColumn: { type: 'string', description: 'Columna opcional para agrupar los resultados.' },
      conditions: { type: 'string', description: 'Condiciones de filtrado en formato SQL WHERE clause (ej. "id = 1" o "estado = true").' },
    },
    required: ['tableName', 'aggregateFunction', 'aggregateColumn'],
  },
};

// performAction
export const performAction_OpenAI = {
  name: 'performAction',
  description: 'Realiza una acción de modificación de datos (INSERT o UPDATE) en una tabla específica.',
  parameters: {
    type: 'object',
    properties: {
      actionType: { type: 'string', enum: ['INSERT', 'UPDATE'], description: 'Tipo de acción a realizar.' },
      tableName: { type: 'string', description: 'El nombre de la tabla en la que se realizará la acción.' },
      updates: { type: 'string', description: 'Un objeto JSON stringificado con los datos a insertar o actualizar.' },
      conditions: { type: 'string', description: 'Condiciones de filtrado en formato SQL WHERE clause para acciones UPDATE (ej. "id = 1").' },
    },
    required: ['actionType', 'tableName', 'updates'],
  },
};

// callExternalAgentWithQuery
export const callExternalAgentWithQuery_OpenAI = {
  name: 'callExternalAgentWithQuery',
  description: 'Envía una consulta en lenguaje natural a un agente externo para obtener información de la base de datos.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'La consulta en lenguaje natural a enviar al agente externo.' },
    },
    required: ['query'],
  },
};

// callExternalAgentWithData
export const callExternalAgentWithData_OpenAI = {
  name: 'callExternalAgentWithData',
  description: 'Envía datos estructurados a un agente externo para realizar una operación de INSERT o UPDATE en la base de datos.',
  parameters: {
    type: 'object',
    properties: {
      data: { type: 'object', description: 'El objeto JSON con los datos estructurados a enviar al agente externo.' },
    },
    required: ['data'],
  },
};


// --- HELPER FUNCTION FOR CHATCONTEXT TO DISPATCH TOOL CALLS ---

interface FunctionCall {
  name: string;
  args: any;
  id?: string; // Optional ID for Gemini's tool calls
}

export async function handleFunctionExecution(
  functionCall: FunctionCall,
  supabase: SupabaseClient
): Promise<FunctionResponsePart | any> { // Return type might vary based on LLM (Gemini vs OpenAI)
  const { name, args, id } = functionCall;

  console.log(`Executing function: ${name} with args:`, args);

  // Helper to construct a consistent response for the LLM
  const createLLMResponse = (result: any) => ({
    functionResponse: {
      id: id || 'no-id-provided', // Provide a fallback if ID is missing
      name,
      response: { result: result },
    },
  });

  switch (name) {
    case 'executeQueryOnDatabase': {
      const { tableName, columns, conditions, limit } = args;
      if (!allTables.includes(tableName)) {
        return createLLMResponse({ error: `Tabla '${tableName}' no reconocida.` });
      }

      let query = supabase.from(tableName).select(columns?.length ? columns.join(',') : '*');
      if (conditions) {
        // This is a very basic, UNSAFE parsing. In a real app, this needs robust SQL injection prevention.
        // For demonstration, we assume safe inputs.
        // A better approach would be to parse `conditions` into Supabase's filter syntax.
        // For now, we'll just simulate.
        console.warn("WARNING: Direct SQL conditions parsing is unsafe for production. This is a placeholder.");
        // Example: if conditions were like `{ id: 1, status: 'active' }`, Supabase.eq could be used.
        // For string conditions, manual parsing or a dedicated parser would be needed.
      }
      if (limit) {
        query = query.limit(limit);
      }

      // Simulate the query result
      const { data, error } = await query;
      if (error) return createLLMResponse({ error: error.message });
      return createLLMResponse({ data });
    }

    case 'getAggregateData': {
      const { tableName, aggregateFunction, aggregateColumn, groupByColumn, conditions } = args;
      if (!allTables.includes(tableName)) {
        return createLLMResponse({ error: `Tabla '${tableName}' no reconocida.` });
      }

      // Supabase's `rpc` or direct `count` can be used for aggregation.
      // Simulating for now.
      const simulatedResult = simulateDbQuery(tableName, conditions, true);

      // In a real app:
      // let query;
      // if (aggregateFunction === 'COUNT') {
      //    query = supabase.from(tableName).select(`${aggregateColumn}, count`, { count: 'exact' });
      // }
      // // ... similar for SUM, AVG using rpc or group by + sum/avg
      // const { data, error } = await query;
      // if (error) return createLLMResponse({ error: error.message });
      // return createLLMResponse({ data });

      return createLLMResponse({ data: simulatedResult });
    }

    case 'performAction': {
      const { actionType, tableName, updates, conditions } = args;
      if (!allTables.includes(tableName)) {
        return createLLMResponse({ error: `Tabla '${tableName}' no reconocida.` });
      }
      
      let parsedUpdates: any;
      try {
        parsedUpdates = JSON.parse(updates);
      } catch (e: any) {
        return createLLMResponse({ error: `Datos de 'updates' inválidos: ${e.message}` });
      }

      let query;
      if(actionType === 'INSERT') {
          query = supabase.from(tableName).insert(parsedUpdates);
      } else if (actionType === 'UPDATE' && conditions) {
          // VERY unsafe, for demo only
          const [col, val] = conditions.split('=').map((s: string) => s.trim().replace(/'/g, ''));
          query = supabase.from(tableName).update(parsedUpdates).eq(col, val);
      } else {
          return createLLMResponse({ error: "Acción UPDATE requiere 'conditions'." });
      }

      const { data, error } = await query.select().single();
      
      if (error) return createLLMResponse({ error: error.message });
      return createLLMResponse({ status: 'success', data });
    }

    // callExternalAgentWithQuery and callExternalAgentWithData are handled in ChatContext directly
    // because they interact with the external agenteClient, not directly with Supabase via handleFunctionExecution.
    // However, for OpenAI's tool output format, ChatContext expects a 'content' string.
    // So, if these were to be used here (which they shouldn't be in the current design),
    // they would return the raw stringified result from the agent.
    
    default:
      return createLLMResponse({ error: `Función desconocida: ${name}` });
  }
}

// FIX: Removed non-standard JSON schema keyword 'placeholder' from the `responseSchema` definition for 'form' items.
// The `placeholder` is a UI hint defined in the `FormField` interface in `types.ts`, 
// and the AI's system instruction already clarifies its expected use.
// Including it directly in `responseSchema` can cause validation issues with certain JSON Schema parsers,
// leading to "Cannot redeclare block-scoped variable" errors if interpreted as a variable.
export const responseSchema = {
    type: Type.OBJECT,
    properties: {
        displayText: { type: Type.STRING },
        table: {
            type: Type.OBJECT,
            properties: {
                headers: { type: Type.ARRAY, items: { type: Type.STRING } },
                rows: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } },
            },
        },
        chart: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, enum: ['bar', 'pie'] },
                data: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, value: { type: Type.NUMBER } } } },
            },
        },
        actions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    label: { type: Type.STRING },
                    prompt: { type: Type.STRING },
                    style: { type: Type.STRING, enum: ['primary', 'secondary', 'danger'] },
                },
            },
        },
        form: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: ['text', 'select', 'checkbox'] },
                    name: { type: Type.STRING },
                    label: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['type', 'name', 'label'],
            },
        },
        statusDisplay: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                message: { type: Type.STRING },
                icon: { type: Type.STRING, enum: ['success', 'error', 'info', 'warning'] },
            },
        },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['displayText'],
};