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
var SupabaseContext_1 = require("../../../contexts/SupabaseContext");
var Spinner_1 = require("../../ui/Spinner");
var CompanyForm = function (_a) {
    var company = _a.company, onSave = _a.onSave, onCancel = _a.onCancel;
    var supabase = (0, SupabaseContext_1.useSupabase)().supabase;
    var _b = (0, react_1.useState)(company || {
        nombre: '',
        direccion: '',
        distrito: '',
        ruc: '',
    }), formData = _b[0], setFormData = _b[1];
    var _c = (0, react_1.useState)(false), isSaving = _c[0], setIsSaving = _c[1];
    var handleChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value;
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
        });
    };
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var request, _a, data, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    e.preventDefault();
                    if (!supabase || !formData.nombre)
                        return [2 /*return*/];
                    setIsSaving(true);
                    request = company
                        ? supabase.from('Empresa').update(formData).eq('id', company.id)
                        : supabase.from('Empresa').insert([formData]);
                    return [4 /*yield*/, request.select().single()];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    setIsSaving(false);
                    if (!error) return [3 /*break*/, 2];
                    alert("Error: ".concat(error.message));
                    return [3 /*break*/, 4];
                case 2:
                    if (!data) return [3 /*break*/, 4];
                    return [4 /*yield*/, onSave(data)];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (<form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="nombre" className="block text-sm font-medium">Nombre de la Empresa</label>
                <input type="text" name="nombre" id="nombre" value={formData.nombre || ''} onChange={handleChange} required className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"/>
            </div>
            <div>
                <label htmlFor="ruc" className="block text-sm font-medium">RUC</label>
                <input type="text" name="ruc" id="ruc" value={formData.ruc || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"/>
            </div>
            <div>
                <label htmlFor="direccion" className="block text-sm font-medium">Dirección</label>
                <input type="text" name="direccion" id="direccion" value={formData.direccion || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"/>
            </div>
            <div>
                <label htmlFor="distrito" className="block text-sm font-medium">Distrito</label>
                <input type="text" name="distrito" id="distrito" value={formData.distrito || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"/>
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving} className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-primary/50 flex items-center">
                    {isSaving && <Spinner_1.default />}
                    {isSaving ? 'Guardando...' : 'Guardar Empresa'}
                </button>
            </div>
        </form>);
};
exports.default = CompanyForm;
