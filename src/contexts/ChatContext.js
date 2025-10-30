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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChat = exports.ChatProvider = void 0;
var react_1 = require("react");
var SupabaseContext_1 = require("./SupabaseContext");
var AiServiceContext_1 = require("./AiServiceContext");
var aiService_1 = require("../services/aiService");
var ChatContext = (0, react_1.createContext)(undefined);
var WELCOME_MESSAGE = {
    sender: 'ai',
    content: {
        displayText: '¡Hola! Soy tu asistente de datos. ¿En qué puedo ayudarte hoy?',
        suggestions: ["Muéstrame los 5 reportes de servicio más recientes", "¿Cuántas empresas hay en total?", "Crea un gráfico de reportes por empresa"]
    }
};
// Constants for retry logic
var MAX_AGENT_RETRIES = 4; // 1 initial attempt + 4 retries = 5 total attempts
var RETRY_DELAY_MS = 1000; // Base delay in milliseconds
// Helper for delays
var sleep = function (ms) { return new Promise(function (resolve) { return setTimeout(resolve, ms); }); };
/**
 * Extracts and parses a JSON object from a string.
 * It first tries to parse the string directly. If that fails, it looks for a JSON
 * objeto wrapped in markdown code fences (```json ... ```) and attempts to parse that.
 * @param text The string that may contain a JSON object.
 * @returns The parsed AIResponse object, or null if no valid JSON is found.
 */
