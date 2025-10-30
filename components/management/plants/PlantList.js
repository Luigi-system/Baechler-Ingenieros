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
var Icons_1 = require("../../ui/Icons");
var Spinner_1 = require("../../ui/Spinner");
var Modal_1 = require("../../ui/Modal");
var PlantForm_1 = require("./PlantForm");
var PlantList = function () {
    var supabase = (0, SupabaseContext_1.useSupabase)().supabase;
    var _a = (0, react_1.useState)([]), plants = _a[0], setPlants = _a[1];
    var _b = (0, react_1.useState)(true), isLoading = _b[0], setIsLoading = _b[1];
    var _c = (0, react_1.useState)(null), error = _c[0], setError = _c[1];
    var _d = (0, react_1.useState)(false), isModalOpen = _d[0], setIsModalOpen = _d[1];
    var _e = (0, react_1.useState)(null), editingPlant = _e[0], setEditingPlant = _e[1];
    var _f = (0, react_1.useState)(''), searchTerm = _f[0], setSearchTerm = _f[1];
    var fetchPlants = function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, data, error, formattedData;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!supabase)
                        return [2 /*return*/];
                    setIsLoading(true);
                    return [4 /*yield*/, supabase
                            .from('Planta')
                            .select('*, empresa:Empresa(nombre)')
                            .order('nombre')];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        setError(error.message);
                    }
                    else {
                        formattedData = data.map(function (p) { return (__assign(__assign({}, p), { empresa_nombre: p.empresa.nombre })); });
                        setPlants(formattedData);
                    }
                    setIsLoading(false);
                    return [2 /*return*/];
            }
        });
    }); };
    (0, react_1.useEffect)(function () {
        fetchPlants();
    }, [supabase]);
    var filteredPlants = plants.filter(function (plant) {
        return (plant.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (plant.empresa_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (plant.direccion || '').toLowerCase().includes(searchTerm.toLowerCase());
    });
    var handleEdit = function (plant) {
        setEditingPlant(plant);
        setIsModalOpen(true);
    };
    var handleAdd = function () {
        setEditingPlant(null);
        setIsModalOpen(true);
    };
    var handleCloseModal = function () {
        setIsModalOpen(false);
        setEditingPlant(null);
    };
    var onSave = function () {
        fetchPlants();
        handleCloseModal();
    };
    var handleDelete = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var error;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!supabase || !window.confirm('¿Estás seguro de que quieres eliminar esta planta?'))
                        return [2 /*return*/];
                    return [4 /*yield*/, supabase.from('Planta').delete().eq('id', id)];
                case 1:
                    error = (_a.sent()).error;
                    if (error) {
                        alert(error.message);
                    }
                    else {
                        fetchPlants();
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    return (<div className="space-y-6">
            <div className="flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Gestionar Plantas / Sedes</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                       Añade, edita o elimina registros de plantas/sedes.
                    </p>
                </div>
                <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark">
                    <Icons_1.PlusIcon className="h-5 w-5"/>
                    Añadir Planta
                </button>
            </div>
            
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icons_1.SearchIcon className="h-5 w-5 text-gray-400"/>
                </div>
                <input type="text" placeholder="Buscar por nombre de planta, empresa o dirección..." value={searchTerm} onChange={function (e) { return setSearchTerm(e.target.value); }} className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"/>
            </div>

             {isLoading && <div className="flex justify-center"><Spinner_1.default /></div>}
            {error && <p className="text-red-500 text-center">{error}</p>}

            {!isLoading && !error && (<div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
                    <div className="overflow-y-auto max-h-[60vh] relative custom-scrollbar">
                        <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Empresa</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dirección</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredPlants.map(function (plant) { return (<tr key={plant.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white break-words">{plant.nombre}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 break-words">{plant.empresa_nombre || 'N/A'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 break-words">{plant.direccion || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={"px-2 inline-flex text-xs leading-5 font-semibold rounded-full ".concat(plant.estado ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300')}>
                                            {plant.estado ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button onClick={function () { return handleEdit(plant); }} className="text-primary hover:text-primary-dark p-1 rounded-full hover:bg-primary/10 transition"><Icons_1.EditIcon className="h-5 w-5"/></button>
                                        <button onClick={function () { return handleDelete(plant.id); }} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-500/10 transition"><Icons_1.TrashIcon className="h-5 w-5"/></button>
                                    </td>
                                </tr>); })}
                            </tbody>
                        </table>
                    </div>
                 </div>)}
            
            <Modal_1.default isOpen={isModalOpen} onClose={handleCloseModal} title={editingPlant ? 'Editar Planta' : 'Añadir Nueva Planta'}>
                <PlantForm_1.default plant={editingPlant} onSave={onSave} onCancel={handleCloseModal}/>
            </Modal_1.default>
        </div>);
};
exports.default = PlantList;
