"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseSchema = exports.callExternalAgentWithData_OpenAI = exports.callExternalAgentWithQuery_OpenAI = exports.performAction_OpenAI = exports.getAggregateData_OpenAI = exports.executeQueryOnDatabase_OpenAI = exports.callExternalAgentWithData_Gemini = exports.callExternalAgentWithQuery_Gemini = exports.performAction_Gemini = exports.getAggregateData_Gemini = exports.executeQueryOnDatabase_Gemini = exports.agenteOrchestratorSystemInstruction = exports.directSupabaseSystemInstruction = void 0;
exports.handleFunctionExecution = handleFunctionExecution;
var genai_1 = require("@google/genai");
var allTables = [
    'Reporte_Servicio', 'Reporte_Visita', 'Empresa', 'Planta', 'Maquinas', 'Encargado',
    'Usuarios', 'Roles', 'Configuracion', 'role_permissions'
];
var DATABASE_SCHEMA = "\n  - Reporte_Servicio:\n    - id (PK), codigo_reporte (TEXT), fecha (DATE), entrada (TIME), salida (TIME), problemas_encontrados (TEXT), acciones_realizadas (TEXT), observaciones (TEXT), estado_maquina (ENUM: 'operativo', 'inoperativo', 'en_prueba'), estado_garantia (ENUM: 'con_garantia', 'sin_garantia'), facturado (BOOLEAN), no_facturado (BOOLEAN), estado (BOOLEAN: finalizado/en_progreso), fotos_problemas_encontrados_url (TEXT[]), fotos_acciones_realizadas_url (TEXT[]), fotos_observaciones_url (TEXT[]), foto_firma_url (TEXT), nombre_firmante (TEXT), celular_firmante (TEXT), id_empresa (FK -> Empresa.id), id_planta (FK -> Planta.id), id_encargado (FK -> Encargado.id), id_usuario (FK -> Usuarios.id), url_pdf (TEXT)\n    - Relaciones: Empresa (id_empresa), Planta (id_planta), Encargado (id_encargado), Usuarios (id_usuario)\n\n  - Reporte_Visita:\n    - id (PK), codigo_reporte (TEXT), fecha (DATE), motivo_visita (TEXT), temas_tratados (TEXT), acuerdos (TEXT), pendientes (TEXT), observaciones (TEXT), nombre_firmante (TEXT), id_empresa (FK -> Empresa.id), id_planta (FK -> Planta.id), id_encargado (FK -> Encargado.id), id_usuario (FK -> Usuarios.id), url_pdf (TEXT)\n    - Relaciones: Empresa (id_empresa), Planta (id_planta), Encargado (id_encargado), Usuarios (id_usuario)\n\n  - Empresa:\n    - id (PK), nombre (TEXT), ruc (TEXT), direccion (TEXT), distrito (TEXT), estado (BOOLEAN)\n\n  - Planta:\n    - id (PK), nombre (TEXT), direccion (TEXT), estado (BOOLEAN), id_empresa (FK -> Empresa.id)\n    - Relaciones: Empresa (id_empresa)\n\n  - Maquinas:\n    - id (PK), serie (TEXT), modelo (TEXT), marca (TEXT), linea (TEXT), estado (BOOLEAN), id_planta (FK -> Planta.id), id_empresa (FK -> Empresa.id)\n    - Relaciones: Planta (id_planta), Empresa (id_empresa)\n\n  - Encargado:\n    - id (PK), nombre (TEXT), apellido (TEXT), email (TEXT), celular (TEXT), id_planta (FK -> Planta.id), id_empresa (FK -> Empresa.id)\n    - Relaciones: Planta (id_planta), Empresa (id_empresa)\n\n  - Usuarios:\n    - id (PK), nombres (TEXT), email (TEXT), rol (FK -> Roles.id), dni (TEXT), celular (TEXT)\n    - Relaciones: Roles (rol)\n\n  - Roles:\n    - id (PK), nombre (TEXT)\n\n  - Configuracion:\n    - id (PK), key (TEXT), value (JSONB), id_usuario (FK -> Usuarios.id, puede ser NULL para configuraci\u00F3n global)\n    - Relaciones: Usuarios (id_usuario)\n\n  - role_permissions:\n    - role_id (FK -> Roles.id), permission_name (TEXT)\n    - Relaciones: Roles (role_id)\n";
// System instruction for when the AI is directly interacting with Supabase functions
exports.directSupabaseSystemInstruction = "\n  Eres un asistente experto y analista de datos para una aplicaci\u00F3n de gesti\u00F3n de reportes de servicio.\n  Tu misi\u00F3n es responder preguntas y ejecutar acciones consultando directamente la base de datos y DEVOLVER SIEMPRE UN OBJETO JSON estructurado seg\u00FAn el schema, **priorizando la presentaci\u00F3n de informaci\u00F3n en formatos visualmente atractivos y funcionales como tablas, gr\u00E1ficos, botones y formularios interactivos.**\n  La fecha de hoy es ".concat(new Date().toISOString().split('T')[0], ".\n\n  **PROTOCOLO DE RESPUESTA JSON (\u00A1UTILIZA TODOS LOS COMPONENTES POSIBLES PARA MEJOR UX!):**\n  1.  **displayText:** Proporciona siempre un resumen en lenguaje natural y en espa\u00F1ol. S\u00E9 conciso pero informativo.\n  2.  **table (Opcional - Para listados claros y organizados):** Usa 'table' para presentar listas detalladas de datos tabulares (e.g., resultados de b\u00FAsquedas, detalles de varios registros). **Siempre que la respuesta involucre una lista de 2 o m\u00E1s elementos con una estructura de datos repetitiva, pres\u00E9ntala como una tabla.**\n  3.  **chart (Opcional - Para visualizaciones impactantes y res\u00FAmenes de datos):** Usa 'chart' para visualizar datos agregados o para mostrar distribuciones y comparaciones.\n      - Usa `\"type\": \"pie\"` para proporciones o composici\u00F3n (e.g., distribuci\u00F3n de estados de reportes).\n      - Usa `\"type\": \"bar\"` para comparar cantidades entre categor\u00EDas (e.g., n\u00FAmero de reportes por empresa).\n      **Prefiere los gr\u00E1ficos para resumir tendencias o comparaciones de datos num\u00E9ricos complejos.**\n  4.  **actions (Opcional - Para acciones r\u00E1pidas y directas):** Incluye botones de 'actions' cuando la respuesta implique una posible acci\u00F3n de seguimiento que el usuario podr\u00EDa querer ejecutar f\u00E1cilmente. Estos prompts de acci\u00F3n deben ser claros y directos. **Utiliza hasta 3 acciones relevantes para guiar al usuario a los siguientes pasos l\u00F3gicos.**\n  5.  **form (Opcional - \u00A1FUNDAMENTAL para la interacci\u00F3n estructurada!):** El campo 'form' DEBE ser un **ARRAY de objetos**, donde cada objeto representa un campo del formulario. NO debe ser un solo objeto. Utiliza un 'form' SIEMPRE que necesites recopilar informaci\u00F3n estructurada del usuario para una acci\u00F3n (ej. crear un nuevo registro). Cada objeto de campo en 'form' DEBE contener las propiedades 'type', 'name' y **'label'**. La **'label' es CR\u00CDTICA** para que el usuario entienda qu\u00E9 dato se le solicita. Define los campos necesarios (type: 'text', 'select' para comboboxes, 'checkbox'), name, label, options y placeholder.\n  6.  **statusDisplay (Opcional - Para confirmaciones visuales):** Utiliza 'statusDisplay' para mostrar un mensaje de estado prominente y con un icono despu\u00E9s de que una acci\u00F3n de modificaci\u00F3n de datos (INSERT/UPDATE) se haya completado con \u00E9xito. Usa `\"icon\": \"success\"` para \u00E9xito y `\"icon\": \"error\"` para fallos.\n  7.  **suggestions (Opcional):** Ofrece 2-3 preguntas de seguimiento relevantes en espa\u00F1ol al final de tu respuesta para guiar al usuario.\n\n  **TUS HERRAMIENTAS:**\n  - `executeQueryOnDatabase`: Para consultas SELECT simples (listar, buscar).\n  - `getAggregateData`: Para consultas complexas (COUNT, SUM, GROUP BY). Es la herramienta principal para generar datos para los 'charts'.\n  - `performAction`: \u00DAsalo SOLO cuando el usuario te lo ordene expl\u00EDcitamente modificar datos o despu\u00E9s de que el usuario haya completado un formulario.\n\n  **FLUJO PARA CREAR/ACTUALIZAR DATOS (\u00A1IMPRESCINDIBLE SEGUIR ESTOS PASOS!):**\n  1.  Si el usuario pide crear/actualizar algo (ej. \"crea una nueva planta\", \"edita la m\u00E1quina X\"), analiza las dependencias de la tabla del esquema de datos. Por ejemplo, una 'Planta' necesita una 'id_empresa'.\n  2.  SI HAY DEPENDENCIAS que requieren una selecci\u00F3n (como seleccionar una empresa para una planta), PRIMERO USA la herramienta `executeQueryOnDatabase` para obtener la lista de opciones (ej. `executeQueryOnDatabase({tableName: 'Empresa', columns: ['id', 'nombre']})`).\n  3.  DESPU\u00C9S de obtener los datos de la herramienta, GENERA LA RESPUESTA JSON FINAL CON EL 'form'. El campo dependiente debe ser de `\"type\": \"select\"`. Sus `\"options\"` deben ser un array de strings, cada uno con el formato \"ID: Nombre\" (ej. [\"1: Empresa A\", \"2: Empresa B\"]). El `name` del campo debe ser el nombre de la columna de la clave for\u00E1nea (ej. \"id_empresa\").\n  4.  Una vez que el usuario env\u00EDe el formulario, recibir\u00E1s sus datos y DEBER\u00C1S llamar a `performAction` con `actionType: 'INSERT'` o `'UPDATE'`. En el `updates`, aseg\u00FArate de enviar el ID num\u00E9rico que el usuario seleccion\u00F3.\n\n  **ESQUEMA DE DATOS:**\n  ").concat(DATABASE_SCHEMA, "\n\n  **REGLAS DE ORO:**\n  - **RESPUESTA SIEMPRE EN JSON V\u00C1LIDO.**\n  - **ERES UN ANALISTA, NO UN OPERADOR POR DEFECTO.** No modifiques datos a menos que el usuario te lo ordene expl\u00EDcitamente. Si te piden eliminar algo, responde en el `displayText`: \"No tengo permisos para eliminar datos por seguridad.\"\n  - **SI NO PUEDES GENERAR UNA RESPUESTA SIGNIFICATIVA EN JSON, NO INTENTES DEVOLVER JSON MALFORMADO O VAC\u00CDO. EN SU LUGAR, DEJA QUE LA RESPUESTA SEA UN STRING SIMPLE CON UN MENSAJE DE ERROR CLARO EN ESPA\u00D1OL, QUE SER\u00C1 MANEJADO POR LA INTERFAZ DE USUARIO.**\n");
// System instruction for when the AI is acting as an orchestrator for the external agent
exports.agenteOrchestratorSystemInstruction = "\n  Eres un asistente experto en lenguaje natural para una aplicaci\u00F3n de gesti\u00F3n de reportes de servicio.\n  Tu rol es ORQUESTAR las interacciones del usuario con un agente externo que maneja la base de datos, **asegur\u00E1ndote de que la informaci\u00F3n para el usuario se presente de forma rica, visual y altamente interactiva (utilizando tablas, gr\u00E1ficos, botones y formularios).**\n  La fecha de hoy es ".concat(new Date().toISOString().split('T')[0], ".\n\n  **PROTOCOLO DE RESPUESTA JSON (para la interfaz de usuario - \u00A1SIEMPRE APLICA Y UTILIZA AL M\u00C1XIMO LOS COMPONENTENTES!):**\n  1.  **displayText:** Proporciona siempre un resumen en lenguaje natural y en espa\u00F1ol.\n  2.  **table (Opcional):** Usa 'table' para presentar listas de datos obtenidas del agente.\n  3.  **chart (Opcional):** Usa 'chart' para visualizar datos agregados obtenidos del agente.\n  4.  **actions (Opcional):** Incluye botones de 'actions' para sugerir siguientes pasos.\n  5.  **form (Opcional):** El campo 'form' DEBE ser un **ARRAY de objetos**. Utiliza un 'form' cuando necesites recopilar informaci\u00F3n del usuario ANTES de enviarla al agente externo. T\u00FA eres el \u00FAnico que genera estos formularios. Cada objeto de campo DEBE contener 'type', 'name' y 'label'.\n  6.  **statusDisplay (Opcional):** Utiliza 'statusDisplay' para mostrar un mensaje de estado prominente (\u00E9xito/error) despu\u00E9s de una operaci\u00F3n.\n  7.  **suggestions (Opcional):** Ofrece 2-3 preguntas de seguimiento.\n\n  **FLUJO PARA CREAR/ACTUALIZAR DATOS (\u00A1IMPRESCINDIBLE SEGUIR ESTOS PASOS!):**\n  1.  Si el usuario pide crear/actualizar algo (ej. \"crea una nueva planta\"), analiza las dependencias. Por ejemplo, una 'Planta' necesita una 'id_empresa'.\n  2.  SI HAY DEPENDENCIAS que requieren una selecci\u00F3n, PRIMERO USA la herramienta `callExternalAgentWithQuery` para obtener la lista de opciones (ej. `callExternalAgentWithQuery({query: \"dame el id y nombre de todas las empresas\"})`).\n  3.  Una vez recibida la respuesta del agente con los datos, genera la respuesta JSON final que incluya el 'form'. El campo dependiente debe ser de tipo \"select\". Sus \"options\" deben ser un array de strings con el formato \"ID: Nombre\" (ej. [\"1: Empresa A\", \"2: Empresa B\"]). El 'name' del campo debe ser el nombre de la columna de la clave for\u00E1nea (ej. \"id_empresa\").\n  4.  Cuando el usuario env\u00EDe el formulario que t\u00FA generaste, recibir\u00E1s los datos y DEBER\u00C1S usar la herramienta `callExternalAgentWithData`. Aseg\u00FArate de enviar el ID num\u00E9rico que el usuario seleccion\u00F3.\n\n  **TUS HERRAMIENTAS:**\n  - `callExternalAgentWithQuery`: Para enviar preguntas de datos al agente externo.\n  - `callExternalAgentWithData`: Para enviar datos a guardar (despu\u00E9s de un formulario que t\u00FA generaste) al agente externo.\n\n  **REGLAS DE ORO:**\n  -   **SIEMPRE RESPONDER EN FORMATO JSON V\u00C1LIDO.**\n  -   **TU PRIORIDAD ES LA UX:** Si una acci\u00F3n requiere datos, \u00A1pide el formulario! Si una pregunta es de datos, \u00A1prepara la consulta para el agente y visualiza la respuesta!\n  -   **NO MODIFIQUES DATOS DIRECTAMENTE.** Tu rol es de orquestador. El agente externo es quien realiza las operaciones finales en la DB.\n  -   Si te piden eliminar algo, responde en el `displayText`: \"No tengo permisos para eliminar datos por seguridad.\"\n  - **SI NO PUEDES GENERAR UNA RESPUESTA SIGNIFICATIVA EN JSON, NO INTENTES DEVOLVER JSON MALFORMADO O VAC\u00CDO. EN SU LUGAR, DEJA QUE LA RESPUESTA SEA UN STRING SIMPLE CON UN MENSAJE DE ERROR CLARO EN ESPA\u00D1OL, QUE SER\u00C1 MANEJADO POR LA INTERFAZ DE USUARIO.**\n");
// Helper to simulate complex database query results
var simulateDbQuery = function (tableName, conditions, isAggregate) {
    if (isAggregate === void 0) { isAggregate = false; }
    // This is a simplified simulation. In a real app, this would query Supabase.
    console.log("Simulating query on ".concat(tableName, " with conditions:"), conditions);
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
exports.executeQueryOnDatabase_Gemini = {
    name: 'executeQueryOnDatabase',
    description: 'Ejecuta una consulta SELECT para obtener datos específicos de una tabla.',
    parameters: {
        type: genai_1.Type.OBJECT,
        properties: {
            tableName: { type: genai_1.Type.STRING, description: 'El nombre de la tabla de la base de datos a consultar.' },
            columns: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING }, description: 'Un array de nombres de columnas a seleccionar. Si está vacío, selecciona todas.' },
            conditions: { type: genai_1.Type.STRING, description: 'Condiciones de filtrado en formato SQL WHERE clause (ej. "id = 1" o "estado = true").' },
            limit: { type: genai_1.Type.NUMBER, description: 'Número máximo de filas a devolver.' },
        },
        required: ['tableName'],
    },
};
exports.getAggregateData_Gemini = {
    name: 'getAggregateData',
    description: 'Ejecuta consultas de agregación (COUNT, SUM, AVG) en una tabla y devuelve los resultados.',
    parameters: {
        type: genai_1.Type.OBJECT,
        properties: {
            tableName: { type: genai_1.Type.STRING, description: 'El nombre de la tabla de la base de datos a consultar.' },
            aggregateFunction: { type: genai_1.Type.STRING, description: 'La función de agregación a usar (ej. "COUNT", "SUM", "AVG").' },
            aggregateColumn: { type: genai_1.Type.STRING, description: 'La columna sobre la que se aplicará la función de agregación.' },
            groupByColumn: { type: genai_1.Type.STRING, description: 'Columna opcional para agrupar los resultados.' },
            conditions: { type: genai_1.Type.STRING, description: 'Condiciones de filtrado en formato SQL WHERE clause (ej. "id = 1" o "estado = true").' },
        },
        required: ['tableName', 'aggregateFunction', 'aggregateColumn'],
    },
};
exports.performAction_Gemini = {
    name: 'performAction',
    description: 'Realiza una acción de modificación de datos (INSERT o UPDATE) en una tabla específica.',
    parameters: {
        type: genai_1.Type.OBJECT,
        properties: {
            actionType: { type: genai_1.Type.STRING, enum: ['INSERT', 'UPDATE'], description: 'Tipo de acción a realizar.' },
            tableName: { type: genai_1.Type.STRING, description: 'El nombre de la tabla en la que se realizará la acción.' },
            updates: { type: genai_1.Type.STRING, description: 'Un objeto JSON stringificado con los datos a insertar o actualizar.' },
            conditions: { type: genai_1.Type.STRING, description: 'Condiciones de filtrado en formato SQL WHERE clause para acciones UPDATE (ej. "id = 1").' },
        },
        required: ['actionType', 'tableName', 'updates'],
    },
};
exports.callExternalAgentWithQuery_Gemini = {
    name: 'callExternalAgentWithQuery',
    description: 'Envía una consulta en lenguaje natural a un agente externo para obtener información de la base de datos.',
    parameters: {
        type: genai_1.Type.OBJECT,
        properties: {
            query: { type: genai_1.Type.STRING, description: 'La consulta en lenguaje natural a enviar al agente externo.' },
        },
        required: ['query'],
    },
};
exports.callExternalAgentWithData_Gemini = {
    name: 'callExternalAgentWithData',
    description: 'Envía datos estructurados a un agente externo para realizar una operación de INSERT o UPDATE en la base de datos.',
    parameters: {
        type: genai_1.Type.OBJECT,
        properties: {
            data: { type: genai_1.Type.OBJECT, description: 'El objeto JSON con los datos estructurados a enviar al agente externo.' },
        },
        required: ['data'],
    },
};
// --- TOOL DECLARATIONS FOR OPENAI (similar structure but slightly different definitions) ---
// OpenAI functions need `name`, `description`, and `parameters` where parameters follows JSON Schema
// The `function` property in the array in ChatContext.tsx is the actual function object for OpenAI.
// executeQueryOnDatabase
exports.executeQueryOnDatabase_OpenAI = {
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
exports.getAggregateData_OpenAI = {
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
exports.performAction_OpenAI = {
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
exports.callExternalAgentWithQuery_OpenAI = {
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
exports.callExternalAgentWithData_OpenAI = {
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
function handleFunctionExecution(functionCall, supabase) {
    return __awaiter(this, void 0, void 0, function () {
        var name, args, id, createLLMResponse, _a, tableName, columns, conditions, limit, query, _b, data, error, tableName, aggregateFunction, aggregateColumn, groupByColumn, conditions, simulatedResult, actionType, tableName, updates, conditions, parsedUpdates, query, _c, col, val, _d, data, error;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    name = functionCall.name, args = functionCall.args, id = functionCall.id;
                    console.log("Executing function: ".concat(name, " with args:"), args);
                    createLLMResponse = function (result) { return ({
                        functionResponse: {
                            id: id || 'no-id-provided', // Provide a fallback if ID is missing
                            name: name,
                            response: { result: result },
                        },
                    }); };
                    _a = name;
                    switch (_a) {
                        case 'executeQueryOnDatabase': return [3 /*break*/, 1];
                        case 'getAggregateData': return [3 /*break*/, 3];
                        case 'performAction': return [3 /*break*/, 4];
                    }
                    return [3 /*break*/, 6];
                case 1:
                    tableName = args.tableName, columns = args.columns, conditions = args.conditions, limit = args.limit;
                    if (!allTables.includes(tableName)) {
                        return [2 /*return*/, createLLMResponse({ error: "Tabla '".concat(tableName, "' no reconocida.") })];
                    }
                    query = supabase.from(tableName).select((columns === null || columns === void 0 ? void 0 : columns.length) ? columns.join(',') : '*');
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
                    return [4 /*yield*/, query];
                case 2:
                    _b = _e.sent(), data = _b.data, error = _b.error;
                    if (error)
                        return [2 /*return*/, createLLMResponse({ error: error.message })];
                    return [2 /*return*/, createLLMResponse({ data: data })];
                case 3:
                    {
                        tableName = args.tableName, aggregateFunction = args.aggregateFunction, aggregateColumn = args.aggregateColumn, groupByColumn = args.groupByColumn, conditions = args.conditions;
                        if (!allTables.includes(tableName)) {
                            return [2 /*return*/, createLLMResponse({ error: "Tabla '".concat(tableName, "' no reconocida.") })];
                        }
                        simulatedResult = simulateDbQuery(tableName, conditions, true);
                        // In a real app:
                        // let query;
                        // if (aggregateFunction === 'COUNT') {
                        //    query = supabase.from(tableName).select(`${aggregateColumn}, count`, { count: 'exact' });
                        // }
                        // // ... similar for SUM, AVG using rpc or group by + sum/avg
                        // const { data, error } = await query;
                        // if (error) return createLLMResponse({ error: error.message });
                        // return createLLMResponse({ data });
                        return [2 /*return*/, createLLMResponse({ data: simulatedResult })];
                    }
                    _e.label = 4;
                case 4:
                    actionType = args.actionType, tableName = args.tableName, updates = args.updates, conditions = args.conditions;
                    if (!allTables.includes(tableName)) {
                        return [2 /*return*/, createLLMResponse({ error: "Tabla '".concat(tableName, "' no reconocida.") })];
                    }
                    parsedUpdates = void 0;
                    try {
                        parsedUpdates = JSON.parse(updates);
                    }
                    catch (e) {
                        return [2 /*return*/, createLLMResponse({ error: "Datos de 'updates' inv\u00E1lidos: ".concat(e.message) })];
                    }
                    query = void 0;
                    if (actionType === 'INSERT') {
                        query = supabase.from(tableName).insert(parsedUpdates);
                    }
                    else if (actionType === 'UPDATE' && conditions) {
                        _c = conditions.split('=').map(function (s) { return s.trim().replace(/'/g, ''); }), col = _c[0], val = _c[1];
                        query = supabase.from(tableName).update(parsedUpdates).eq(col, val);
                    }
                    else {
                        return [2 /*return*/, createLLMResponse({ error: "Acción UPDATE requiere 'conditions'." })];
                    }
                    return [4 /*yield*/, query.select().single()];
                case 5:
                    _d = _e.sent(), data = _d.data, error = _d.error;
                    if (error)
                        return [2 /*return*/, createLLMResponse({ error: error.message })];
                    return [2 /*return*/, createLLMResponse({ status: 'success', data: data })];
                case 6: return [2 /*return*/, createLLMResponse({ error: "Funci\u00F3n desconocida: ".concat(name) })];
            }
        });
    });
}
// FIX: Removed non-standard JSON schema keyword 'placeholder' from the `responseSchema` definition for 'form' items.
// The `placeholder` is a UI hint defined in the `FormField` interface in `types.ts`, 
// and the AI's system instruction already clarifies its expected use.
// Including it directly in `responseSchema` can cause validation issues with certain JSON Schema parsers,
// leading to "Cannot redeclare block-scoped variable" errors if interpreted as a variable.
exports.responseSchema = {
    type: genai_1.Type.OBJECT,
    properties: {
        displayText: { type: genai_1.Type.STRING },
        table: {
            type: genai_1.Type.OBJECT,
            properties: {
                headers: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING } },
                rows: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING } } },
            },
        },
        chart: {
            type: genai_1.Type.OBJECT,
            properties: {
                type: { type: genai_1.Type.STRING, enum: ['bar', 'pie'] },
                data: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.OBJECT, properties: { name: { type: genai_1.Type.STRING }, value: { type: genai_1.Type.NUMBER } } } },
            },
        },
        actions: {
            type: genai_1.Type.ARRAY,
            items: {
                type: genai_1.Type.OBJECT,
                properties: {
                    label: { type: genai_1.Type.STRING },
                    prompt: { type: genai_1.Type.STRING },
                    style: { type: genai_1.Type.STRING, enum: ['primary', 'secondary', 'danger'] },
                },
            },
        },
        form: {
            type: genai_1.Type.ARRAY,
            items: {
                type: genai_1.Type.OBJECT,
                properties: {
                    type: { type: genai_1.Type.STRING, enum: ['text', 'select', 'checkbox'] },
                    name: { type: genai_1.Type.STRING },
                    label: { type: genai_1.Type.STRING },
                    options: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING } },
                },
                required: ['type', 'name', 'label'],
            },
        },
        statusDisplay: {
            type: genai_1.Type.OBJECT,
            properties: {
                title: { type: genai_1.Type.STRING },
                message: { type: genai_1.Type.STRING },
                icon: { type: genai_1.Type.STRING, enum: ['success', 'error', 'info', 'warning'] },
            },
        },
        suggestions: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING } },
    },
    required: ['displayText'],
};
