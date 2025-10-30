"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.useAiService = exports.AiServiceProvider = void 0;
var react_1 = require("react");
var genai_1 = require("@google/genai");
var SupabaseContext_1 = require("./SupabaseContext");
var agenteService_1 = require("../services/agenteService");
var AiServiceContext = (0, react_1.createContext)(undefined);
var DEFAULT_AGENTE_WEBHOOK_URL = 'https://hook.us2.make.com/d81q23ojiyenuysslld4naomb6q4be2r';
var AiServiceProvider = function (_a) {
    var children = _a.children;
    var supabase = (0, SupabaseContext_1.useSupabase)().supabase;
    var _b = (0, react_1.useState)('gemini'), service = _b[0], setServiceState = _b[1]; // Now only 'gemini' or 'openai'
    var _c = (0, react_1.useState)({}), apiKeys = _c[0], setApiKeys = _c[1];
    var _d = (0, react_1.useState)(DEFAULT_AGENTE_WEBHOOK_URL), agenteWebhookUrl = _d[0], setAgenteWebhookUrlState = _d[1];
    var _e = (0, react_1.useState)(null), geminiClient = _e[0], setGeminiClient = _e[1];
    var _f = (0, react_1.useState)(null), openaiClient = _f[0], setOpenaiClient = _f[1];
    var _g = (0, react_1.useState)(null), agenteClient = _g[0], setAgenteClient = _g[1];
    // isAgenteEnabled is now derived from agenteWebhookUrl
    var isAgenteEnabled = (0, react_1.useMemo)(function () { return !!agenteWebhookUrl; }, [agenteWebhookUrl]);
    // Fetch all configurations on mount (API keys and Agente webhook URL)
    var fetchConfigs = (0, react_1.useCallback)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, apiKeysData, apiKeysError, _b, webhookData, webhookError, parsedUrl;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!supabase)
                        return [2 /*return*/];
                    return [4 /*yield*/, supabase
                            .from('Configuracion')
                            .select('value')
                            .eq('key', 'ai_api_keys')
                            .is('id_usuario', null)
                            .maybeSingle()];
                case 1:
                    _a = _d.sent(), apiKeysData = _a.data, apiKeysError = _a.error;
                    if (apiKeysError) {
                        console.warn("Could not fetch AI API keys:", apiKeysError.message);
                    }
                    else if (apiKeysData && apiKeysData.value) {
                        try {
                            setApiKeys(JSON.parse(apiKeysData.value));
                        }
                        catch (e) {
                            console.error("Failed to parse AI API keys JSON from DB.", e);
                        }
                    }
                    return [4 /*yield*/, supabase
                            .from('Configuracion')
                            .select('value')
                            .eq('key', 'agente_webhook_url')
                            .is('id_usuario', null)
                            .maybeSingle()];
                case 2:
                    _b = _d.sent(), webhookData = _b.data, webhookError = _b.error;
                    if (webhookError) {
                        console.warn("Could not fetch Agente webhook URL:", webhookError.message);
                    }
                    else if (webhookData && webhookData.value) {
                        try {
                            parsedUrl = (_c = JSON.parse(webhookData.value)) === null || _c === void 0 ? void 0 : _c.webhookUrl;
                            if (parsedUrl)
                                setAgenteWebhookUrlState(parsedUrl);
                        }
                        catch (e) {
                            console.error("Failed to parse Agente webhook URL JSON from DB.", e);
                        }
                    }
                    return [2 /*return*/];
            }
        });
    }); }, [supabase]);
    (0, react_1.useEffect)(function () {
        fetchConfigs();
    }, [fetchConfigs]);
    // Load selected AI service from local storage
    (0, react_1.useEffect)(function () {
        var storedService = localStorage.getItem('ai_service');
        if (storedService && (storedService === 'gemini' || storedService === 'openai')) { // Ensure it's a valid service
            setServiceState(storedService);
        }
        else {
            setServiceState('gemini'); // Default to gemini if stored value is invalid or 'agente'
        }
    }, []);
    // Initialize Gemini client when API key changes
    (0, react_1.useEffect)(function () {
        var geminiKey = apiKeys.gemini;
        if (geminiKey) {
            try {
                setGeminiClient(new genai_1.GoogleGenAI({ apiKey: geminiKey }));
            }
            catch (e) {
                console.error("Failed to initialize GoogleGenAI client:", e);
                setGeminiClient(null);
            }
        }
        else {
            setGeminiClient(null);
        }
    }, [apiKeys.gemini]);
    // Initialize OpenAI client when API key changes
    (0, react_1.useEffect)(function () {
        var openaiKey = apiKeys.openai;
        if (openaiKey) {
            var client = {
                chat: {
                    completions: {
                        create: function (payload) { return __awaiter(void 0, void 0, void 0, function () {
                            var response, errorData;
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4 /*yield*/, fetch('https://api.openai.com/v1/chat/completions', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': "Bearer ".concat(openaiKey)
                                            },
                                            body: JSON.stringify(payload)
                                        })];
                                    case 1:
                                        response = _b.sent();
                                        if (!!response.ok) return [3 /*break*/, 3];
                                        return [4 /*yield*/, response.json()];
                                    case 2:
                                        errorData = _b.sent();
                                        throw new Error(((_a = errorData.error) === null || _a === void 0 ? void 0 : _a.message) || 'OpenAI API request failed');
                                    case 3: return [2 /*return*/, response.json()];
                                }
                            });
                        }); }
                    }
                }
            };
            setOpenaiClient(client);
        }
        else {
            setOpenaiClient(null);
        }
    }, [apiKeys.openai]);
    // Initialize Agente client when webhook URL changes
    (0, react_1.useEffect)(function () {
        if (agenteWebhookUrl) {
            // No direct dependencies on specific keys for AgenteClient, it's generic
            setAgenteClient((0, agenteService_1.createAgenteClient)());
        }
        else {
            setAgenteClient(null);
        }
    }, [agenteWebhookUrl]);
    // Set selected AI service and persist to local storage
    var setService = function (newService) {
        // Only allow valid AI service types to be set
        if (newService === 'gemini' || newService === 'openai') {
            localStorage.setItem('ai_service', newService);
            setServiceState(newService);
        }
        else {
            console.warn("Attempted to set invalid AI service: ".concat(newService));
        }
    };
    // Check if a service is configured (has an API key or webhook URL)
    var isConfigured = (0, react_1.useCallback)(function (serviceToCheck) {
        if (serviceToCheck === 'gemini')
            return !!apiKeys.gemini;
        if (serviceToCheck === 'openai')
            return !!apiKeys.openai;
        // 'agente' is now checked via 'isAgenteEnabled', not as a direct service type
        return false;
    }, [apiKeys]);
    // Update AI API keys (Gemini/OpenAI) and persist to DB
    var updateApiKeys = function (newKeys) { return __awaiter(void 0, void 0, void 0, function () {
        var optimisticKeys, error, _a, existing, selectError, keysToSave, updateError, insertError, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    optimisticKeys = __assign(__assign({}, apiKeys), newKeys);
                    setApiKeys(optimisticKeys);
                    if (!supabase) {
                        error = new Error("Supabase client not available");
                        return [2 /*return*/, { error: error }];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 7, , 8]);
                    return [4 /*yield*/, supabase
                            .from('Configuracion')
                            .select('id')
                            .eq('key', 'ai_api_keys')
                            .is('id_usuario', null)
                            .maybeSingle()];
                case 2:
                    _a = _b.sent(), existing = _a.data, selectError = _a.error;
                    if (selectError)
                        throw selectError;
                    keysToSave = optimisticKeys;
                    if (!existing) return [3 /*break*/, 4];
                    return [4 /*yield*/, supabase
                            .from('Configuracion')
                            .update({ value: JSON.stringify(keysToSave) })
                            .eq('id', existing.id)];
                case 3:
                    updateError = (_b.sent()).error;
                    if (updateError)
                        throw updateError;
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, supabase
                        .from('Configuracion')
                        .insert({ key: 'ai_api_keys', value: JSON.stringify(keysToSave), id_usuario: null })];
                case 5:
                    insertError = (_b.sent()).error;
                    if (insertError)
                        throw insertError;
                    _b.label = 6;
                case 6: return [2 /*return*/, { error: null }];
                case 7:
                    error_1 = _b.sent();
                    console.error("Failed to save API keys to DB:", error_1);
                    fetchConfigs(); // Revert to fetched state on error
                    return [2 /*return*/, { error: error_1 }];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    // Update Agente webhook URL and persist to DB
    var updateAgenteWebhookUrl = function (newUrl) { return __awaiter(void 0, void 0, void 0, function () {
        var error, _a, existing, selectError, urlToSave, updateError, insertError, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setAgenteWebhookUrlState(newUrl); // Optimistic update
                    if (!supabase) {
                        error = new Error("Supabase client not available");
                        return [2 /*return*/, { error: error }];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 7, , 8]);
                    return [4 /*yield*/, supabase
                            .from('Configuracion')
                            .select('id')
                            .eq('key', 'agente_webhook_url')
                            .is('id_usuario', null)
                            .maybeSingle()];
                case 2:
                    _a = _b.sent(), existing = _a.data, selectError = _a.error;
                    if (selectError)
                        throw selectError;
                    urlToSave = { webhookUrl: newUrl };
                    if (!existing) return [3 /*break*/, 4];
                    return [4 /*yield*/, supabase
                            .from('Configuracion')
                            .update({ value: JSON.stringify(urlToSave) })
                            .eq('id', existing.id)];
                case 3:
                    updateError = (_b.sent()).error;
                    if (updateError)
                        throw updateError;
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, supabase
                        .from('Configuracion')
                        .insert({ key: 'agente_webhook_url', value: JSON.stringify(urlToSave), id_usuario: null })];
                case 5:
                    insertError = (_b.sent()).error;
                    if (insertError)
                        throw insertError;
                    _b.label = 6;
                case 6: return [2 /*return*/, { error: null }];
                case 7:
                    error_2 = _b.sent();
                    console.error("Failed to save Agente webhook URL to DB:", error_2);
                    fetchConfigs(); // Revert to fetched state on error
                    return [2 /*return*/, { error: error_2 }];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var value = (0, react_1.useMemo)(function () { return ({
        service: service,
        setService: setService,
        isConfigured: isConfigured,
        isAgenteEnabled: isAgenteEnabled, // Expose new state
        geminiClient: geminiClient,
        openaiClient: openaiClient,
        agenteClient: agenteClient,
        apiKeys: apiKeys,
        agenteWebhookUrl: agenteWebhookUrl,
        updateApiKeys: updateApiKeys,
        updateAgenteWebhookUrl: updateAgenteWebhookUrl
    }); }, [service, isConfigured, isAgenteEnabled, geminiClient, openaiClient, agenteClient, apiKeys, agenteWebhookUrl, updateApiKeys, updateAgenteWebhookUrl]); // Add updateApiKeys and updateAgenteWebhookUrl to dependencies
    return (<AiServiceContext.Provider value={value}>
            {children}
        </AiServiceContext.Provider>);
};
exports.AiServiceProvider = AiServiceProvider;
var useAiService = function () {
    var context = (0, react_1.useContext)(AiServiceContext);
    if (!context) {
        throw new Error('useAiService must be used within an AiServiceProvider');
    }
    return context;
};
exports.useAiService = useAiService;
