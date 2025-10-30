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
var react_1 = require("react");
var supabase_js_1 = require("@supabase/supabase-js");
var SupabaseContext_1 = require("../../contexts/SupabaseContext");
var Icons_1 = require("../ui/Icons");
var Spinner_1 = require("../ui/Spinner");
var DatabaseSettings = function () {
    var initializeSupabase = (0, SupabaseContext_1.useSupabase)().initializeSupabase;
    var _a = (0, react_1.useState)(''), url = _a[0], setUrl = _a[1];
    var _b = (0, react_1.useState)(''), apiKey = _b[0], setApiKey = _b[1];
    var _c = (0, react_1.useState)(false), isSaving = _c[0], setIsSaving = _c[1];
    var _d = (0, react_1.useState)(null), feedback = _d[0], setFeedback = _d[1];
    (0, react_1.useEffect)(function () {
        var storedUrl = localStorage.getItem('supabase_url') || '';
        var storedKey = localStorage.getItem('supabase_anon_key') || '';
        setUrl(storedUrl);
        setApiKey(storedKey);
        if (storedUrl && storedKey) {
            setFeedback({ type: 'info', message: 'Configuración actual cargada desde el almacenamiento local.' });
        }
        else {
            setFeedback({ type: 'info', message: 'No se encontró configuración. Por favor, ingresa tus credenciales.' });
        }
    }, []);
    var handleSave = function () { return __awaiter(void 0, void 0, void 0, function () {
        var tempClient, testError, settingsValue, _a, existingConfig, selectError, payload, dbError, error, error, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!url || !apiKey) {
                        setFeedback({ type: 'error', message: 'La URL de Supabase y la Anon Key no pueden estar vacías.' });
                        return [2 /*return*/];
                    }
                    setIsSaving(true);
                    setFeedback(null);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 8, 9, 10]);
                    tempClient = (0, supabase_js_1.createClient)(url, apiKey);
                    return [4 /*yield*/, tempClient.auth.getSession()];
                case 2:
                    testError = (_b.sent()).error;
                    if (testError && (testError.message.includes('AuthApiError') || testError.message.includes('failed to fetch'))) {
                        throw testError;
                    }
                    localStorage.setItem('supabase_url', url);
                    localStorage.setItem('supabase_anon_key', apiKey);
                    initializeSupabase(url, apiKey);
                    settingsValue = { url: url, apiKey: apiKey };
                    return [4 /*yield*/, tempClient
                            .from('Configuracion')
                            .select('id')
                            .eq('key', 'supabase_settings')
                            .is('id_usuario', null)
                            .maybeSingle()];
                case 3:
                    _a = _b.sent(), existingConfig = _a.data, selectError = _a.error;
                    if (selectError)
                        throw new Error("Error al buscar configuraci\u00F3n existente: ".concat(selectError.message));
                    payload = {
                        key: 'supabase_settings',
                        value: JSON.stringify(settingsValue)
                    };
                    dbError = void 0;
                    if (!existingConfig) return [3 /*break*/, 5];
                    return [4 /*yield*/, tempClient.from('Configuracion').update({ value: payload.value }).eq('id', existingConfig.id)];
                case 4:
                    error = (_b.sent()).error;
                    dbError = error;
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, tempClient.from('Configuracion').insert(payload)];
                case 6:
                    error = (_b.sent()).error;
                    dbError = error;
                    _b.label = 7;
                case 7:
                    if (dbError)
                        throw new Error("No se pudo guardar en la base de datos: ".concat(dbError.message));
                    setFeedback({ type: 'success', message: '¡Conexión verificada! La configuración se ha guardado y aplicado.' });
                    return [3 /*break*/, 10];
                case 8:
                    error_1 = _b.sent();
                    setFeedback({ type: 'error', message: "Fall\u00F3 el proceso de guardado: ".concat(error_1.message) });
                    return [3 /*break*/, 10];
                case 9:
                    setIsSaving(false);
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="space-y-8">
            <div className="bg-base-200 p-6 sm:p-8 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl">
                <div className="flex items-start gap-4 border-b border-base-border pb-4 mb-6">
                    <div className="bg-primary/10 text-primary p-3 rounded-lg">
                        <Icons_1.DatabaseIcon className="h-8 w-8"/>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-base-content">Configuración de Base de Datos</h3>
                        <p className="mt-1 text-sm text-neutral">
                            Gestiona tu conexión a Supabase. Esta es una configuración general y se guardará para todos los usuarios.
                        </p>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="supabase-url" className="block text-sm font-medium">URL de Supabase</label>
                        <input type="text" id="supabase-url" value={url} onChange={function (e) { return setUrl(e.target.value); }} className="mt-1 block w-full input-style" placeholder="https://<project-ref>.supabase.co" disabled={isSaving}/>
                    </div>
                    <div>
                        <label htmlFor="supabase-key" className="block text-sm font-medium">Supabase Anon Key</label>
                        <input type="password" id="supabase-key" value={apiKey} onChange={function (e) { return setApiKey(e.target.value); }} className="mt-1 block w-full input-style" placeholder="ey..." disabled={isSaving}/>
                    </div>
                </div>

                {feedback && (<div className={"mt-6 p-3 rounded-md text-sm transition-opacity duration-300 ".concat(feedback.type === 'success' ? 'bg-success/10 text-success' :
                feedback.type === 'error' ? 'bg-error/10 text-error' :
                    'bg-info/10 text-info')}>
                        {feedback.message}
                    </div>)}

                <div className="flex justify-end pt-6 mt-6 border-t border-base-border">
                    <button onClick={handleSave} disabled={isSaving} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-focus focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed">
                        {isSaving ? <Spinner_1.default /> : <Icons_1.SaveIcon className="h-5 w-5"/>}
                        {isSaving ? 'Verificando y Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>
            </div>
        </div>);
};
exports.default = DatabaseSettings;
