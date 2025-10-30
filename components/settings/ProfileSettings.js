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
var AuthContext_1 = require("../../contexts/AuthContext");
var SupabaseContext_1 = require("../../contexts/SupabaseContext");
var Icons_1 = require("../ui/Icons");
var Spinner_1 = require("../ui/Spinner");
var ProfileSettings = function () {
    var auth = (0, react_1.useContext)(AuthContext_1.AuthContext);
    var supabase = (0, SupabaseContext_1.useSupabase)().supabase;
    if (!auth || !auth.user) {
        return <div>Cargando perfil...</div>;
    }
    var _a = (0, react_1.useState)({
        nombres: auth.user.nombres || '',
        dni: auth.user.dni || undefined,
        celular: auth.user.celular || undefined,
    }), formData = _a[0], setFormData = _a[1];
    var _b = (0, react_1.useState)({
        newPassword: '',
        confirmPassword: ''
    }), passwordData = _b[0], setPasswordData = _b[1];
    var _c = (0, react_1.useState)(false), isSavingInfo = _c[0], setIsSavingInfo = _c[1];
    var _d = (0, react_1.useState)(false), isSavingPassword = _d[0], setIsSavingPassword = _d[1];
    var _e = (0, react_1.useState)(null), feedback = _e[0], setFeedback = _e[1];
    var handleInfoChange = function (e) {
        var _a;
        setFormData(__assign(__assign({}, formData), (_a = {}, _a[e.target.name] = e.target.value, _a)));
    };
    var handlePasswordChange = function (e) {
        var _a;
        setPasswordData(__assign(__assign({}, passwordData), (_a = {}, _a[e.target.name] = e.target.value, _a)));
    };
    var handleInfoSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, data, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    e.preventDefault();
                    if (!supabase || !auth.user)
                        return [2 /*return*/];
                    setIsSavingInfo(true);
                    setFeedback(null);
                    return [4 /*yield*/, supabase
                            .from('Usuarios')
                            .update({
                            nombres: formData.nombres,
                            dni: formData.dni ? Number(formData.dni) : null,
                            celular: formData.celular ? Number(formData.celular) : null,
                        })
                            .eq('id', auth.user.id)
                            .select()
                            .single()];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        setFeedback({ type: 'error', message: "Error al actualizar: ".concat(error.message) });
                    }
                    else if (data) {
                        auth.updateUser(data);
                        setFeedback({ type: 'success', message: '¡Información actualizada con éxito!' });
                    }
                    setIsSavingInfo(false);
                    return [2 /*return*/];
            }
        });
    }); };
    var handlePasswordSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var error;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!supabase)
                        return [2 /*return*/];
                    if (passwordData.newPassword !== passwordData.confirmPassword) {
                        setFeedback({ type: 'error', message: 'Las contraseñas no coinciden.' });
                        return [2 /*return*/];
                    }
                    if (passwordData.newPassword.length < 6) {
                        setFeedback({ type: 'error', message: 'La contraseña debe tener al menos 6 caracteres.' });
                        return [2 /*return*/];
                    }
                    setIsSavingPassword(true);
                    setFeedback(null);
                    return [4 /*yield*/, supabase.auth.updateUser({ password: passwordData.newPassword })];
                case 1:
                    error = (_a.sent()).error;
                    if (error) {
                        setFeedback({ type: 'error', message: "Error al cambiar contrase\u00F1a: ".concat(error.message) });
                    }
                    else {
                        setFeedback({ type: 'success', message: '¡Contraseña cambiada con éxito!' });
                        setPasswordData({ newPassword: '', confirmPassword: '' });
                    }
                    setIsSavingPassword(false);
                    return [2 /*return*/];
            }
        });
    }); };
    return (<div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold text-base-content">Mi Perfil</h2>
            
            {/* Personal Information Form */}
            <form onSubmit={handleInfoSubmit} className="bg-base-200 p-6 rounded-xl shadow-lg space-y-6 transition-all duration-300 hover:shadow-2xl">
                 <h3 className="text-xl font-semibold border-b border-base-border pb-2">Información Personal</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="nombres" className="block text-sm font-medium">Nombres</label>
                        <input type="text" name="nombres" value={formData.nombres} onChange={handleInfoChange} className="mt-1 block w-full input-style" required/>
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium">Email</label>
                        <input type="email" name="email" value={auth.user.email} className="mt-1 block w-full input-style" disabled/>
                    </div>
                     <div>
                        <label htmlFor="dni" className="block text-sm font-medium">DNI</label>
                        <input type="number" name="dni" value={formData.dni || ''} onChange={handleInfoChange} className="mt-1 block w-full input-style"/>
                    </div>
                     <div>
                        <label htmlFor="celular" className="block text-sm font-medium">Celular</label>
                        <input type="number" name="celular" value={formData.celular || ''} onChange={handleInfoChange} className="mt-1 block w-full input-style"/>
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={isSavingInfo} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-focus disabled:bg-primary/50">
                        {isSavingInfo ? <Spinner_1.default /> : <Icons_1.SaveIcon className="h-5 w-5"/>}
                        {isSavingInfo ? 'Guardando...' : 'Guardar Información'}
                    </button>
                </div>
            </form>

            {/* Change Password Form */}
            <form onSubmit={handlePasswordSubmit} className="bg-base-200 p-6 rounded-xl shadow-lg space-y-6 transition-all duration-300 hover:shadow-2xl">
                <h3 className="text-xl font-semibold border-b border-base-border pb-2">Cambiar Contraseña</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="newPassword">Nueva Contraseña</label>
                        <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} className="mt-1 block w-full input-style" required/>
                    </div>
                     <div>
                        <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                        <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} className="mt-1 block w-full input-style" required/>
                    </div>
                 </div>
                 <div className="flex justify-end pt-4">
                    <button type="submit" disabled={isSavingPassword} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-focus disabled:bg-primary/50">
                        {isSavingPassword ? <Spinner_1.default /> : <Icons_1.LockIcon className="h-5 w-5"/>}
                        {isSavingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
                    </button>
                </div>
            </form>

             {feedback && (<div className={"p-4 rounded-md text-sm ".concat(feedback.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error')}>
                {feedback.message}
                </div>)}
        </div>);
};
exports.default = ProfileSettings;
