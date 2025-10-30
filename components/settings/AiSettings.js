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
var react_1 = require("react");
var AiServiceContext_1 = require("../../contexts/AiServiceContext");
var Icons_1 = require("../ui/Icons");
var Spinner_1 = require("../ui/Spinner");
var AiSettings = function () {
    var _a = (0, AiServiceContext_1.useAiService)(), service = _a.service, setService = _a.setService, isConfigured = _a.isConfigured, apiKeys = _a.apiKeys, updateApiKeys = _a.updateApiKeys;
    var _b = (0, react_1.useState)({ gemini: '', openai: '' }), keys = _b[0], setKeys = _b[1];
    var _c = (0, react_1.useState)(false), isSaving = _c[0], setIsSaving = _c[1];
    var _d = (0, react_1.useState)(null), feedback = _d[0], setFeedback = _d[1];
    // Update internal states when context values change
    (0, react_1.useEffect)(function () {
        setKeys({
            gemini: apiKeys.gemini || '',
            openai: apiKeys.openai || '',
        });
    }, [apiKeys]);
    var handleKeyChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value;
        setKeys(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
        });
    };
    var handleSave = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var keysError;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    setIsSaving(true);
                    setFeedback(null);
                    return [4 /*yield*/, updateApiKeys(keys)];
                case 1:
                    keysError = (_a.sent()).error;
                    setIsSaving(false);
                    if (keysError) {
                        setFeedback({ type: 'error', message: "Error al guardar: ".concat(keysError.message) });
                    }
                    else {
                        setFeedback({ type: 'success', message: '¡Configuración de IA guardada exitosamente!' });
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    return (<div className="space-y-8">
            <div className="bg-base-200 p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl">
                 <div className="flex items-start gap-4">
                    <div className="bg-primary/10 text-primary p-3 rounded-lg">
                        <Icons_1.CpuChipIcon className="h-8 w-8"/>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-base-content">Configuración de Servicios de IA</h3>
                        <p className="mt-1 text-sm text-neutral">
                            Selecciona el proveedor de IA y configura las claves de API para la aplicación.
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Provider Selection */}
            <div className="bg-base-200 p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl">
                <h3 className="text-base font-semibold text-base-content mb-4 pb-4 border-b border-base-border">Proveedor de IA Activo</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> 
                    {/* Gemini Option */}
                    <div onClick={function () { return setService('gemini'); }} className={"relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ".concat(service === 'gemini' ? 'border-primary shadow-md scale-105 bg-base-100' : 'border-base-border bg-base-200 hover:border-primary/70')}>
                         {service === 'gemini' && <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-primary animate-pulse"></div>}
                        <label className="flex items-center cursor-pointer">
                            <Icons_1.SparklesIcon className="h-8 w-8 mr-3 text-blue-500"/>
                            <div className="text-sm">
                                <span className="font-medium text-base-content">Google Gemini</span>
                                <p className={"text-neutral text-xs ".concat(isConfigured('gemini') ? 'text-success' : 'text-warning')}>
                                    {isConfigured('gemini') ? 'Configurado' : 'Clave API Requerida'}
                                </p>
                            </div>
                        </label>
                    </div>
                    
                    {/* OpenAI Option */}
                    <div onClick={function () { return setService('openai'); }} className={"relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ".concat(service === 'openai' ? 'border-primary shadow-md scale-105 bg-base-100' : 'border-base-border bg-base-200 hover:border-primary/70')}>
                         {service === 'openai' && <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-primary animate-pulse"></div>}
                         <label className="flex items-center cursor-pointer">
                             <img src="https://jhhlrndxepowacrndhni.supabase.co/storage/v1/object/public/assets/openai-logo.png" alt="OpenAI Logo" className="h-8 w-8 mr-3"/>
                            <div className="text-sm">
                                <span className="font-medium text-base-content">OpenAI</span>
                                <p className={"text-neutral text-xs ".concat(isConfigured('openai') ? 'text-success' : 'text-warning')}>
                                     {isConfigured('openai') ? 'Configurado' : 'Clave API Requerida'}
                                </p>
                            </div>
                        </label>
                    </div>
                </div>
                 <p className="text-xs text-neutral mt-4 text-center">
                    La selección del proveedor se guarda localmente en tu navegador.
                </p>
            </div>

            {/* API Key Configuration */}
            <form onSubmit={handleSave} className="bg-base-200 p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl">
                <div className="flex items-start gap-4 border-b border-base-border pb-4 mb-6">
                    <div className="bg-secondary/10 text-secondary p-3 rounded-lg"><Icons_1.KeyIcon className="h-8 w-8"/></div>
                    <div>
                        <h3 className="text-xl font-bold text-base-content">Claves de API</h3>
                        <p className="mt-1 text-sm text-neutral">Introduce las claves de API para los servicios de IA. Esta es una configuración global.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="gemini-key" className="block text-sm font-medium">Clave de API de Google Gemini</label>
                        <input type="password" id="gemini-key" name="gemini" value={keys.gemini} onChange={handleKeyChange} className="mt-1 block w-full input-style" placeholder="Pega tu clave aquí"/>
                    </div>
                     <div>
                        <label htmlFor="openai-key" className="block text-sm font-medium">Clave de API de OpenAI</label>
                        <input type="password" id="openai-key" name="openai" value={keys.openai} onChange={handleKeyChange} className="mt-1 block w-full input-style" placeholder="Pega tu clave aquí"/>
                    </div>
                </div>

                {feedback && (<div className={"mt-4 p-3 rounded-md text-sm ".concat(feedback.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error')}>
                        {feedback.message}
                    </div>)}
                
                <div className="flex justify-end pt-6 mt-6 border-t border-base-border">
                    <button type="submit" disabled={isSaving} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-focus disabled:bg-primary/50">
                        {isSaving ? <Spinner_1.default /> : <Icons_1.SaveIcon className="h-5 w-5"/>}
                        {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>
            </form>
        </div>);
};
exports.default = AiSettings;