var extractAndParseJson = function (text) {
    try {
        return JSON.parse(text);
    }
    catch (e) {
        var jsonMatch = text.match(/```(json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[2]) {
            try {
                return JSON.parse(jsonMatch[2]);
            }
            catch (innerError) {
                console.error("Failed to parse extracted JSON block:", innerError);
                return null;
            }
        }
    }
    return null;
};
/**
 * Helper to safely stringify values for table display, handling objects/arrays and dates.
 * @param value The value to stringify.
 * @returns A string representation of the value.
 */
var safeStringify = function (value) {
    if (value === null || value === undefined) {
        return 'N/A';
    }
    // Check for string-like dates/timestamps
    if (typeof value === 'string') {
        // More robust date detection including ISO strings (YYYY-MM-DD, ISO with Z, etc.)
        var dateRegex = /^(\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)?)$/;
        if (dateRegex.test(value)) {
            try {
                var date = new Date(value);
                if (!isNaN(date.getTime())) {
                    // Use es-ES locale for consistent formatting
                    return date.toLocaleString('es-ES', {
                        year: 'numeric', month: 'numeric', day: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                        hour12: false // 24-hour format
                    });
                }
            }
            catch (e) { /* ignore */ }
        }
        return value; // If it's a string but not a date, return as is.
    }
    // Handle objects/arrays
    if (typeof value === 'object') {
        // Try to get a common display property if it's an object with known keys
        if (value.nombre)
            return String(value.nombre);
        if (value.name)
            return String(value.name);
        if (value.id)
            return String(value.id);
        // Final fallback for complex objects/arrays, pretty print for readability
        return JSON.stringify(value, null, 2);
    }
    return String(value);
};
/**
 * Maps a raw JSON response from the external agent into a standardized AIResponse format.
 * This is crucial for displaying agent results consistently in the chat UI.
 * @param rawAgentResponse The raw JSON object received from the webhook.
 * @returns An AIResponse object.
 */
var mapAgentResponseToAIResponse = function (rawAgentResponse) {
    // Check for the specific agent structure first: { error, contexto, data }
    if (rawAgentResponse && typeof rawAgentResponse === 'object' && 'error' in rawAgentResponse && 'contexto' in rawAgentResponse && 'data' in rawAgentResponse) {
        var error = rawAgentResponse.error, contexto = rawAgentResponse.contexto, data = rawAgentResponse.data;
        if (error) {
            // Handle explicit error from the agent
            return {
                displayText: "El agente report\u00F3 un error: ".concat(contexto),
                statusDisplay: { icon: 'error', title: 'Error en la Operación', message: contexto },
                suggestions: ["¿Puedes reformular la pregunta?", "Verificar los datos de entrada"]
            };
        }
        // Handle success responses
        var suggestions = ["Listar todos los registros de esta tabla", "¿Qué más puedo hacer?"];
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
            var headers_1 = Object.keys(data[0]);
            var rows = data.map(function (item) { return headers_1.map(function (header) { return safeStringify(item[header]); }); });
            var table = { headers: headers_1, rows: rows };
            if (data.length === 1 && (String(contexto).toLowerCase().includes('creado') || String(contexto).toLowerCase().includes('actualizado'))) {
                // Single item, likely an INSERT/UPDATE result
                return {
                    displayText: "\u00A1Operaci\u00F3n completada con \u00E9xito! ".concat(contexto, "."),
                    statusDisplay: { icon: 'success', title: '¡Éxito!', message: contexto },
                    table: table,
                    suggestions: suggestions
                };
            }
            else {
                // Multiple items, likely a SELECT result
                return {
                    displayText: "".concat(contexto, ". Se encontraron ").concat(data.length, " registros."),
                    statusDisplay: { icon: 'info', title: 'Resultados Encontrados', message: "Se encontraron ".concat(data.length, " registros.") },
                    table: table,
                    suggestions: ["Ver detalles de un registro", "Filtrar los resultados"]
                };
            }
        }
        else if (Array.isArray(data) && data.length === 0) {
            // Empty result set
            return {
                displayText: "".concat(contexto, ". No se encontraron registros que coincidan con tu consulta."),
                statusDisplay: { icon: 'info', title: 'Sin Resultados', message: 'No se encontraron datos.' },
                suggestions: ["Intenta con una búsqueda más amplia", "¿Puedes verificar los filtros?"]
            };
        }
        else {
            // Success, but data is not in a recognizable array format. Display the message.
            return {
                displayText: "Operaci\u00F3n completada: ".concat(contexto),
                statusDisplay: { icon: 'success', title: 'Completado', message: contexto },
                suggestions: suggestions
            };
        }
    }
    // --- FALLBACK LOGIC for other response formats ---
    console.warn("La respuesta del agente no sigue la estructura {error, contexto, data}. Usando lógica de mapeo de fallback.");
    if (rawAgentResponse && typeof rawAgentResponse === 'object' && 'displayText' in rawAgentResponse) {
        return rawAgentResponse;
    }
    if (rawAgentResponse === null || typeof rawAgentResponse !== 'object') {
        return {
            displayText: "Recib\u00ED una respuesta inesperada del agente: ".concat(String(rawAgentResponse), "."),
            statusDisplay: { icon: 'error', title: 'Error Inesperado', message: 'La respuesta del agente no es válida o está vacía.' }
        };
    }
    // Fallback display logic
    var displayText = "El agente respondi\u00F3:\n```json\n".concat(JSON.stringify(rawAgentResponse, null, 2), "\n```");
    return {
        displayText: displayText,
        statusDisplay: { icon: 'info', title: 'Respuesta del Agente', message: 'Se recibió una respuesta en un formato no estándar.' }
    };
};
var ChatProvider = function (_a) {
    var children = _a.children;
    var supabase = (0, SupabaseContext_1.useSupabase)().supabase;
    var _b = (0, AiServiceContext_1.useAiService)(), service = _b.service, geminiClient = _b.geminiClient, openaiClient = _b.openaiClient, agenteClient = _b.agenteClient, isAgenteEnabled = _b.isAgenteEnabled, agenteWebhookUrl = _b.agenteWebhookUrl;
    var _c = (0, react_1.useState)(null), chat = _c[0], setChat = _c[1]; // Only used for Gemini's stateful chat
    var _d = (0, react_1.useState)([WELCOME_MESSAGE]), messages = _d[0], setMessages = _d[1];
    var _e = (0, react_1.useState)(false), isLoading = _e[0], setIsLoading = _e[1];
    var _f = (0, react_1.useState)(false), hasUnreadMessage = _f[0], setHasUnreadMessage = _f[1];
    // Effect to initialize or re-initialize chat session when service or isAgenteEnabled changes
    (0, react_1.useEffect)(function () {
        // Chat session (stateful) is only created for Gemini.
        // For 'openai' service, it's stateless, so no chat object is needed here.
        if (service === 'gemini' && geminiClient) {
            try {
                // Determine system instruction and tools based on whether the agent is enabled
                var geminiTools = isAgenteEnabled ?
                    [{ functionDeclarations: [aiService_1.callExternalAgentWithQuery_Gemini, aiService_1.callExternalAgentWithData_Gemini] }] :
                    [{ functionDeclarations: [aiService_1.executeQueryOnDatabase_Gemini, aiService_1.getAggregateData_Gemini, aiService_1.performAction_Gemini] }];
                var currentSystemInstruction = isAgenteEnabled ? aiService_1.agenteOrchestratorSystemInstruction : aiService_1.directSupabaseSystemInstruction;
                var newChat = geminiClient.chats.create({
                    model: 'gemini-2.5-pro', // Using a powerful model for reasoning.
                    config: {
                        tools: geminiTools,
                        systemInstruction: currentSystemInstruction,
                        temperature: 0.1,
                        responseMimeType: "application/json",
                        responseSchema: aiService_1.responseSchema,
                    }
                });
                setChat(newChat);
            }
            catch (e) {
                console.error("Failed to create Gemini chat session:", e);
                setChat(null);
            }
        }
        else {
            setChat(null); // Clear chat object if not Gemini
        }
        // Always reset messages to welcome message on service/agent config change
        setMessages([WELCOME_MESSAGE]);
    }, [service, geminiClient, isAgenteEnabled]);
    var sendMessage = (0, react_1.useCallback)(function (prompt) { return __awaiter(void 0, void 0, void 0, function () {
        var userMessage, formSubmissionPattern, jsonString, formData, tempLoadingMessageId_1, loadingMessageContent_1, rawAgentResponse_1, agentError_1, attempt, retryError_1, activeLLMClient, activeLLMModel, activeLlmTools, activeSystemInstruction, isLLMGemini_1, openaiMessagesHistory, isAgentModeSelected_1, responseFromLLM, completion, toolCalls, functionResponseProcessed, lastToolResponses_1, toolExecutionPromises, geminiFormattedToolResponses, newToolMessages, completion, finalResponseContent, parsedAIResponse, aiMessage_1, fallbackMessage_1, error_1, userFacingMessage, statusDisplay, errorMessage_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (prompt.trim() === '' || isLoading)
                        return [2 /*return*/];
                    userMessage = { sender: 'user', content: prompt };
                    setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [userMessage], false); });
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 23, 24, 25]);
                    if (!supabase)
                        throw new Error("La conexión a Supabase no está disponible.");
                    formSubmissionPattern = "El usuario ha completado el formulario con los siguientes datos: ";
                    if (!(isAgenteEnabled && agenteClient && prompt.startsWith(formSubmissionPattern))) return [3 /*break*/, 11];
                    console.log("Detectado envío de formulario. Procesando directamente con el agente externo...");
                    jsonString = prompt.substring(formSubmissionPattern.length, prompt.indexOf(". Procede a crear el registro en la base de datos."));
                    formData = void 0;
                    try {
                        formData = JSON.parse(jsonString);
                    }
                    catch (e) {
                        throw new Error("Formato JSON inválido en el envío del formulario: " + e.message);
                    }
                    tempLoadingMessageId_1 = Date.now().toString();
                    loadingMessageContent_1 = {
                        displayText: 'El asistente está procesando los datos del formulario y guardando el registro en la base de datos...',
                        statusDisplay: { icon: 'info', title: 'Procesando...', message: 'Enviando datos al agente externo...' }
                    };
                    setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [{ sender: 'ai', content: loadingMessageContent_1, tempId: tempLoadingMessageId_1 }], false); });
                    agentError_1 = null;
                    attempt = 0;
                    _a.label = 2;
                case 2:
                    if (!(attempt <= MAX_AGENT_RETRIES)) return [3 /*break*/, 10];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 9]);
                    return [4 /*yield*/, agenteClient.sendToAgent({ data: formData }, agenteWebhookUrl)];
                case 4:
                    rawAgentResponse_1 = _a.sent();
                    // Ensure the response is actually an object before returning
                    if (typeof rawAgentResponse_1 !== 'object' || rawAgentResponse_1 === null) {
                        throw new Error("Respuesta del agente externo no es un objeto JSON válido.");
                    }
                    agentError_1 = null; // Clear any previous errors on success
                    return [3 /*break*/, 10]; // Exit loop on success
                case 5:
                    retryError_1 = _a.sent();
                    agentError_1 = retryError_1; // Store the error
                    console.error("Intento ".concat(attempt + 1, "/").concat(MAX_AGENT_RETRIES + 1, " fallido para la llamada al agente con datos de formulario:"), retryError_1.message);
                    if (!(attempt < MAX_AGENT_RETRIES)) return [3 /*break*/, 7];
                    return [4 /*yield*/, sleep(RETRY_DELAY_MS * (attempt + 1))];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    agentError_1 = new Error("AGENT_EXTERNAL_FAILED_AFTER_RETRIES");
                    _a.label = 8;
                case 8: return [3 /*break*/, 9];
                case 9:
                    attempt++;
                    return [3 /*break*/, 2];
                case 10:
                    // After agent response (or all retries exhausted), replace the temporary message.
                    setMessages(function (prev) {
                        var newMessages = __spreadArray([], prev, true);
                        var tempMessageIndex = newMessages.findIndex(function (msg) { return msg.tempId === tempLoadingMessageId_1; });
                        if (tempMessageIndex !== -1) {
                            var finalContent = void 0;
                            if (agentError_1) {
                                var userFacingMessage = "Lo siento, el agente externo no pudo procesar tu solicitud despu\u00E9s de varios intentos. Por favor, int\u00E9ntalo de nuevo m\u00E1s tarde o reformula tu pregunta. Si el problema persiste, contacta a soporte t\u00E9cnico.";
                                if (agentError_1.message !== "AGENT_EXTERNAL_FAILED_AFTER_RETRIES") {
                                    userFacingMessage = "Lo siento, el agente externo report\u00F3 un problema: ".concat(agentError_1.message, ". Por favor, int\u00E9ntalo de nuevo m\u00E1s tarde o reformula tu pregunta.");
                                }
                                finalContent = {
                                    displayText: userFacingMessage,
                                    statusDisplay: { icon: 'error', title: 'Error al Procesar', message: userFacingMessage }
                                };
                            }
                            else {
                                finalContent = mapAgentResponseToAIResponse(rawAgentResponse_1);
                            }
                            newMessages[tempMessageIndex] = { sender: 'ai', content: finalContent };
                        }
                        else {
                            // Fallback: if somehow the loading message wasn't found, just append the final response.
                            newMessages.push({ sender: 'ai', content: mapAgentResponseToAIResponse(rawAgentResponse_1) });
                        }
                        return newMessages;
                    });
                    setIsLoading(false);
                    return [2 /*return*/]; // IMPORTANT: Exit here, as we've handled the message.
                case 11:
                    activeLLMClient = null;
                    activeLLMModel = void 0;
                    activeLlmTools = void 0;
                    activeSystemInstruction = void 0;
                    isLLMGemini_1 = false;
                    openaiMessagesHistory = [];
                    isAgentModeSelected_1 = isAgenteEnabled;
                    if (service === 'gemini') {
                        if (!geminiClient)
                            throw new Error("Google Gemini client not initialized.");
                        if (!chat)
                            throw new Error("Chat session not initialized for Gemini. This should be handled by useEffect.");
                        activeLLMClient = geminiClient;
                        activeLLMModel = 'gemini-2.5-pro';
                        // Tools and system instruction are already configured in chat useEffect based on `isAgentModeSelected`.
                        activeLlmTools = chat.config.tools;
                        activeSystemInstruction = chat.config.systemInstruction;
                        isLLMGemini_1 = true;
                    }
                    else if (service === 'openai') {
                        if (!openaiClient)
                            throw new Error("OpenAI client not initialized.");
                        activeLLMClient = openaiClient;
                        activeLLMModel = 'gpt-4o'; // Use a powerful OpenAI model
                        if (isAgentModeSelected_1) {
                            activeLlmTools = [
                                { type: 'function', function: aiService_1.callExternalAgentWithQuery_OpenAI },
                                { type: 'function', function: aiService_1.callExternalAgentWithData_OpenAI }
                            ];
                            activeSystemInstruction = aiService_1.agenteOrchestratorSystemInstruction;
                        }
                        else { // Direct OpenAI mode
                            activeLlmTools = [
                                { type: 'function', function: aiService_1.executeQueryOnDatabase_OpenAI },
                                { type: 'function', function: aiService_1.getAggregateData_OpenAI },
                                { type: 'function', function: aiService_1.performAction_OpenAI }
                            ];
                            activeSystemInstruction = aiService_1.directSupabaseSystemInstruction;
                        }
                        // Build OpenAI message history for stateless calls.
                        // It's crucial to map messages to OpenAI's expected format correctly,
                        // especially for tool calls and responses.
                        openaiMessagesHistory = messages.map(function (msg) {
                            if (msg.sender === 'user') {
                                return { role: 'user', content: msg.content };
                            }
                            else if (msg.sender === 'ai' && typeof msg.content === 'object') {
                                var aiContent = msg.content;
                                // If the previous AI message had tool_calls, include them for OpenAI history
                                if (msg.tool_calls && msg.tool_calls.length > 0) {
                                    return { role: 'assistant', content: aiContent.displayText || null, tool_calls: msg.tool_calls };
                                }
                                return { role: 'assistant', content: aiContent.displayText || '' };
                            }
                            return { role: 'assistant', content: msg.content }; // Fallback for simple string AI messages
                        });
                        openaiMessagesHistory.unshift({ role: 'system', content: activeSystemInstruction });
                        openaiMessagesHistory.push({ role: 'user', content: prompt });
                        isLLMGemini_1 = false;
                    }
                    else {
                        // This case should ideally not be reached with the updated AiService type.
                        throw new Error("Ning\u00FAn servicio de IA (Gemini/OpenAI) configurado para el modo seleccionado: '".concat(service, "'."));
                    }
                    // Check if the selected LLM is configured (has an API key)
                    if ((service === 'gemini' && !geminiClient) || (service === 'openai' && !openaiClient)) {
                        throw new Error("El servicio de IA (".concat(service, ") no est\u00E1 configurado con una clave API v\u00E1lida. Por favor, revisa la secci\u00F3n de configuraci\u00F3n."));
                    }
                    responseFromLLM = void 0;
                    if (!isLLMGemini_1) return [3 /*break*/, 13];
                    return [4 /*yield*/, chat.sendMessage({ message: prompt })];
                case 12:
                    // Gemini handles message history internally via the `chat` object
                    responseFromLLM = _a.sent();
                    return [3 /*break*/, 15];
                case 13: return [4 /*yield*/, activeLLMClient.chat.completions.create({
                        model: activeLLMModel,
                        messages: openaiMessagesHistory,
                        tools: activeLlmTools,
                        tool_choice: 'auto',
                        response_format: { type: "json_object" }
                    })];
                case 14:
                    completion = _a.sent();
                    responseFromLLM = completion.choices[0].message;
                    _a.label = 15;
                case 15:
                    toolCalls = responseFromLLM.functionCalls || responseFromLLM.tool_calls || [];
                    functionResponseProcessed = false;
                    lastToolResponses_1 = [];
                    _a.label = 16;
                case 16:
                    if (!(toolCalls && toolCalls.length > 0)) return [3 /*break*/, 22];
                    functionResponseProcessed = true;
                    toolExecutionPromises = toolCalls.map(function (call) { return __awaiter(void 0, void 0, void 0, function () {
                        var functionName, functionArgs, toolCallId, payload, attempt, rawAgentResponse, retryError_2;
                        var _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    functionName = call.name || ((_a = call.function) === null || _a === void 0 ? void 0 : _a.name);
                                    functionArgs = call.args || (((_b = call.function) === null || _b === void 0 ? void 0 : _b.arguments) ? JSON.parse(call.function.arguments) : {});
                                    toolCallId = call.id || call.tool_call_id;
                                    if (!(agenteClient && (functionName === 'callExternalAgentWithQuery' || functionName === 'callExternalAgentWithData'))) return [3 /*break*/, 10];
                                    payload = void 0;
                                    if (functionName === 'callExternalAgentWithQuery') {
                                        payload = functionArgs.query;
                                        if (typeof payload !== 'string')
                                            throw new Error("Parámetro 'query' inválido para callExternalAgentWithQuery.");
                                    }
                                    else { // callExternalAgentWithData
                                        payload = functionArgs.data;
                                        if (typeof payload !== 'object' || payload === null)
                                            throw new Error("Parámetro 'data' inválido para callExternalAgentWithData.");
                                    }
                                    attempt = 0;
                                    _c.label = 1;
                                case 1:
                                    if (!(attempt <= MAX_AGENT_RETRIES)) return [3 /*break*/, 9];
                                    _c.label = 2;
                                case 2:
                                    _c.trys.push([2, 4, , 8]);
                                    return [4 /*yield*/, agenteClient.sendToAgent(payload, agenteWebhookUrl)];
                                case 3:
                                    rawAgentResponse = _c.sent();
                                    // Ensure the response is actually an object before returning
                                    if (typeof rawAgentResponse !== 'object' || rawAgentResponse === null) {
                                        throw new Error("Respuesta del agente externo no es un objeto JSON válido.");
                                    }
                                    return [2 /*return*/, rawAgentResponse]; // Success, return the raw response
                                case 4:
                                    retryError_2 = _c.sent();
                                    console.error("Intento ".concat(attempt + 1, "/").concat(MAX_AGENT_RETRIES + 1, " fallido para la llamada al agente:"), retryError_2.message);
                                    if (!(attempt < MAX_AGENT_RETRIES)) return [3 /*break*/, 6];
                                    return [4 /*yield*/, sleep(RETRY_DELAY_MS * (attempt + 1))];
                                case 5:
                                    _c.sent(); // Exponential backoff
                                    return [3 /*break*/, 7];
                                case 6: 
                                // All retries exhausted, throw a specific error
                                throw new Error("AGENT_EXTERNAL_FAILED_AFTER_RETRIES");
                                case 7: return [3 /*break*/, 8];
                                case 8:
                                    attempt++;
                                    return [3 /*break*/, 1];
                                case 9: 
                                // This line should technically not be reached, but needed for TypeScript
                                throw new Error("Ruta de error inesperada para la llamada al agente.");
                                case 10:
                                    if (!!isAgentModeSelected_1) return [3 /*break*/, 12];
                                    return [4 /*yield*/, (0, aiService_1.handleFunctionExecution)({ name: functionName, args: functionArgs, id: toolCallId }, supabase)];
                                case 11: // Direct Supabase tools, ONLY if NOT in agent mode
                                // handleFunctionExecution returns { functionResponse: { id, name, response: { result: { ... } } } }
                                return [2 /*return*/, _c.sent()];
                                case 12: throw new Error("Funci\u00F3n '".concat(functionName, "' no soportada o no implementada para el modo agente con ").concat(isLLMGemini_1 ? 'Gemini' : 'OpenAI', " como orquestador."));
                            }
                        });
                    }); });
                    return [4 /*yield*/, Promise.all(toolExecutionPromises)];
                case 17:
                    lastToolResponses_1 = _a.sent(); // These are the raw results from the tools
                    if (!isLLMGemini_1) return [3 /*break*/, 19];
                    geminiFormattedToolResponses = toolCalls.map(function (originalCall, i) {
                        var toolExecutionResult = lastToolResponses_1[i];
                        // Case 1: The tool execution already returned a fully formed FunctionResponsePart.
                        // This happens in direct mode with handleFunctionExecution.
                        if (toolExecutionResult && toolExecutionResult.functionResponse) {
                            // The ID from the original call must be used for matching.
                            toolExecutionResult.functionResponse.id = originalCall.id;
                            return toolExecutionResult;
                        }
                        // Case 2: The tool execution returned raw data (e.g., from the external agent).
                        // We need to wrap it in the expected FunctionResponsePart structure.
                        return {
                            functionResponse: {
                                name: originalCall.name,
                                id: originalCall.id,
                                // The LLM expects the tool's response to be an object with a 'result' key.
                                response: { result: toolExecutionResult },
                            }
                        };
                    });
                    return [4 /*yield*/, chat.sendMessage({ message: geminiFormattedToolResponses })];
                case 18:
                    // CRITICAL FIX: The payload must be `{ message: [...] }` for chat sessions.
                    // The previous implementation used `{ parts: [...] }` which is incorrect for this context
                    // and was causing the "ContentUnion is required" error.
                    responseFromLLM = _a.sent();
                    return [3 /*break*/, 21];
                case 19:
                    newToolMessages = toolCalls.map(function (call, i) {
                        var _a, _b, _c;
                        var toolExecutionResult = lastToolResponses_1[i]; // This is the raw output from the tool
                        // Content for the tool message depends on whether it was an external agent call or a direct Supabase tool call.
                        // Ensure the `content` property for OpenAI tool messages is a stringified JSON.
                        var contentString = (typeof toolExecutionResult === 'object' && toolExecutionResult !== null)
                            ? (((_b = (_a = toolExecutionResult.functionResponse) === null || _a === void 0 ? void 0 : _a.response) === null || _b === void 0 ? void 0 : _b.result) || JSON.stringify(toolExecutionResult))
                            : String(toolExecutionResult);
                        return {
                            tool_call_id: call.id || call.tool_call_id,
                            role: 'tool',
                            name: ((_c = call.function) === null || _c === void 0 ? void 0 : _c.name) || call.name,
                            content: contentString
                        };
                    });
                    openaiMessagesHistory.push(responseFromLLM); // Add AI's tool call request to history
                    openaiMessagesHistory.push.apply(// Add AI's tool call request to history
                    openaiMessagesHistory, newToolMessages); // Add our tool execution results to history
                    return [4 /*yield*/, activeLLMClient.chat.completions.create({
                            model: activeLLMModel,
                            messages: openaiMessagesHistory,
                            tools: activeLlmTools,
                            tool_choice: 'auto',
                            response_format: { type: "json_object" }
                        })];
                case 20:
                    completion = _a.sent();
                    responseFromLLM = completion.choices[0].message;
                    _a.label = 21;
                case 21:
                    toolCalls = responseFromLLM.functionCalls || responseFromLLM.tool_calls || []; // Update for next iteration
                    return [3 /*break*/, 16];
                case 22:
                    finalResponseContent = responseFromLLM.text || responseFromLLM.content;
                    parsedAIResponse = null;
                    // When using an orchestrator pattern, the LLM's final response (`finalResponseContent`) is the source of truth for the UI.
                    // It has already processed any tool call results (including the raw data from the external agent) and has decided on the best presentation format (table, chart, etc.).
                    // Therefore, we must prioritize parsing this final response, rather than manually mapping the raw tool data.
                    // The `mapAgentResponseToAIResponse` function remains useful for direct agent calls that bypass the LLM's final formatting step, such as form submissions.
                    parsedAIResponse = extractAndParseJson(finalResponseContent);
                    if (parsedAIResponse) {
                        aiMessage_1 = { sender: 'ai', content: parsedAIResponse, tool_calls: responseFromLLM.tool_calls };
                        setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [aiMessage_1], false); });
                    }
                    else {
                        console.warn("AI response was not valid JSON. Displaying as text. Response:", finalResponseContent);
                        fallbackMessage_1 = {
                            sender: 'ai',
                            content: {
                                displayText: "He recibido una respuesta, pero no tiene el formato JSON esperado. Aqu\u00ED est\u00E1 el texto original:\n\n---\n\n".concat(finalResponseContent),
                                statusDisplay: { icon: 'error', title: 'Error de Formato', message: 'La respuesta de la IA no es un JSON válido.' }
                            }
                        };
                        setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [fallbackMessage_1], false); });
                    }
                    return [3 /*break*/, 25];
                case 23:
                    error_1 = _a.sent();
                    console.error("Error getting AI response:", error_1);
                    userFacingMessage = "Lo siento, ocurri\u00F3 un error: ".concat(error_1.message);
                    statusDisplay = { icon: 'error', title: 'Error General', message: userFacingMessage };
                    if (error_1.message === "AGENT_EXTERNAL_FAILED_AFTER_RETRIES") {
                        userFacingMessage = "Lo siento, el agente externo no pudo procesar tu solicitud después de varios intentos. Por favor, inténtalo de nuevo más tarde o reformula tu pregunta. Si el problema persiste, contacta a soporte técnico.";
                        statusDisplay = { icon: 'error', title: 'Error de Conexión', message: userFacingMessage };
                    }
                    else if (error_1.message.includes("ContentUnion is required")) {
                        userFacingMessage = "Lo siento, hubo un problema al procesar la respuesta de la IA. Parece que el formato de los datos no es el esperado. Por favor, intenta reformular tu pregunta o notifica a soporte.";
                        statusDisplay = { icon: 'error', title: 'Error de Formato Interno', message: userFacingMessage };
                    }
                    else if (error_1.message.includes("client not initialized") || error_1.message.includes("not configured with a valid API key")) {
                        userFacingMessage = "El servicio de IA (".concat(service, ") no est\u00E1 configurado o no tiene una clave API v\u00E1lida. Por favor, revisa la secci\u00F3n de configuraci\u00F3n.");
                        statusDisplay = { icon: 'error', title: 'Error de Configuración', message: userFacingMessage };
                    }
                    errorMessage_1 = {
                        sender: 'ai',
                        content: {
                            displayText: userFacingMessage,
                            statusDisplay: statusDisplay
                        }
                    };
                    setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [errorMessage_1], false); });
                    return [3 /*break*/, 25];
                case 24:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 25: return [2 /*return*/];
            }
        });
    }); }, [isLoading, supabase, chat, service, geminiClient, openaiClient, agenteClient, isAgenteEnabled, agenteWebhookUrl, messages]);
    var clearUnread = function () {
        setHasUnreadMessage(false);
    };
    var value = {
        messages: messages,
        isLoading: isLoading,
        hasUnreadMessage: hasUnreadMessage,
        sendMessage: sendMessage,
        setHasUnreadMessage: setHasUnreadMessage,
        clearUnread: clearUnread
    };
    return (<ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>);
};
exports.ChatProvider = ChatProvider;
var useChat = function () {
    var context = (0, react_1.useContext)(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
exports.useChat = useChat;
