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
var AuthContext_1 = require("../../contexts/AuthContext");
var Icons_1 = require("../ui/Icons");
var ThemeContext_1 = require("../../contexts/ThemeContext");
var Login = function () {
    var _a = (0, react_1.useState)(''), email = _a[0], setEmail = _a[1];
    var _b = (0, react_1.useState)(''), password = _b[0], setPassword = _b[1];
    var _c = (0, react_1.useState)(false), isLoading = _c[0], setIsLoading = _c[1];
    var _d = (0, react_1.useState)(null), error = _d[0], setError = _d[1];
    var auth = (0, react_1.useContext)(AuthContext_1.AuthContext);
    var logoUrl = (0, ThemeContext_1.useTheme)().logoUrl;
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var err_1, message;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!auth)
                        return [2 /*return*/];
                    setIsLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, auth.login(email, password)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    message = err_1.message;
                    if (message === 'Invalid login credentials') {
                        setError('Credenciales de inicio de sesión inválidas.');
                    }
                    else {
                        setError(message || 'Ocurrió un error desconocido.');
                    }
                    setIsLoading(false);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleInputChange = function (setter) { return function (e) {
        setter(e.target.value);
        if (error) {
            setError(null);
        }
    }; };
    return (<div className="flex items-center justify-center min-h-screen bg-base-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-base-200 rounded-2xl shadow-2xl transform transition-all">
        <div className="text-center">
            <img src={logoUrl} alt="Report-AI Logo" className="mx-auto h-16 w-auto"/>
            <h2 className="mt-6 text-3xl font-extrabold text-base-content">
                Inicia sesión en Report-AI
            </h2>
            <p className="mt-2 text-sm text-neutral">
                Ingresa tus credenciales para acceder a tu cuenta.
            </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (<div className="flex items-start text-sm text-error bg-error/10 p-3 rounded-md">
                <Icons_1.AlertTriangleIcon className="h-5 w-5 mr-2 shrink-0" aria-hidden="true"/>
                <span className="text-left">{error}</span>
            </div>)}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icons_1.EmailIcon className="h-5 w-5 text-neutral"/>
            </div>
            <input id="email-address" name="email" type="email" autoComplete="email" required className="appearance-none relative block w-full pl-10 pr-3 py-3 sm:text-sm input-style" placeholder="Correo electrónico" value={email} onChange={handleInputChange(setEmail)}/>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icons_1.LockIcon className="h-5 w-5 text-neutral"/>
            </div>
            <input id="password" name="password" type="password" autoComplete="current-password" required className="appearance-none relative block w-full pl-10 pr-3 py-3 sm:text-sm input-style" placeholder="Contraseña" value={password} onChange={handleInputChange(setPassword)}/>
          </div>

          <div>
            <button type="submit" disabled={isLoading || !email || !password} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus disabled:bg-primary/50 disabled:cursor-not-allowed transition-colors">
              {isLoading ? (<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>) : (<span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <Icons_1.LoginIcon className="h-5 w-5 text-primary-light group-hover:text-primary-lighter"/>
                </span>)}
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>);
};
exports.default = Login;
