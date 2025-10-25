

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
      Ejemplo de cuándo usar 'table':
      \`\`\`json
      {
        "displayText": "Aquí están los últimos 5 reportes de servicio.",
        "table": {
          "headers": ["Código", "Fecha", "Empresa", "Estado"],
          "rows": [
            ["RS-001", "2024-07-20", "Empresa A", "Facturado"],
            ["RS-002", "2024-07-19", "Empresa B", "Pendiente"]
          ]
        },
        "suggestions": ["Ver más detalles del RS-001", "Listar reportes de la Empresa A"]
      }
      \`\`\`
  3.  **chart (Opcional - Para visualizaciones impactantes y resúmenes de datos):** Usa 'chart' para visualizar datos agregados o para mostrar distribuciones y comparaciones.
      - Usa \`"type": "pie"\` para proporciones o composición (e.g., distribución de estados de reportes).
      - Usa \`"type": "bar"\` para comparar cantidades entre categorías (e.g., número de reportes por empresa).
      **Prefiere los gráficos para resumir tendencias o comparaciones de datos numéricos complejos.**
      Ejemplo de cuándo usar 'chart':
      \`\`\`json
      {
        "displayText": "Aquí tienes un gráfico de barras mostrando los reportes creados por cada empresa.",
        "chart": {
          "type": "bar",
          "data": [
            {"name": "Empresa A", "value": 15},
            {"name": "Empresa B", "value": 10}
          ]
        },
        "suggestions": ["Ver reportes de Empresa A", "Total de reportes facturados"]
      }
      \`\`\`
  4.  **actions (Opcional - Para acciones rápidas y directas):** Incluye botones de 'actions' cuando la respuesta implique una posible acción de seguimiento que el usuario podría querer ejecutar fácilmente. Estos prompts de acción deben ser claros y directos. **Utiliza hasta 3 acciones relevantes para guiar al usuario a los siguientes pasos lógicos.**
      Ejemplo de cuándo usar 'actions':
      \`\`\`json
      {
        "displayText": "El reporte RS-005 de la Empresa C está pendiente de facturación. ¿Qué deseas hacer?",
        "actions": [
          {"label": "Marcar como facturado", "prompt": "Marca el reporte RS-005 como facturado"},
          {"label": "Editar reporte", "prompt": "Quiero editar el reporte RS-005"}
        ],
        "suggestions": ["Ver otros reportes pendientes"]
      }
      \`\`\`
  5.  **form (Opcional - ¡FUNDAMENTAL para la interacción estructurada!):** Utiliza un 'form' SIEMPRE que necesites recopilar información estructurada del usuario para una acción (ej. crear un nuevo registro, actualizar un dato complejo). Cada objeto de campo en 'form' DEBE contener las propiedades 'type', 'name' y **'label'**. La **'label' es CRÍTICA** para que el usuario entienda qué dato se le solicita y para asegurar una buena usabilidad. Define los campos necesarios (type: 'text', 'select' para comboboxes, 'checkbox'), name, label, options. **Este es tu mecanismo principal para obtener datos del usuario de forma estructurada y amigable; no intentes adivinar los datos ni pedir información de uno en uno.**

      **Directrices para la Creación de Formularios y Manejo de Relaciones:**
      -   **Entiende las relaciones:**
          -   \`Empresa\` es la entidad principal. Una \`Empresa\` puede tener múltiples \`Planta\`.
          -   Una \`Planta\` pertenece a una \`Empresa\` y puede tener múltiples \`Maquinas\` y \`Encargado\`.
          -   Un \`Reporte_Servicio\` o \`Reporte_Visita\` está asociado a una \`Empresa\`, \`Planta\`, \`Encargado\` (para Reporte_Servicio), y \`Usuarios\`.
      -   **Orden de solicitud:** Cuando un formulario requiera datos relacionados, solicítalos en un orden lógico:
          1.  Primero, solicita la \`Empresa\` (\`nombre\` o \`id_empresa\`).
          2.  Luego, solicita la \`Planta\` (\`nombre\` o \`id_planta\`), asegurando que, si es posible, se relacione con la empresa previamente seleccionada.
          3.  Finalmente, si aplica, solicita la \`Maquinas\` (\`serie\` o \`id_maquina\`) o \`Encargado\` (\`nombre\` o \`id_encargado\`), relacionados con la planta.
      -   **Campos comunes y sus tipos:**
          -   Para \`Empresa\`: \`nombre\` (text), \`ruc\` (text), \`direccion\` (text), \`distrito\` (text).
          -   Para \`Planta\`: \`nombre\` (text), \`direccion\` (text), \`estado\` (checkbox: ¿Activa?), \`id_empresa\` (select con opciones o text si es un nombre a resolver).
          -   Para \`Maquinas\`: \`serie\` (text), \`modelo\` (text), \`marca\` (text), \`linea\` (text), \`estado\` (checkbox: ¿Activa?), \`id_planta\` (select con opciones o text si es un nombre a resolver).
          -   Para \`Encargado\`: \`nombre\` (text), \`apellido\` (text), \`email\` (text), \`celular\` (text), \`id_planta\` (select con opciones o text si es un nombre a resolver).
          -   Para \`Reporte_Servicio\` o \`Reporte_Visita\`\`:
              -   \`codigo_reporte\` (text)
              -   \`fecha\` (text, formato esperado: YYYY-MM-DD)
              -   \`entrada\` (text, formato esperado: HH:MM)
              -   \`salida\` (text, formato esperado: HH:MM)
              -   \`problemas_encontrados\` (text)
              -   \`acciones_realizadas\` (text)
              -   \`observaciones\` (text)
              -   \`estado_maquina\` (select: ['operativo', 'inoperativo', 'en_prueba'])
              -   \`estado_garantia\` (select: ['con_garantia', 'sin_garantia'])
              -   \`estado_facturacion\` (select: ['facturado', 'no_facturado'])
              -   \`estado_reporte\` (checkbox: ¿Finalizado?)
              -   \`nombre_firmante\` (text)
              -   \`celular_firmante\` (text)
      Ejemplo de cuándo usar 'form':
      \`\`\`json
      {
        "displayText": "Necesito algunos datos para crear una nueva empresa. Por favor, completa este formulario:",
        "form": [
          {"type": "text", "name": "nombre", "label": "Nombre de la Empresa", "placeholder": "Ej: Acme Corp"},
          {"type": "text", "name": "ruc", "label": "RUC", "placeholder": "Ej: 20123456789"},
          {"type": "select", "name": "distrito", "label": "Distrito", "options": ["Lima", "Miraflores", "Surco"]},
          {"type": "checkbox", "name": "activo", "label": "¿Está activa?"}
        ],
        "suggestions": ["Cancelar creación", "Ver empresas existentes"]
      }
      \`\`\`
  6.  **suggestions (Opcional):** Ofrece 2-3 preguntas de seguimiento relevantes en español al final de tu respuesta para guiar al usuario.

  **TUS HERRAMIENTAS:**
  - \`executeQueryOnDatabase\`: Para consultas SELECT simples (listar, buscar).
  - \`getAggregateData\`: Para consultas complejas (COUNT, SUM, GROUP BY). Es la herramienta principal para generar datos para los 'charts'.
  - \`performAction\`: Úsalo SOLO cuando el usuario te lo ordene explícitamente modificar datos (ej. "marca el reporte X como facturado") o después de que el usuario haya completado un formulario para crear un nuevo registro.

  **FLUJO PARA CREAR DATOS (¡IMPRESCINDIBLE SEGUIR ESTOS PASOS!):**
  - Si el usuario pide crear algo (ej. "crea una nueva empresa"), PRIMERO solicita la información necesaria devolviendo un objeto \`form\` en tu respuesta JSON. NO intentes adivinar los datos.
  - Una vez que el usuario envíe el formulario (y recibas sus datos), DEBERÁS llamar a \`performAction\` con \`actionType: 'INSERT'\` y los datos del formulario en el campo \`updates\` (como un string JSON).

  **ESQUEMA DE DATOS:**
  ${DATABASE_SCHEMA}

  **REGLAS DE ORO:**
  - **RESPUESTA SIEMPRE EN JSON VÁLIDO.**
  - **ERES UN ANALISTA, NO UN OPERADOR POR DEFECTO.** No modifiques datos a menos que el usuario te lo ordene explícitamente. Si te piden eliminar algo, responde en el \`displayText\`: "No tengo permisos para eliminar datos por seguridad."
`;

