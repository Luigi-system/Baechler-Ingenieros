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
var MachineForm_1 = require("./MachineForm");
var MachineList = function () {
    var supabase = (0, SupabaseContext_1.useSupabase)().supabase;
    // Data states
    var _a = (0, react_1.useState)([]), machines = _a[0], setMachines = _a[1];
    var _b = (0, react_1.useState)([]), companies = _b[0], setCompanies = _b[1];
    var _c = (0, react_1.useState)([]), plants = _c[0], setPlants = _c[1];
    // UI states
    var _d = (0, react_1.useState)(true), isLoading = _d[0], setIsLoading = _d[1];
    var _e = (0, react_1.useState)(null), error = _e[0], setError = _e[1];
    var _f = (0, react_1.useState)(false), isModalOpen = _f[0], setIsModalOpen = _f[1];
    var _g = (0, react_1.useState)(null), editingMachine = _g[0], setEditingMachine = _g[1];
    // Filter states
    var _h = (0, react_1.useState)(''), searchTerm = _h[0], setSearchTerm = _h[1];
    var _j = (0, react_1.useState)('all'), selectedCompany = _j[0], setSelectedCompany = _j[1];
    var _k = (0, react_1.useState)('all'), selectedPlant = _k[0], setSelectedPlant = _k[1];
    var _l = (0, react_1.useState)('all'), selectedBrand = _l[0], setSelectedBrand = _l[1];
    var _m = (0, react_1.useState)('all'), selectedStatus = _m[0], setSelectedStatus = _m[1];
    var fetchData = function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, machinesRes, companiesRes, plantsRes, formattedMachines, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!supabase)
                        return [2 /*return*/];
                    setIsLoading(true);
                    setError(null);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, Promise.all([
                            supabase.from('Maquinas').select('*, planta:Planta(nombre), empresa:Empresa(nombre)').order('serie'),
                            supabase.from('Empresa').select('id, nombre').order('nombre'),
                            supabase.from('Planta').select('id, nombre, id_empresa').order('nombre')
                        ])];
                case 2:
                    _a = _b.sent(), machinesRes = _a[0], companiesRes = _a[1], plantsRes = _a[2];
                    if (machinesRes.error)
                        throw machinesRes.error;
                    if (companiesRes.error)
                        throw companiesRes.error;
                    if (plantsRes.error)
                        throw plantsRes.error;
                    formattedMachines = machinesRes.data.map(function (m) {
                        var _a, _b;
                        return (__assign(__assign({}, m), { planta_nombre: (_a = m.planta) === null || _a === void 0 ? void 0 : _a.nombre, empresa_nombre: (_b = m.empresa) === null || _b === void 0 ? void 0 : _b.nombre }));
                    });
                    setMachines(formattedMachines);
                    setCompanies(companiesRes.data);
                    setPlants(plantsRes.data);
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _b.sent();
                    setError(err_1.message);
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    (0, react_1.useEffect)(function () {
        fetchData();
    }, [supabase]);
    var availablePlants = (0, react_1.useMemo)(function () {
        if (selectedCompany === 'all')
            return plants;
        return plants.filter(function (p) { return p.id_empresa === parseInt(selectedCompany); });
    }, [selectedCompany, plants]);
    var availableBrands = (0, react_1.useMemo)(function () {
        var brands = new Set(machines.map(function (m) { return m.marca; }).filter(Boolean));
        return Array.from(brands).sort();
    }, [machines]);
    var filteredMachines = (0, react_1.useMemo)(function () {
        return machines.filter(function (machine) {
            var searchMatch = searchTerm === '' ||
                (machine.serie || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (machine.modelo || '').toLowerCase().includes(searchTerm.toLowerCase());
            var companyMatch = selectedCompany === 'all' || machine.id_empresa === parseInt(selectedCompany);
            var plantMatch = selectedPlant === 'all' || machine.id_planta === parseInt(selectedPlant);
            // FIX: Replaced 'selected' with 'selectedBrand' to fix a typo causing a compilation error.
            var brandMatch = selectedBrand === 'all' || machine.marca === selectedBrand;
            var statusMatch = selectedStatus === 'all' ||
                (selectedStatus === 'active' && machine.estado) ||
                (selectedStatus === 'inactive' && !machine.estado);
            return searchMatch && companyMatch && plantMatch && brandMatch && statusMatch;
        });
    }, [machines, searchTerm, selectedCompany, selectedPlant, selectedBrand, selectedStatus]);
    var handleClearFilters = function () {
        setSearchTerm('');
        setSelectedCompany('all');
        setSelectedPlant('all');
        setSelectedBrand('all');
        setSelectedStatus('all');
    };
    var handleEdit = function (machine) {
        setEditingMachine(machine);
        setIsModalOpen(true);
    };
    var handleAdd = function () {
        setEditingMachine(null);
        setIsModalOpen(true);
    };
    var handleCloseModal = function () {
        setIsModalOpen(false);
        setEditingMachine(null);
    };
    // FIX: Updated onSave to match the new signature of MachineForm's onSave prop.
    var onSave = function (_machine) {
        fetchData();
        handleCloseModal();
    };
    var handleDelete = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var error;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!supabase || !window.confirm('¿Estás seguro de que quieres eliminar esta máquina?'))
                        return [2 /*return*/];
                    return [4 /*yield*/, supabase.from('Maquinas').delete().eq('id', id)];
                case 1:
                    error = (_a.sent()).error;
                    if (error) {
                        alert(error.message);
                    }
                    else {
                        fetchData();
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    return (<div className="space-y-6">
            <div className="flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Gestionar Máquinas</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                       Añade, edita o elimina registros de máquinas.
                    </p>
                </div>
                <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark">
                    <Icons_1.PlusIcon className="h-5 w-5"/>
                    Añadir Máquina
                </button>
            </div>
            
            {/* Advanced Filters */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Company Filter */}
                    <div>
                        <label htmlFor="company-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Empresa</label>
                        <select id="company-filter" value={selectedCompany} onChange={function (e) { setSelectedCompany(e.target.value); setSelectedPlant('all'); }} className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                           <option value="all">Todas las empresas</option>
                           {companies.map(function (c) { return <option key={c.id} value={c.id}>{c.nombre}</option>; })}
                        </select>
                    </div>
                     {/* Plant Filter */}
                    <div>
                        <label htmlFor="plant-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Planta</label>
                        <select id="plant-filter" value={selectedPlant} onChange={function (e) { return setSelectedPlant(e.target.value); }} disabled={selectedCompany === 'all'} className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:bg-gray-200 dark:disabled:bg-gray-600">
                           <option value="all">Todas las plantas</option>
                           {availablePlants.map(function (p) { return <option key={p.id} value={p.id}>{p.nombre}</option>; })}
                        </select>
                    </div>
                     {/* Brand Filter */}
                    <div>
                        <label htmlFor="brand-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Marca</label>
                        <select id="brand-filter" value={selectedBrand} onChange={function (e) { return setSelectedBrand(e.target.value); }} className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                           <option value="all">Todas las marcas</option>
                           {availableBrands.map(function (b) { return <option key={b} value={b}>{b}</option>; })}
                        </select>
                    </div>
                     {/* Text Search */}
                     <div className="relative">
                        <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Serie / Modelo</label>
                        <Icons_1.SearchIcon className="absolute top-9 left-3 h-5 w-5 text-gray-400 pointer-events-none"/>
                        <input type="text" id="search-filter" placeholder="Buscar..." value={searchTerm} onChange={function (e) { return setSearchTerm(e.target.value); }} className="mt-1 block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"/>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                    {/* Status Filter */}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado:</span>
                        <div className="inline-flex rounded-md shadow-sm" role="group">
                            <button type="button" onClick={function () { return setSelectedStatus('all'); }} className={"py-1 px-3 text-sm font-medium rounded-l-lg border ".concat(selectedStatus === 'all' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600')}>Todos</button>
                            <button type="button" onClick={function () { return setSelectedStatus('active'); }} className={"py-1 px-3 text-sm font-medium border-t border-b ".concat(selectedStatus === 'active' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600')}>Activos</button>
                            <button type="button" onClick={function () { return setSelectedStatus('inactive'); }} className={"py-1 px-3 text-sm font-medium rounded-r-md border ".concat(selectedStatus === 'inactive' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600')}>Inactivos</button>
                        </div>
                    </div>
                     {/* Clear Filters Button */}
                     <button onClick={handleClearFilters} className="flex items-center gap-1 text-sm text-primary hover:underline">
                        <Icons_1.XIcon className="h-4 w-4"/>
                        Limpiar Filtros
                    </button>
                </div>

            </div>

             {isLoading && <div className="flex justify-center"><Spinner_1.default /></div>}
            {error && <p className="text-red-500 text-center">{error}</p>}

            {!isLoading && !error && (<>
                 <p className="text-sm text-gray-500 dark:text-gray-400">Mostrando {filteredMachines.length} de {machines.length} máquinas.</p>
                 <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
                    <div className="overflow-y-auto max-h-[60vh] relative custom-scrollbar">
                        <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">N° de Serie</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Modelo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Empresa</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Planta</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredMachines.length > 0 ? (filteredMachines.map(function (machine) { return (<tr key={machine.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{machine.serie}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 break-words">{machine.modelo || 'N/A'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 break-words">{machine.empresa_nombre || 'N/A'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 break-words">{machine.planta_nombre || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={"px-2 inline-flex text-xs leading-5 font-semibold rounded-full ".concat(machine.estado ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300')}>
                                                {machine.estado ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={function () { return handleEdit(machine); }} className="text-primary hover:text-primary-dark p-1 rounded-full hover:bg-primary/10 transition"><Icons_1.EditIcon className="h-5 w-5"/></button>
                                            <button onClick={function () { return handleDelete(machine.id); }} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-500/10 transition"><Icons_1.TrashIcon className="h-5 w-5"/></button>
                                        </td>
                                    </tr>); })) : (<tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            No se encontraron máquinas que coincidan con los filtros.
                                        </td>
                                    </tr>)}
                            </tbody>
                        </table>
                    </div>
                 </div>
                 </>)}
            
            <Modal_1.default isOpen={isModalOpen} onClose={handleCloseModal} title={editingMachine ? 'Editar Máquina' : 'Añadir Nueva Máquina'}>
                <MachineForm_1.default machine={editingMachine} onSave={onSave} onCancel={handleCloseModal}/>
            </Modal_1.default>
        </div>);
};
exports.default = MachineList;
