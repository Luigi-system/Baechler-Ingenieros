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
var GoogleAuthContext_1 = require("../../contexts/GoogleAuthContext");
var Icons_1 = require("../ui/Icons");
var Spinner_1 = require("../ui/Spinner");
var GoogleDriveSettings = function () {
    var _a = (0, GoogleAuthContext_1.useGoogleAuth)(), isSignedIn = _a.isSignedIn, currentUserEmail = _a.currentUserEmail, handleSignIn = _a.handleSignIn, handleSignOut = _a.handleSignOut, gapiLoaded = _a.gapiLoaded, gisLoaded = _a.gisLoaded, isConfigured = _a.isConfigured;
    var _b = (0, react_1.useState)(false), isAuthLoading = _b[0], setIsAuthLoading = _b[1];
    var _c = (0, react_1.useState)(null), feedback = _c[0], setFeedback = _c[1];
    var handleConnect = function () { return __awaiter(void 0, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsAuthLoading(true);
                    setFeedback(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, handleSignIn()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _a.sent();
                    console.error("Google Sign-In failed:", e_1);
                    setFeedback({ type: 'error', message: "Error al conectar: ".concat(e_1.message || 'Por favor, inténtalo de nuevo.') });
                    return [3 /*break*/, 5];
                case 4:
                    setIsAuthLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleDisconnect = function () {
        setIsAuthLoading(true);
        setFeedback(null);
        handleSignOut();
        setFeedback({ type: 'success', message: '¡Desconectado de Google Drive!' });
        setIsAuthLoading(false);
    };
    var isReady = gapiLoaded && gisLoaded;
    return (<div className="space-y-8">
      <div className="bg-base-200 p-6 sm:p-8 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl">
        <div className="flex items-start gap-4 border-b border-base-border pb-4 mb-6">
          <div className="bg-primary/10 text-primary p-3 rounded-lg">
            <Icons_1.DriveIcon className="h-8 w-8"/>
          </div>
          <div>
            <h3 className="text-xl font-bold text-base-content">Integración con Google Drive</h3>
            <p className="mt-1 text-sm text-neutral">
              Conecta tu cuenta de Google para acceder y gestionar documentos directamente desde la aplicación.
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          {!isConfigured ? (<div className="p-4 bg-warning/10 text-warning rounded-md flex items-start gap-3">
                <Icons_1.AlertTriangleIcon className="h-6 w-6 shrink-0 mt-0.5"/>
                <div>
                    <h4 className="font-semibold">Configuración Requerida</h4>
                    <p className="text-sm">La integración de Google Drive no está habilitada. El desarrollador debe configurar un ID de cliente de Google en la aplicación.</p>
                </div>
            </div>) : isSignedIn ? (<div>
              <p className="block text-sm font-medium">Estado de la conexión:</p>
              <div className="flex items-center mt-1 p-3 bg-success/10 text-success rounded-md">
                <Icons_1.LinkIcon className="h-5 w-5 mr-2"/>
                <span className="font-semibold">Conectado como: {currentUserEmail}</span>
              </div>
              <p className="mt-2 text-xs text-neutral">Puedes acceder a los documentos de Google Drive a través del visualizador.</p>
            </div>) : (<div>
              <p className="block text-sm font-medium text-warning">Estado de la conexión: No conectado</p>
              <p className="mt-1 text-xs text-neutral">Conecta tu cuenta de Google para habilitar la integración.</p>
            </div>)}
        </div>

        {feedback && (<div className={"mt-6 p-3 rounded-md text-sm transition-opacity duration-300 ".concat(feedback.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error')}>
            {feedback.message}
          </div>)}

        {/* Troubleshooting Section - Always visible if configured */}
        {isConfigured && (<div className="mt-6 p-4 bg-info/10 text-info rounded-md">
            <h4 className="font-semibold text-base flex items-center">
              <Icons_1.AlertTriangleIcon className="h-5 w-5 mr-2 shrink-0"/>
              Solución de Problemas (Error de Autorización)
            </h4>
            <div className="mt-2 text-sm prose prose-sm max-w-none prose-zinc dark:prose-invert text-info">
                <p>
                    Si ves un error <strong>"Acceso bloqueado: error de autorización"</strong> o <strong>"Error 400: invalid_request"</strong>, verifica los siguientes puntos en tu <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="font-bold hover:underline">Consola de Google Cloud</a>:
                </p>
                <ul className="list-disc pl-5 space-y-3">
                    <li>
                        <strong>Tipo de Aplicación:</strong> Asegúrate de que tu ID de cliente de OAuth sea para una <strong>"Aplicación web"</strong>.
                    </li>
                    <li>
                        <strong>Orígenes de JavaScript autorizados:</strong> Debe contener la siguiente URL:
                        <code className="block bg-base-300/50 p-2 rounded-md my-1 select-all">https://aistudio.google.com</code>
                    </li>
                    <li>
                        <strong>URIs de redireccionamiento autorizados:</strong> Debe contener la siguiente URL:
                        <code className="block bg-base-300/50 p-2 rounded-md my-1 select-all">https://accounts.google.com/gsi/callback</code>
                    </li>
                     <li>
                        <strong>Estado de Publicación:</strong> Ve a "Pantalla de consentimiento de OAuth". Si el estado es <strong>'En fase de pruebas'</strong>, tu cuenta de Google debe estar añadida en la sección <strong>'Usuarios de prueba'</strong> para poder iniciar sesión.
                    </li>
                </ul>
                <p>
                    <strong>Importante:</strong> Después de guardar los cambios en la consola de Google, espera 1-2 minutos antes de volver a intentarlo.
                </p>
            </div>
          </div>)}

        <div className="flex justify-end pt-6 mt-6 border-t border-base-border">
          {isSignedIn ? (<button onClick={handleDisconnect} disabled={isAuthLoading || !isReady} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-error rounded-lg hover:bg-error/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors disabled:bg-error/50 disabled:cursor-not-allowed">
              {isAuthLoading ? <Spinner_1.default /> : null}
              {isAuthLoading ? 'Desconectando...' : 'Desconectar Google Drive'}
            </button>) : (<button onClick={handleConnect} disabled={isAuthLoading || !isReady || !isConfigured} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-focus focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed">
              {isAuthLoading ? <Spinner_1.default /> : null}
              {isAuthLoading ? 'Conectando...' : 'Conectar Google Drive'}
            </button>)}
          {!isReady && isConfigured && (<span className="ml-4 flex items-center text-sm text-neutral">
              <Spinner_1.default />
              <span className="ml-2">Cargando APIs de Google...</span>
            </span>)}
        </div>
      </div>
    </div>);
};
exports.default = GoogleDriveSettings;
