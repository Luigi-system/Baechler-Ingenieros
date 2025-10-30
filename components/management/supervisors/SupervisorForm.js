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
var SupervisorForm = function (_a) {
    var supervisor = _a.supervisor, onSave = _a.onSave, onCancel = _a.onCancel;
    var supabase = (0, SupabaseContext_1.useSupabase)().supabase;
    var _b = (0, react_1.useState)(supervisor || {
        nombre: '',
        apellido: '',
        email: '',
        celular: undefined,
        id_empresa: undefined,
        id_planta: undefined,
    }), formData = _b[0], setFormData = _b[1];
    var _c = (0, react_1.useState)([]), companies = _c[0], setCompanies = _c[1];
    var _d = (0, react_1.useState)([]), allPlants = _d[0], setAllPlants = _d[1];
    var _e = (0, react_1.useState)([]), filteredPlants = _e[0], setFilteredPlants = _e[1];
    var _f = (0, react_1.useState)(false), isSaving = _f[0], setIsSaving = _f[1];
    var _g = (0, react_1.useState)(true), isLoadingData = _g[0], setIsLoadingData = _g[1];
    (0, react_1.useEffect)(function () {
        var fetchData = function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, companiesData, companiesError, _b, plantsData, plantsError;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!supabase)
                            return [2 /*return*/];
                        setIsLoadingData(true);
                        return [4 /*yield*/, supabase.from('Empresa').select('id, nombre')];
                    case 1:
                        _a = _c.sent(), companiesData = _a.data, companiesError = _a.error;
                        return [4 /*yield*/, supabase.from('Planta').select('id, nombre, id_empresa')];
                    case 2:
                        _b = _c.sent(), plantsData = _b.data, plantsError = _b.error;
                        if (!companiesError && companiesData) {
                            setCompanies(companiesData);
                            if (!supervisor && companiesData.length > 0) {
                                setFormData(function (prev) { return (__assign(__assign({}, prev), { id_empresa: companiesData[0].id })); });
                            }
                        }
                        if (!plantsError && plantsData) {
                            setAllPlants(plantsData);
                        }
                        setIsLoadingData(false);
                        return [2 /*return*/];
                }
            });
        }); };
        fetchData();
    }, [supabase, supervisor]);
    (0, react_1.useEffect)(function () {
        if (formData.id_empresa) {
            var relevantPlants = allPlants.filter(function (p) { return p.id_empresa === Number(formData.id_empresa); });
            setFilteredPlants(relevantPlants);
            if (formData.id_planta && !relevantPlants.some(function (p) { return p.id === formData.id_planta; })) {
                setFormData(function (prev) { return (__assign(__assign({}, prev), { id_planta: undefined })); });
            }
        }
        else {
            setFilteredPlants([]);
        }
    }, [formData.id_empresa, allPlants]);
    var handleChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value;
        if (name === 'id_empresa') {
            setFormData(function (prev) { return (__assign(__assign({}, prev), { id_empresa: Number(value), id_planta: undefined })); });
        }
        else {
            setFormData(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
            });
        }
    };
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var payload, _a, data, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    e.preventDefault();
                    if (!supabase || !formData.nombre || !formData.id_planta || !formData.id_empresa) {
                        alert("Por favor, proporciona un nombre y selecciona una empresa y planta.");
                        return [2 /*return*/];
                    }
                    setIsSaving(true);
                    payload = __assign(__assign({}, formData), { id_planta: Number(formData.id_planta), id_empresa: Number(formData.id_empresa), celular: formData.celular ? Number(formData.celular) : null });
                    return [4 /*yield*/, (supervisor
                            ? supabase.from('Encargado').update(payload).eq('id', supervisor.id)
                            : supabase.from('Encargado').insert([payload])).select().single()];
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
    if (isLoadingData)
        return <div className="flex justify-center"><Spinner_1.default /></div>;
    return (<form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label htmlFor="id_empresa" className="block text-sm font-medium">Empresa</label>
                <select name="id_empresa" id="id_empresa" value={formData.id_empresa || ''} onChange={handleChange} required className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600">
                    <option value="" disabled>Selecciona una empresa</option>
                    {companies.map(function (c) { return <option key={c.id} value={c.id}>{c.nombre}</option>; })}
                </select>
            </div>
             <div>
                <label htmlFor="id_planta" className="block text-sm font-medium">Planta</label>
                <select name="id_planta" id="id_planta" value={formData.id_planta || ''} onChange={handleChange} required disabled={!formData.id_empresa || filteredPlants.length === 0} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-600">
                    <option value="" disabled>Selecciona una planta</option>
                    {filteredPlants.map(function (p) { return <option key={p.id} value={p.id}>{p.nombre}</option>; })}
                </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="nombre" className="block text-sm font-medium">Nombres</label>
                    <input type="text" name="nombre" id="nombre" value={formData.nombre || ''} onChange={handleChange} required className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                <div>
                    <label htmlFor="apellido" className="block text-sm font-medium">Apellidos</label>
                    <input type="text" name="apellido" id="apellido" value={formData.apellido || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                </div>
            </div>
             <div>
                <label htmlFor="email" className="block text-sm font-medium">Email</label>
                <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"/>
            </div>
            <div>
                <label htmlFor="celular" className="block text-sm font-medium">Celular</label>
                <input type="number" name="celular" id="celular" value={formData.celular || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"/>
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving} className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-primary/50 flex items-center">
                    {isSaving && <Spinner_1.default />}
                    {isSaving ? 'Guardando...' : 'Guardar Encargado'}
                </button>
            </div>
        </form>);
};
exports.default = SupervisorForm;