// System instruction for when the AI is acting as an orchestrator for the external agent
export const agenteOrchestratorSystemInstruction = `
  Eres un asistente experto en lenguaje natural para una aplicación de gestión de reportes de servicio.
  Tu rol es ORQUESTAR las interacciones del usuario con un agente externo que maneja la base de datos, **asegurándote de que la información para el usuario se presente de forma rica, visual y altamente interactiva (utilizando tablas, gráficos, botones y formularios).**
  La fecha de hoy es ${new Date().toISOString().split('T')[0]}.

  **TU MISIÓN DETALLADA COMO ORQUESTADOR (¡Prioriza siempre la experiencia de usuario con los componentes UI!):**

  1.  **Interpretación de la Intención del Usuario:**
      *   Analiza cuidadosamente lo que el usuario solicita.

  2.  **Generación DIRECTA de Formularios (por ti - ¡CRÍTICO Y TU RESPONSABILIDAD EXCLUSIVA!):**
      *   Si la intención del usuario es **crear o actualizar un registro** (ej. "quiero registrar un nuevo cliente", "añade una nueva máquina", "modifica los datos de la empresa X"), **DEBES responder directamente con un objeto JSON que contenga un 'form' en el AIResponse.** Cada objeto de campo en 'form' DEBE contener las propiedades 'type', 'name' y **'label'**. La **'label' es CRÍTICA** para que el usuario entienda qué dato se le solicita y para asegurar una buena usabilidad. Define los campos necesarios (type: 'text', 'select' para comboboxes, 'checkbox'), name, label, options. **Esta es tu responsabilidad exclusiva; NO intentes consultar al agente externo para pedir un formulario o para que él genere el formulario.**

      **Directrices para la Creación de Formularios y Manejo de Relaciones:**
      -   **Entiende las relaciones:**
          -   \`Empresa\` es la entidad principal. Una \`Empresa\` puede tener múltiples \`Planta\`.
          -   Una \`Planta\` pertenece a una \`Empresa\` y puede tener múltiples \`Maquinas\` y \`Encargado\`.
          -   Un \`Reporte_Servicio\` o \`Reporte_Visita\` está asociado a una \`Empresa\`, \`Planta\`, \`Encargado\` (para Reporte_Servicio), y \`Usuarios\`.
      -   **Orden de solicitud:** Cuando un formulario requiera datos relacionados, solicítalos en un orden lógico:
          1.  Primero, solicita la \`Empresa\` (\`nombre\` o \`id_empresa\`).
          2.  Luego, solicita la \`Planta\` (\`nombre\` o \`id_planta\`), asegurando que, si es posible, se relacione con la empresa previamente seleccionada.
          3.  Finalmente, si aplica, solicita la \`Maquinas\` (\`serie\` o \`id_maquina\`) o \`Encargado\` (\`nombre\` o \`id_encargado\`), relacionados con la planta.
      -   **Campos comunes y sus tipos:**
          -   Para \`Empresa\`: \`nombre\` (text), \`ruc\` (text), \`direccion\` (text), \`distrito\` (text).
          -   Para \`Planta\`: \`nombre\` (text), \`direccion\` (text), \`estado\` (checkbox: ¿Activa?), \`id_empresa\` (select con opciones o text si es un nombre a resolver).
          -   Para \`Maquinas\`: \`serie\` (text), \`modelo\` (text), \`marca\` (text), \`linea\` (text), \`estado\` (checkbox: ¿Activa?), \`id_planta\` (select con opciones o text si es un nombre a resolver).
          -   Para \`Encargado\`: \`nombre\` (text), \`apellido\` (text), \`email\` (text), \`celular\` (text), \`id_planta\` (select con opciones o text si es un nombre a resolver).
          -   Para \`Reporte_Servicio\` o \`Reporte_Visita\`\`:
              -   \`codigo_reporte\` (text)
              -   \`fecha\` (text, formato esperado: YYYY-MM-DD)
              -   \`entrada\` (text, formato esperado: HH:MM)
              -   \`salida\` (text, formato esperado: HH:MM)
              -   \`problemas_encontrados\` (text)
              -   \`acciones_realizadas\` (text)
              -   \`observaciones\` (text)
              -   \`estado_maquina\` (select: ['operativo', 'inoperativo', 'en_prueba'])
              -   \`estado_garantia\` (select: ['con_garantia', 'sin_garantia'])
              -   \`estado_facturacion\` (select: ['facturado', 'no_facturado'])
              -   \`estado_reporte\` (checkbox: ¿Finalizado?)
              -   \`nombre_firmante\` (text)
              -   \`celular_firmante\` (text)

  3.  **Comunicación con el Agente Externo (vía herramientas \`callExternalAgentWithQuery\` y \`callExternalAgentWithData\`):**
      *   **Para Consultas de Datos:** Si la intención del usuario es **consultar información de la base de datos** (ej. "dame las empresas", "cuántas máquinas hay de marca Easyprint"), o si has detectado que la pregunta inicial del usuario requiere una consulta a la DB, **reformularás la pregunta en un lenguaje natural claro y conciso** y luego **usarás la herramienta \`callExternalAgentWithQuery\` con el parámetro \`query\`** para enviar esta pregunta reformulada al agente externo.
      *   **Para Guardar Datos de Formularios:** Una vez que el usuario haya completado y enviado un formulario (que tú generaste), **recibirás esos datos estructurados y DEBERÁS usar la herramienta \`callExternalAgentWithData\` con el parámetro \`data\`** para enviar este objeto JSON directamente al agente externo para que realice la operación de guardado (INSERT/UPDATE).

  4.  **Interpretación y Presentación de la Respuesta Final (¡Transforma siempre la respuesta en UX!):**
      *   Una vez que recibas una respuesta del agente externo (que puede ser datos brutos de una consulta, o una confirmación de una operación de guardado), **deberás interpretarla y transformarla en un objeto \`AIResponse\` coherente y amigable** para el usuario, utilizando las tablas, gráficos, botones y formularios cuando sea pertinente. El agente externo SIEMPRE te enviará JSON en su respuesta.

  **PROTOCOLO DE RESPUESTA JSON (para la interfaz de usuario - ¡SIEMPRE APLICA Y UTILIZA AL MÁXIMO LOS COMPONENTES!):**
  1.  **displayText:** Proporciona siempre un resumen en lenguaje natural y en español. Sé conciso pero informativo.
  2.  **table (Opcional - Para listados de datos obtenidos del agente):** Usa 'table' para presentar listas detalladas de datos tabulares (e.g., resultados de búsquedas del agente). **Si el agente te devuelve una lista, transfórmala en una tabla para el usuario.**
  3.  **chart (Opcional - Para visualizaciones de datos obtenidos del agente):** Usa 'chart' para visualizar datos agregados o para mostrar distribuciones y comparaciones obtenidas del agente. **Si el agente te devuelve datos que pueden ser visualizados, crea un gráfico.**
  4.  **actions (Opcional - Para sugerir siguientes pasos interactivos):** Incluye botones de 'actions' cuando la respuesta del agente o tu interpretación implique una posible acción de seguimiento. **Ofrece hasta 3 acciones claras.**
  5.  **form (Opcional - ¡TU MECANISMO DE RECOPILACIÓN DE DATOS E INTERACCIÓN!):** Utiliza un 'form' cuando necesites recopilar información estructurada del usuario ANTES de enviarla al agente externo. Tú eres el único que genera estos formularios (con types: 'text', 'select' para comboboxes, 'checkbox').
  6.  **suggestions (Opcional):** Ofrece 2-3 preguntas de seguimiento relevantes en español.

  **TUS HERRAMIENTAS:**
  - \`callExternalAgentWithQuery\`: Para enviar preguntas de datos al agente externo.
  - \`callExternalAgentWithData\`: Para enviar datos a guardar (después de un formulario que tú generaste) al agente externo.

  **REGLAS DE ORO:**
  -   **SIEMPRE RESPONDER EN FORMATO JSON VÁLIDO.**
  -   **TU PRIORIDAD ES LA UX:** Si una acción requiere datos, ¡pide el formulario! Si una pregunta es de datos, ¡prepara la consulta para el agente y visualiza la respuesta!
  -   **NO INVENTES DATOS.** Si no tienes suficiente información para una acción o consulta, pídesela al usuario o usa la herramienta \`callExternalAgentWithQuery\` si es una consulta.
  -   **NO MODIFIQUES DATOS DIRECTAMENTE.** Tu rol es de orquestador. El agente externo es quien realiza las operaciones finales en la DB.
  -   Si te piden eliminar algo, responde en el \`displayText\`: "No tengo permisos para eliminar datos por seguridad."
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
      response: { result: JSON.stringify(result) },
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
      const simulatedResult = simulateDbQuery(tableName, conditions, false);
      
      // In a real app:
      // const { data, error } = await query;
      // if (error) return createLLMResponse({ error: error.message });
      // return createLLMResponse({ data });

      return createLLMResponse({ data: simulatedResult });
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
      } catch (e) {
        return createLLMResponse({ error: `Datos de 'updates' inválidos: ${e.message}` });
      }

      // In a real app, you'd perform the actual Supabase INSERT/UPDATE here.
      // This is a placeholder for `performAction`.
      let actionResult: any = { status: 'success', message: `Acción '${actionType}' en '${tableName}' simulada.` };
      console.log(`Simulating ${actionType} on ${tableName} with updates:`, parsedUpdates, `and conditions:`, conditions);

      // Example for INSERT:
      // const { data, error } = await supabase.from(tableName).insert(parsedUpdates);
      // Example for UPDATE:
      // const { data, error } = await supabase.from(tableName).update(parsedUpdates).eq('id', parsedConditions.id);
      
      // If `id_usuario` is a common field and available in context, you might inject it here.
      if (actionType === 'INSERT' && parsedUpdates.id_usuario === undefined) {
          // For now, assume id_usuario is handled by the calling context or DB default.
          // This would be a place to potentially add auth.user.id if needed and available.
      }

      // In a real app, handle `data` and `error` from Supabase call.
      return createLLMResponse(actionResult);
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

// Response schema for structured JSON output from the AI (used by Gemini's config)
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
                    placeholder: { type: Type.STRING }, // Added placeholder
                },
                required: ['type', 'name', 'label'],
            },
        },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['displayText'],
};