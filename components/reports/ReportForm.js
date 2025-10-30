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
var genai_1 = require("@google/genai");
var Icons_1 = require("../ui/Icons");
var Spinner_1 = require("../ui/Spinner");
var Modal_1 = require("../ui/Modal");
var CompanyForm_1 = require("../management/companies/CompanyForm");
var MachineForm_1 = require("../management/machines/MachineForm");
var PlantForm_1 = require("../management/plants/PlantForm");
var SupervisorForm_1 = require("../management/supervisors/SupervisorForm");
var ImageUpload_1 = require("../ui/ImageUpload"); // Import the new reusable component
var SupabaseContext_1 = require("../../contexts/SupabaseContext");
var AuthContext_1 = require("../../contexts/AuthContext");
var ThemeContext_1 = require("../../contexts/ThemeContext");
var AiServiceContext_1 = require("../../contexts/AiServiceContext");
var pdfGenerator_1 = require("../../services/pdfGenerator");
var fileToBase64 = function (file) { return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () { return resolve(reader.result); };
    reader.onerror = function (error) { return reject(error); };
}); };
// Main Form Component
var ReportForm = function (_a) {
    var reportId = _a.reportId, onBack = _a.onBack;
    var supabase = (0, SupabaseContext_1.useSupabase)().supabase;
    var auth = (0, react_1.useContext)(AuthContext_1.AuthContext);
    var logoUrl = (0, ThemeContext_1.useTheme)().logoUrl;
    var _b = (0, AiServiceContext_1.useAiService)(), service = _b.service, geminiClient = _b.geminiClient, openaiClient = _b.openaiClient, isConfigured = _b.isConfigured;
    var _c = (0, react_1.useState)({ fecha: new Date().toISOString().split('T')[0], estado: false }), formData = _c[0], setFormData = _c[1];
    var _d = (0, react_1.useState)(false), isSubmitting = _d[0], setIsSubmitting = _d[1];
    var _e = (0, react_1.useState)(false), isDownloadingPdf = _e[0], setIsDownloadingPdf = _e[1];
    // Relational Data
    var _f = (0, react_1.useState)([]), companies = _f[0], setCompanies = _f[1];
    var _g = (0, react_1.useState)([]), plants = _g[0], setPlants = _g[1];
    var _h = (0, react_1.useState)([]), machines = _h[0], setMachines = _h[1];
    var _j = (0, react_1.useState)([]), supervisors = _j[0], setSupervisors = _j[1];
    // File states
    var _k = (0, react_1.useState)([]), fotosProblemas = _k[0], setFotosProblemas = _k[1];
    var _l = (0, react_1.useState)([]), fotosAcciones = _l[0], setFotosAcciones = _l[1];
    var _m = (0, react_1.useState)([]), fotosObservaciones = _m[0], setFotosObservaciones = _m[1];
    var _o = (0, react_1.useState)([]), fotoFirma = _o[0], setFotoFirma = _o[1];
    // UI States
    var _p = (0, react_1.useState)(false), isAiLoading = _p[0], setIsAiLoading = _p[1];
    var _q = (0, react_1.useState)(true), isDataLoading = _q[0], setIsDataLoading = _q[1];
    var _r = (0, react_1.useState)(null), aiError = _r[0], setAiError = _r[1];
    var _s = (0, react_1.useState)(null), fileName = _s[0], setFileName = _s[1];
    var _t = (0, react_1.useState)(false), isPlantsLoading = _t[0], setIsPlantsLoading = _t[1];
    var _u = (0, react_1.useState)(false), isMachinesAndSupervisorsLoading = _u[0], setIsMachinesAndSupervisorsLoading = _u[1];
    // Simulator States
    var _v = (0, react_1.useState)(true), isSimulatorVisible = _v[0], setIsSimulatorVisible = _v[1];
    var _w = (0, react_1.useState)(null), pdfPreviewUri = _w[0], setPdfPreviewUri = _w[1];
    var _x = (0, react_1.useState)(false), isPdfLoading = _x[0], setIsPdfLoading = _x[1];
    var debounceTimeout = (0, react_1.useRef)(null);
    // Autocomplete/Modal States
    var _y = (0, react_1.useState)(''), companySearchText = _y[0], setCompanySearchText = _y[1];
    var _z = (0, react_1.useState)(''), plantSearchText = _z[0], setPlantSearchText = _z[1];
    var _0 = (0, react_1.useState)(''), machineSearchText = _0[0], setMachineSearchText = _0[1];
    var _1 = (0, react_1.useState)(''), supervisorSearchText = _1[0], setSupervisorSearchText = _1[1];
    var _2 = (0, react_1.useState)(false), showCompanySuggestions = _2[0], setShowCompanySuggestions = _2[1];
    var _3 = (0, react_1.useState)(false), showPlantSuggestions = _3[0], setShowPlantSuggestions = _3[1];
    var _4 = (0, react_1.useState)(false), showMachineSuggestions = _4[0], setShowMachineSuggestions = _4[1];
    var _5 = (0, react_1.useState)(false), showSupervisorSuggestions = _5[0], setShowSupervisorSuggestions = _5[1];
    var _6 = (0, react_1.useState)(false), isNewCompanyModalOpen = _6[0], setIsNewCompanyModalOpen = _6[1];
    var _7 = (0, react_1.useState)(false), isCompanySearchModalOpen = _7[0], setIsCompanySearchModalOpen = _7[1];
    var _8 = (0, react_1.useState)(false), isNewPlantModalOpen = _8[0], setIsNewPlantModalOpen = _8[1];
    var _9 = (0, react_1.useState)(false), isPlantSearchModalOpen = _9[0], setIsPlantSearchModalOpen = _9[1];
    var _10 = (0, react_1.useState)(false), isNewMachineModalOpen = _10[0], setIsNewMachineModalOpen = _10[1];
    var _11 = (0, react_1.useState)(false), isMachineSearchModalOpen = _11[0], setIsMachineSearchModalOpen = _11[1];
    var _12 = (0, react_1.useState)(false), isNewSupervisorModalOpen = _12[0], setIsNewSupervisorModalOpen = _12[1];
    var _13 = (0, react_1.useState)(false), isSupervisorSearchModalOpen = _13[0], setIsSupervisorSearchModalOpen = _13[1];
    var fetchDropdownData = (0, react_1.useCallback)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, companyRes, plantRes, machineRes, supervisorRes, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!supabase)
                        return [2 /*return*/, { companies: [], plants: [], machines: [], supervisors: [] }];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, Promise.all([
                            supabase.from('Empresa').select('*'),
                            supabase.from('Planta').select('*'),
                            supabase.from('Maquinas').select('*'),
                            supabase.from('Encargado').select('*'),
                        ])];
                case 2:
                    _a = _b.sent(), companyRes = _a[0], plantRes = _a[1], machineRes = _a[2], supervisorRes = _a[3];
                    if (companyRes.error)
                        throw companyRes.error;
                    if (plantRes.error)
                        throw plantRes.error;
                    if (machineRes.error)
                        throw machineRes.error;
                    if (supervisorRes.error)
                        throw supervisorRes.error;
                    setCompanies(companyRes.data);
                    setPlants(plantRes.data);
                    setMachines(machineRes.data);
                    setSupervisors(supervisorRes.data);
                    return [2 /*return*/, { companies: companyRes.data, plants: plantRes.data, machines: machineRes.data, supervisors: supervisorRes.data }];
                case 3:
                    error_1 = _b.sent();
                    console.error("Error fetching dropdown data", error_1);
                    return [2 /*return*/, { companies: [], plants: [], machines: [], supervisors: [] }];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [supabase]);
    (0, react_1.useEffect)(function () {
        var fetchInitialData = function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, companies, plants, machines, supervisors, _b, reportData_1, error, matchingPlant, formDataToSet, company, supervisor;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!supabase)
                            return [2 /*return*/];
                        setIsDataLoading(true);
                        return [4 /*yield*/, fetchDropdownData()];
                    case 1:
                        _a = _c.sent(), companies = _a.companies, plants = _a.plants, machines = _a.machines, supervisors = _a.supervisors;
                        if (!reportId) return [3 /*break*/, 3];
                        return [4 /*yield*/, supabase
                                .from('Reporte_Servicio')
                                .select('*')
                                .eq('id', reportId)
                                .single()];
                    case 2:
                        _b = _c.sent(), reportData_1 = _b.data, error = _b.error;
                        if (error) {
                            console.error("Error fetching report for editing:", error);
                            alert("No se pudo cargar el reporte para editar.");
                        }
                        else if (reportData_1) {
                            matchingPlant = plants.find(function (p) {
                                return p.id_empresa === reportData_1.id_empresa &&
                                    p.nombre === reportData_1.nombre_planta;
                            });
                            formDataToSet = __assign(__assign({}, reportData_1), { id_planta: matchingPlant === null || matchingPlant === void 0 ? void 0 : matchingPlant.id });
                            if (reportData_1.operativo)
                                formDataToSet.estado_maquina = 'operativo';
                            else if (reportData_1.inoperativo)
                                formDataToSet.estado_maquina = 'inoperativo';
                            else if (reportData_1.en_prueba)
                                formDataToSet.estado_maquina = 'en_prueba';
                            if (reportData_1.con_garantia)
                                formDataToSet.estado_garantia = 'con_garantia';
                            else if (reportData_1.sin_garantia)
                                formDataToSet.estado_garantia = 'sin_garantia';
                            if (reportData_1.facturado)
                                formDataToSet.estado_facturacion = 'facturado';
                            else if (reportData_1.no_facturado)
                                formDataToSet.estado_facturacion = 'no_facturado';
                            formDataToSet.nombre_firmante = reportData_1.nombre_usuario;
                            formDataToSet.celular_firmante = reportData_1.celular_usuario;
                            setFormData(formDataToSet);
                            company = companies.find(function (c) { return c.id === reportData_1.id_empresa; });
                            if (company)
                                setCompanySearchText(company.nombre);
                            if (matchingPlant)
                                setPlantSearchText(matchingPlant.nombre);
                            if (reportData_1.serie_maquina)
                                setMachineSearchText(reportData_1.serie_maquina);
                            supervisor = supervisors.find(function (s) { return s.id === reportData_1.id_encargado; });
                            if (supervisor)
                                setSupervisorSearchText("".concat(supervisor.nombre, " ").concat(supervisor.apellido || ''));
                        }
                        _c.label = 3;
                    case 3:
                        setIsDataLoading(false);
                        return [2 /*return*/];
                }
            });
        }); };
        fetchInitialData();
    }, [supabase, reportId, fetchDropdownData]);
    // PDF Preview Generation (Debounced)
    (0, react_1.useEffect)(function () {
        if (debounceTimeout.current)
            clearTimeout(debounceTimeout.current);
        setIsPdfLoading(true);
        debounceTimeout.current = window.setTimeout(function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, fotosProblemasBase64, fotosAccionesBase64, fotosObservacionesBase64, fotoFirmaBase64, enrichedData, uri, e_1;
            var _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _f.trys.push([0, 3, 4, 5]);
                        return [4 /*yield*/, Promise.all([
                                Promise.all(fotosProblemas.map(fileToBase64)),
                                Promise.all(fotosAcciones.map(fileToBase64)),
                                Promise.all(fotosObservaciones.map(fileToBase64)),
                                fotoFirma[0] ? fileToBase64(fotoFirma[0]) : Promise.resolve(undefined),
                            ])];
                    case 1:
                        _a = _f.sent(), fotosProblemasBase64 = _a[0], fotosAccionesBase64 = _a[1], fotosObservacionesBase64 = _a[2], fotoFirmaBase64 = _a[3];
                        enrichedData = __assign(__assign({}, formData), { empresa: (_b = companies.find(function (c) { return c.id === formData.id_empresa; })) !== null && _b !== void 0 ? _b : null, encargado: (_c = supervisors.find(function (s) { return s.id === formData.id_encargado; })) !== null && _c !== void 0 ? _c : null, usuario: { nombres: (_e = (_d = auth === null || auth === void 0 ? void 0 : auth.user) === null || _d === void 0 ? void 0 : _d.nombres) !== null && _e !== void 0 ? _e : 'N/A' }, fotosProblemasBase64: fotosProblemasBase64, fotosAccionesBase64: fotosAccionesBase64, fotosObservacionesBase64: fotosObservacionesBase64, fotoFirmaBase64: fotoFirmaBase64 });
                        return [4 /*yield*/, (0, pdfGenerator_1.generateServiceReport)(enrichedData, logoUrl, 'datauristring')];
                    case 2:
                        uri = _f.sent();
                        setPdfPreviewUri(uri);
                        return [3 /*break*/, 5];
                    case 3:
                        e_1 = _f.sent();
                        console.error("Error generating PDF preview:", e_1);
                        setPdfPreviewUri(null); // Clear preview on error
                        return [3 /*break*/, 5];
                    case 4:
                        setIsPdfLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        }); }, 500);
    }, [formData, companies, supervisors, logoUrl, auth === null || auth === void 0 ? void 0 : auth.user, fotosProblemas, fotosAcciones, fotosObservaciones, fotoFirma]);
    // Memoized lists for dependent dropdowns and suggestions
    var filteredPlants = (0, react_1.useMemo)(function () { return plants.filter(function (p) { return p.id_empresa === formData.id_empresa; }); }, [plants, formData.id_empresa]);
    var filteredMachines = (0, react_1.useMemo)(function () { return machines.filter(function (m) { return m.id_planta === formData.id_planta; }); }, [machines, formData.id_planta]);
    var filteredSupervisors = (0, react_1.useMemo)(function () { return supervisors.filter(function (s) { return s.id_planta === formData.id_planta; }); }, [supervisors, formData.id_planta]);
    var companySuggestions = (0, react_1.useMemo)(function () { return companySearchText ? companies.filter(function (c) { return (c.nombre || '').toLowerCase().includes(companySearchText.toLowerCase()); }).slice(0, 5) : []; }, [companySearchText, companies]);
    var plantSuggestions = (0, react_1.useMemo)(function () { return plantSearchText ? filteredPlants.filter(function (p) { return (p.nombre || '').toLowerCase().includes(plantSearchText.toLowerCase()); }).slice(0, 5) : []; }, [plantSearchText, filteredPlants]);
    var machineSuggestions = (0, react_1.useMemo)(function () { return machineSearchText ? filteredMachines.filter(function (m) { return (m.serie || '').toLowerCase().includes(machineSearchText.toLowerCase()); }).slice(0, 5) : []; }, [machineSearchText, filteredMachines]);
    var supervisorSuggestions = (0, react_1.useMemo)(function () { return supervisorSearchText ? filteredSupervisors.filter(function (s) { return "".concat(s.nombre || '', " ").concat(s.apellido || '').toLowerCase().includes(supervisorSearchText.toLowerCase()); }).slice(0, 5) : []; }, [supervisorSearchText, filteredSupervisors]);
    // Handlers
    var handleChange = (0, react_1.useCallback)(function (e) {
        var _a = e.target, name = _a.name, value = _a.value, type = _a.type;
        if (type === 'checkbox') {
            setFormData(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = e.target.checked, _a)));
            });
        }
        else {
            setFormData(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
            });
        }
    }, []);
    var handleRadioChange = (0, react_1.useCallback)(function (name, value) { return setFormData(function (prev) {
        var _a;
        return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
    }); }, []);
    var handleSelectCompany = (0, react_1.useCallback)(function (company) {
        setIsPlantsLoading(true);
        setFormData(function (prev) { return (__assign(__assign({}, prev), { id_empresa: company.id, id_planta: undefined, serie_maquina: undefined, modelo_maquina: undefined, marca_maquina: undefined, linea_maquina: undefined, id_encargado: undefined })); });
        setCompanySearchText(company.nombre);
        setPlantSearchText('');
        setMachineSearchText('');
        setSupervisorSearchText('');
        setShowCompanySuggestions(false);
        setIsCompanySearchModalOpen(false);
        setTimeout(function () { return setIsPlantsLoading(false); }, 300);
    }, []);
    var handleSelectPlant = (0, react_1.useCallback)(function (plant) {
        setIsMachinesAndSupervisorsLoading(true);
        setFormData(function (prev) { return (__assign(__assign({}, prev), { id_planta: plant.id, serie_maquina: undefined, modelo_maquina: undefined, marca_maquina: undefined, linea_maquina: undefined, id_encargado: undefined })); });
        setPlantSearchText(plant.nombre);
        setMachineSearchText('');
        setSupervisorSearchText('');
        setShowPlantSuggestions(false);
        setIsPlantSearchModalOpen(false);
        setTimeout(function () { return setIsMachinesAndSupervisorsLoading(false); }, 300);
    }, []);
    var handleSelectMachine = (0, react_1.useCallback)(function (machine) {
        setFormData(function (prev) { return (__assign(__assign({}, prev), { serie_maquina: machine.serie, modelo_maquina: machine.modelo, marca_maquina: machine.marca, linea_maquina: machine.linea })); });
        setMachineSearchText(machine.serie);
        setShowMachineSuggestions(false);
        setIsMachineSearchModalOpen(false);
    }, []);
    var handleSelectSupervisor = (0, react_1.useCallback)(function (supervisor) {
        setFormData(function (prev) { return (__assign(__assign({}, prev), { id_encargado: supervisor.id })); });
        setSupervisorSearchText("".concat(supervisor.nombre, " ").concat(supervisor.apellido || ''));
        setShowSupervisorSuggestions(false);
        setIsSupervisorSearchModalOpen(false);
    }, []);
    var handleCompanySaved = (0, react_1.useCallback)(function (newCompany) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchDropdownData()];
                case 1:
                    _a.sent();
                    handleSelectCompany(newCompany);
                    setIsNewCompanyModalOpen(false);
                    return [2 /*return*/];
            }
        });
    }); }, [fetchDropdownData, handleSelectCompany]);
    var handlePlantSaved = (0, react_1.useCallback)(function (newPlant) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchDropdownData()];
                case 1:
                    _a.sent();
                    handleSelectPlant(newPlant);
                    setIsNewPlantModalOpen(false);
                    return [2 /*return*/];
            }
        });
    }); }, [fetchDropdownData, handleSelectPlant]);
    var handleMachineSaved = (0, react_1.useCallback)(function (newMachine) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchDropdownData()];
                case 1:
                    _a.sent();
                    handleSelectMachine(newMachine);
                    setIsNewMachineModalOpen(false);
                    return [2 /*return*/];
            }
        });
    }); }, [fetchDropdownData, handleSelectMachine]);
    var handleSupervisorSaved = (0, react_1.useCallback)(function (newSupervisor) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchDropdownData()];
                case 1:
                    _a.sent();
                    handleSelectSupervisor(newSupervisor);
                    setIsNewSupervisorModalOpen(false);
                    return [2 /*return*/];
            }
        });
    }); }, [fetchDropdownData, handleSelectSupervisor]);
    var handleAiFileChange = function (event) { return __awaiter(void 0, void 0, void 0, function () {
        var file, base64Data, textPrompt, parsed_1, response, response, content, companyNameToFind_1, foundCompany, machineSerieToFind_1, foundMachine_1, company, e_2;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
                    if (!file)
                        return [2 /*return*/];
                    setFileName(file.name);
                    setIsAiLoading(true);
                    setAiError(null);
                    if (!isConfigured(service)) {
                        setAiError("El servicio de IA (".concat(service, ") no est\u00E1 configurado."));
                        setIsAiLoading(false);
                        return [2 /*return*/];
                    }
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 8, 9, 10]);
                    return [4 /*yield*/, fileToBase64(file)];
                case 2:
                    base64Data = _d.sent();
                    textPrompt = "Del documento adjunto, extrae la siguiente información: codigo_reporte, fecha (YYYY-MM-DD), entrada (HH:MM), salida (HH:MM), nombre_empresa, serie_maquina, modelo_maquina, problemas_encontrados, acciones_realizadas, observaciones. Proporciona la salida en formato JSON.";
                    if (!(service === 'gemini' && geminiClient)) return [3 /*break*/, 4];
                    return [4 /*yield*/, geminiClient.models.generateContent({
                            model: "gemini-2.5-flash",
                            contents: [{ parts: [{ inlineData: { mimeType: file.type, data: base64Data.split(',')[1] } }, { text: textPrompt }] }],
                            config: {
                                responseMimeType: "application/json",
                                responseSchema: {
                                    type: genai_1.Type.OBJECT,
                                    properties: {
                                        codigo_reporte: { type: genai_1.Type.STRING },
                                        fecha: { type: genai_1.Type.STRING },
                                        entrada: { type: genai_1.Type.STRING },
                                        salida: { type: genai_1.Type.STRING },
                                        nombre_empresa: { type: genai_1.Type.STRING },
                                        serie_maquina: { type: genai_1.Type.STRING },
                                        modelo_maquina: { type: genai_1.Type.STRING },
                                        problemas_encontrados: { type: genai_1.Type.STRING },
                                        acciones_realizadas: { type: genai_1.Type.STRING },
                                        observaciones: { type: genai_1.Type.STRING },
                                    }
                                }
                            },
                        })];
                case 3:
                    response = _d.sent();
                    parsed_1 = JSON.parse(response.text);
                    return [3 /*break*/, 7];
                case 4:
                    if (!(service === 'openai' && openaiClient)) return [3 /*break*/, 6];
                    return [4 /*yield*/, openaiClient.chat.completions.create({
                            model: "gpt-4o",
                            messages: [
                                {
                                    role: "user",
                                    content: [
                                        { type: "text", text: textPrompt },
                                        {
                                            type: "image_url",
                                            image_url: {
                                                url: base64Data, // Full data URI with prefix
                                                detail: "low"
                                            }
                                        }
                                    ]
                                }
                            ],
                            response_format: { type: "json_object" }
                        })];
                case 5:
                    response = _d.sent();
                    content = (_c = (_b = response.choices[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content;
                    if (!content)
                        throw new Error("OpenAI returned an empty response.");
                    parsed_1 = JSON.parse(content);
                    return [3 /*break*/, 7];
                case 6: throw new Error("Servicio de IA desconocido o no configurado: ".concat(service));
                case 7:
                    if (parsed_1.nombre_empresa) {
                        companyNameToFind_1 = parsed_1.nombre_empresa.toLowerCase();
                        foundCompany = companies.find(function (c) { return (c.nombre || '').toLowerCase().includes(companyNameToFind_1); });
                        if (foundCompany)
                            handleSelectCompany(foundCompany);
                    }
                    if (parsed_1.serie_maquina) {
                        machineSerieToFind_1 = parsed_1.serie_maquina.toLowerCase();
                        foundMachine_1 = machines.find(function (m) { return (m.serie || '').toLowerCase() === machineSerieToFind_1; });
                        if (foundMachine_1) {
                            company = companies.find(function (c) { return c.id === foundMachine_1.id_empresa; });
                            if (company)
                                handleSelectCompany(company);
                            setTimeout(function () {
                                var plant = plants.find(function (p) { return p.id === foundMachine_1.id_planta; });
                                if (plant)
                                    handleSelectPlant(plant);
                                setTimeout(function () { return handleSelectMachine(foundMachine_1); }, 350);
                            }, 350);
                        }
                    }
                    delete parsed_1.nombre_empresa;
                    setFormData(function (prev) { return (__assign(__assign({}, prev), parsed_1)); });
                    return [3 /*break*/, 10];
                case 8:
                    e_2 = _d.sent();
                    console.error(e_2);
                    setAiError("Error al procesar con ".concat(service, ": ").concat(e_2.message || "Por favor, inténtalo de nuevo."));
                    return [3 /*break*/, 10];
                case 9:
                    setIsAiLoading(false);
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    }); };
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var selectedPlant, payload, error, _a;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    e.preventDefault();
                    setIsSubmitting(true);
                    if (!supabase || !(auth === null || auth === void 0 ? void 0 : auth.user))
                        return [2 /*return*/];
                    selectedPlant = plants.find(function (p) { return p.id === formData.id_planta; });
                    payload = __assign(__assign({}, formData), { id_usuario: auth.user.id, nombre_planta: selectedPlant === null || selectedPlant === void 0 ? void 0 : selectedPlant.nombre, operativo: formData.estado_maquina === 'operativo', inoperativo: formData.estado_maquina === 'inoperativo', en_prueba: formData.estado_maquina === 'en_prueba', con_garantia: formData.estado_garantia === 'con_garantia', sin_garantia: formData.estado_garantia === 'sin_garantia', facturado: formData.estado_facturacion === 'facturado', no_facturado: formData.estado_facturacion === 'no_facturado', nombre_usuario: formData.nombre_firmante, celular_usuario: formData.celular_firmante, estado: (_b = formData.estado) !== null && _b !== void 0 ? _b : false });
                    delete payload.estado_maquina;
                    delete payload.estado_garantia;
                    delete payload.estado_facturacion;
                    delete payload.nombre_firmante;
                    delete payload.celular_firmante;
                    delete payload.id_planta;
                    if (!reportId) return [3 /*break*/, 2];
                    return [4 /*yield*/, supabase.from('Reporte_Servicio').update(payload).eq('id', reportId)];
                case 1:
                    _a = _c.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, supabase.from('Reporte_Servicio').insert(payload)];
                case 3:
                    _a = _c.sent();
                    _c.label = 4;
                case 4:
                    error = (_a).error;
                    setIsSubmitting(false);
                    if (error) {
                        alert("Error al guardar el reporte: " + error.message);
                    }
                    else {
                        alert("¡Reporte guardado exitosamente!");
                        onBack();
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    var handleDownloadPDF = function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, data, error, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!supabase || !reportId) {
                        alert("Guarde el reporte primero para poder descargarlo.");
                        return [2 /*return*/];
                    }
                    setIsDownloadingPdf(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, supabase
                            .from('Reporte_Servicio')
                            .select('*, empresa:Empresa(*), encargado:Encargado(*), usuario:Usuarios(nombres)')
                            .eq('id', reportId)
                            .single()];
                case 2:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error)
                        throw error;
                    return [4 /*yield*/, (0, pdfGenerator_1.generateServiceReport)(data, logoUrl, 'save')];
                case 3:
                    _b.sent();
                    return [3 /*break*/, 6];
                case 4:
                    err_1 = _b.sent();
                    console.error("Error generating PDF from form:", err_1);
                    alert("No se pudo generar el PDF: ".concat(err_1.message));
                    return [3 /*break*/, 6];
                case 5:
                    setIsDownloadingPdf(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    if (isDataLoading)
        return <div className="flex justify-center items-center h-full"><Spinner_1.default /> Cargando datos...</div>;
    return (<div className="flex h-full gap-4">
        {/* Form Section */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex items-center mb-6">
                <button onClick={onBack} className="p-2 mr-4 rounded-full hover:bg-base-300 transition"><Icons_1.BackIcon className="h-6 w-6"/></button>
                <h2 className="text-3xl font-bold">{reportId ? "Editar Reporte" : 'Crear Reporte'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-base-200 p-6 rounded-xl shadow-lg">
                    <div className="flex items-start"><Icons_1.SparklesIcon className="h-8 w-8 text-primary mr-3 shrink-0"/><div><h3 className="font-bold text-lg text-primary">Autocompletado con IA</h3><p className="text-sm text-neutral">Sube una orden de trabajo para rellenar campos automáticamente.</p></div></div>
                    <div className="mt-4">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-base-200 rounded-md font-medium text-primary hover:text-primary-focus focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                        <div className="flex items-center justify-center w-full px-6 py-4 border-2 border-base-border border-dashed rounded-md"><Icons_1.UploadIcon className="h-8 w-8 text-neutral mr-3"/><span className="text-neutral">{fileName || "Haz clic para subir un documento"}</span></div>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleAiFileChange} accept="image/*,application/pdf" disabled={isAiLoading || !isConfigured(service)}/>
                    </label>
                    {isAiLoading && <div className="mt-2 flex items-center"><Spinner_1.default /><span className="ml-2">La IA está analizando tu documento...</span></div>}
                    {aiError && <p className="mt-2 text-sm text-error">{aiError}</p>}
                    </div>
                </div>
                
                <div className="bg-base-200 p-6 rounded-xl shadow-lg space-y-6">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Información General</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div><label htmlFor="codigo_reporte" className="block text-sm font-medium">Código Reporte</label><input type="text" name="codigo_reporte" value={formData.codigo_reporte || ''} onChange={handleChange} className="mt-1 block w-full input-style"/></div>
                        <div><label htmlFor="fecha" className="block text-sm font-medium">Fecha</label><input type="date" name="fecha" value={formData.fecha || ''} onChange={handleChange} required className="mt-1 block w-full input-style"/></div>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label htmlFor="entrada" className="block text-sm font-medium">Hora Entrada</label><input type="time" name="entrada" value={formData.entrada || ''} onChange={handleChange} className="mt-1 block w-full input-style"/></div>
                            <div><label htmlFor="salida" className="block text-sm font-medium">Hora Salida</label><input type="time" name="salida" value={formData.salida || ''} onChange={handleChange} className="mt-1 block w-full input-style"/></div>
                        </div>
                    </div>
                </div>

                <div className="bg-base-200 p-6 rounded-xl shadow-lg space-y-6">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Cliente y Equipo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Empresa */}
                        <div>
                            <label htmlFor="company-search" className="block text-sm font-medium">Empresa</label>
                            <div onBlur={function () { return setTimeout(function () { return setShowCompanySuggestions(false); }, 100); }}>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="relative flex-grow">
                                        <input id="company-search" type="text" value={companySearchText} onChange={function (e) { return setCompanySearchText(e.target.value); }} onFocus={function () { return setShowCompanySuggestions(true); }} placeholder="Escribir o buscar empresa..." className="w-full input-style" autoComplete="off"/>
                                        {showCompanySuggestions && companySuggestions.length > 0 && (<ul className="absolute z-20 w-full bg-base-200 border border-base-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg custom-scrollbar">
                                                {companySuggestions.map(function (c) { return <li key={c.id} onMouseDown={function () { return handleSelectCompany(c); }} className="px-3 py-2 cursor-pointer hover:bg-base-300">{c.nombre}</li>; })}
                                            </ul>)}
                                    </div>
                                    <button type="button" onClick={function () { return setIsNewCompanyModalOpen(true); }} className="p-2.5 rounded-md hover:bg-base-300 transition" title="Crear Nueva Empresa"><Icons_1.UserPlusIcon className="h-5 w-5"/></button>
                                    <button type="button" onClick={function () { return setIsCompanySearchModalOpen(true); }} className="p-2.5 rounded-md hover:bg-base-300 transition" title="Buscar Empresa"><Icons_1.SearchIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        </div>
                        {/* Planta */}
                        <div>
                            <label htmlFor="plant-search" className="block text-sm font-medium flex items-center gap-2">Planta / Sede {isPlantsLoading && <Spinner_1.default />}</label>
                            <div onBlur={function () { return setTimeout(function () { return setShowPlantSuggestions(false); }, 100); }}>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="relative flex-grow">
                                        <input id="plant-search" type="text" value={plantSearchText} onChange={function (e) { return setPlantSearchText(e.target.value); }} onFocus={function () { return setShowPlantSuggestions(true); }} disabled={!formData.id_empresa} placeholder="Seleccionar Planta" className="w-full input-style" autoComplete="off"/>
                                        {showPlantSuggestions && plantSuggestions.length > 0 && (<ul className="absolute z-20 w-full bg-base-200 border border-base-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg custom-scrollbar">
                                                {plantSuggestions.map(function (p) { return <li key={p.id} onMouseDown={function () { return handleSelectPlant(p); }} className="px-3 py-2 cursor-pointer hover:bg-base-300">{p.nombre}</li>; })}
                                            </ul>)}
                                    </div>
                                    <button type="button" onClick={function () { return setIsNewPlantModalOpen(true); }} disabled={!formData.id_empresa} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50" title="Crear Nueva Planta"><Icons_1.PlusIcon className="h-5 w-5"/></button>
                                    <button type="button" onClick={function () { return setIsPlantSearchModalOpen(true); }} disabled={!formData.id_empresa} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50" title="Buscar Planta"><Icons_1.SearchIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        </div>
                        {/* Maquina */}
                        <div>
                            <label htmlFor="machine-search" className="block text-sm font-medium flex items-center gap-2">Máquina (N° Serie) {isMachinesAndSupervisorsLoading && <Spinner_1.default />}</label>
                            <div onBlur={function () { return setTimeout(function () { return setShowMachineSuggestions(false); }, 100); }}>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="relative flex-grow">
                                        <input id="machine-search" type="text" value={machineSearchText} onChange={function (e) { return setMachineSearchText(e.target.value); }} onFocus={function () { return setShowMachineSuggestions(true); }} disabled={!formData.id_planta} placeholder="Escribir o buscar N° Serie..." className="w-full input-style" autoComplete="off"/>
                                        {showMachineSuggestions && machineSuggestions.length > 0 && (<ul className="absolute z-10 w-full bg-base-200 border border-base-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg custom-scrollbar">
                                                {machineSuggestions.map(function (m) { return <li key={m.id} onMouseDown={function () { return handleSelectMachine(m); }} className="px-3 py-2 cursor-pointer hover:bg-base-300">{m.serie}</li>; })}
                                            </ul>)}
                                    </div>
                                    <button type="button" onClick={function () { return setIsNewMachineModalOpen(true); }} disabled={!formData.id_planta} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50" title="Crear Nueva Máquina"><Icons_1.PlusIcon className="h-5 w-5"/></button>
                                    <button type="button" onClick={function () { return setIsMachineSearchModalOpen(true); }} disabled={!formData.id_planta} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50" title="Buscar Máquina"><Icons_1.SearchIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        </div>
                        {/* Encargado */}
                        <div>
                            <label htmlFor="supervisor-search" className="block text-sm font-medium flex items-center gap-2">Encargado de Planta {isMachinesAndSupervisorsLoading && <Spinner_1.default />}</label>
                            <div onBlur={function () { return setTimeout(function () { return setShowSupervisorSuggestions(false); }, 100); }}>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="relative flex-grow">
                                        <input id="supervisor-search" type="text" value={supervisorSearchText} onChange={function (e) { return setSupervisorSearchText(e.target.value); }} onFocus={function () { return setShowSupervisorSuggestions(true); }} disabled={!formData.id_planta} placeholder="Escribir o buscar encargado..." className="w-full input-style" autoComplete="off"/>
                                        {showSupervisorSuggestions && supervisorSuggestions.length > 0 && (<ul className="absolute z-10 w-full bg-base-200 border border-base-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg custom-scrollbar">
                                                {supervisorSuggestions.map(function (s) { return <li key={s.id} onMouseDown={function () { return handleSelectSupervisor(s); }} className="p-3 cursor-pointer hover:bg-base-300">{s.nombre} {s.apellido}</li>; })}
                                            </ul>)}
                                    </div>
                                    <button type="button" onClick={function () { return setIsNewSupervisorModalOpen(true); }} disabled={!formData.id_planta} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50" title="Crear Nuevo Encargado"><Icons_1.UserPlusIcon className="h-5 w-5"/></button>
                                    <button type="button" onClick={function () { return setIsSupervisorSearchModalOpen(true); }} disabled={!formData.id_planta} className="p-2.5 rounded-md hover:bg-base-300 transition disabled:opacity-50" title="Buscar Encargado"><Icons_1.SearchIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        </div>
                        <input type="text" readOnly value={"Modelo: ".concat(formData.modelo_maquina || 'N/A')} className="mt-1 block w-full input-style bg-base-300"/>
                        <input type="text" readOnly value={"Marca: ".concat(formData.marca_maquina || 'N/A')} className="mt-1 block w-full input-style bg-base-300"/>
                    </div>
                </div>

                <div className="bg-base-200 p-6 rounded-xl shadow-lg space-y-6">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Detalles del Servicio</h3>
                    <div><label htmlFor="problemas_encontrados" className="block text-sm font-medium">Problemas Encontrados</label><textarea name="problemas_encontrados" rows={4} value={formData.problemas_encontrados || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea><ImageUpload_1.default id="fotos-problemas" label="" files={fotosProblemas} onFilesChange={setFotosProblemas}/></div>
                    <div><label htmlFor="acciones_realizadas" className="block text-sm font-medium">Acciones Realizadas</label><textarea name="acciones_realizadas" rows={4} value={formData.acciones_realizadas || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea><ImageUpload_1.default id="fotos-acciones" label="" files={fotosAcciones} onFilesChange={setFotosAcciones}/></div>
                    <div><label htmlFor="observaciones" className="block text-sm font-medium">Observaciones</label><textarea name="observaciones" rows={3} value={formData.observaciones || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea><ImageUpload_1.default id="fotos-observaciones" label="" files={fotosObservaciones} onFilesChange={setFotosObservaciones}/></div>
                </div>

                <div className="bg-base-200 p-6 rounded-xl shadow-lg space-y-6">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Estado Final</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <fieldset><legend className="text-sm font-medium">Estado de la Máquina</legend><div className="mt-2 space-y-2">{['operativo', 'inoperativo', 'en_prueba'].map(function (opt) { return (<div key={opt} className="flex items-center"><input id={"maq_".concat(opt)} name="estado_maquina" type="radio" value={opt} checked={formData.estado_maquina === opt} onChange={function () { return handleRadioChange('estado_maquina', opt); }} className="h-4 w-4 text-primary focus:ring-primary border-base-border"/><label htmlFor={"maq_".concat(opt)} className="ml-3 block text-sm capitalize">{opt.replace('_', ' ')}</label></div>); })}</div></fieldset>
                        <fieldset><legend className="text-sm font-medium">Garantía</legend><div className="mt-2 space-y-2">{['con_garantia', 'sin_garantia'].map(function (opt) { return (<div key={opt} className="flex items-center"><input id={"gar_".concat(opt)} name="estado_garantia" type="radio" value={opt} checked={formData.estado_garantia === opt} onChange={function () { return handleRadioChange('estado_garantia', opt); }} className="h-4 w-4 text-primary focus:ring-primary border-base-border"/><label htmlFor={"gar_".concat(opt)} className="ml-3 block text-sm capitalize">{opt.replace('_', ' ')}</label></div>); })}</div></fieldset>
                        <fieldset><legend className="text-sm font-medium">Facturación</legend><div className="mt-2 space-y-2">{['facturado', 'no_facturado'].map(function (opt) { return (<div key={opt} className="flex items-center"><input id={"fac_".concat(opt)} name="estado_facturacion" type="radio" value={opt} checked={formData.estado_facturacion === opt} onChange={function () { return handleRadioChange('estado_facturacion', opt); }} className="h-4 w-4 text-primary focus:ring-primary border-base-border"/><label htmlFor={"fac_".concat(opt)} className="ml-3 block text-sm capitalize">{opt.replace('_', ' ')}</label></div>); })}</div></fieldset>
                        <fieldset><legend className="text-sm font-medium">Estado del Reporte</legend><div className="mt-2 space-y-2"><div className="flex items-center"><input id="estado" name="estado" type="checkbox" checked={!!formData.estado} onChange={handleChange} className="h-4 w-4 text-primary focus:ring-primary border-base-border rounded"/><label htmlFor="estado" className="ml-3 block text-sm">Finalizado</label></div></div></fieldset>
                    </div>
                </div>

                <div className="bg-base-200 p-6 rounded-xl shadow-lg space-y-6">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Conformidad del Cliente</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label htmlFor="nombre_firmante" className="block text-sm font-medium">Nombre del Receptor</label><input type="text" name="nombre_firmante" value={formData.nombre_firmante || ''} onChange={handleChange} className="mt-1 block w-full input-style"/></div>
                        <div><label htmlFor="celular_firmante" className="block text-sm font-medium">Celular del Receptor</label><input type="text" name="celular_firmante" value={formData.celular_firmante || ''} onChange={handleChange} className="mt-1 block w-full input-style"/></div>
                        <div className="md:col-span-2"><ImageUpload_1.default id="foto-firma" label="Firma de Conformidad" files={fotoFirma} onFilesChange={setFotoFirma} multiple={false}/></div>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                    <div>
                        {reportId && (<button type="button" onClick={handleDownloadPDF} disabled={isDownloadingPdf} className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-600/50 flex items-center gap-2">
                                {isDownloadingPdf ? <Spinner_1.default /> : <Icons_1.DownloadIcon className="h-5 w-5"/>}
                                {isDownloadingPdf ? 'Generando...' : 'Descargar PDF'}
                            </button>)}
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={onBack} className="bg-base-300 py-2 px-4 rounded-lg hover:bg-neutral/20 transition-colors">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="bg-primary text-white py-2 px-6 rounded-lg hover:bg-primary-focus transition-colors disabled:bg-primary/50 flex items-center gap-2">{isSubmitting && <Spinner_1.default />}{isSubmitting ? 'Guardando...' : 'Guardar Reporte'}</button>
                    </div>
                </div>
            </form>
        </div>
        
        {/* Simulator Section */}
        <div className={"relative transition-all duration-300 ease-in-out ".concat(isSimulatorVisible ? 'w-1/2' : 'w-12')}>
            <div className="sticky top-0 h-full flex flex-col bg-base-300/50 rounded-lg shadow-inner">
                 <div className="flex-shrink-0 p-2 bg-base-200 rounded-t-lg border-b border-base-border">
                     <button onClick={function () { return setIsSimulatorVisible(!isSimulatorVisible); }} className="p-2 rounded-full hover:bg-base-300" title={isSimulatorVisible ? "Ocultar Previsualización" : "Mostrar Previsualización"}>
                        {isSimulatorVisible ? <Icons_1.EyeOffIcon className="h-5 w-5"/> : <Icons_1.ViewIcon className="h-5 w-5"/>}
                    </button>
                </div>
                {isSimulatorVisible && (<div className="flex-grow p-2 relative">
                        {isPdfLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10"><Spinner_1.default /></div>}
                        {pdfPreviewUri ? (<iframe src={pdfPreviewUri} title="PDF Preview" className="w-full h-full border-0 rounded-b-lg"/>) : (<div className="w-full h-full flex items-center justify-center text-neutral">
                                <p>La previsualización aparecerá aquí.</p>
                            </div>)}
                    </div>)}
            </div>
        </div>
      
      {/* Modals */}
      <Modal_1.default isOpen={isNewCompanyModalOpen} onClose={function () { return setIsNewCompanyModalOpen(false); }} title="Añadir Nueva Empresa"><CompanyForm_1.default company={null} onSave={handleCompanySaved} onCancel={function () { return setIsNewCompanyModalOpen(false); }}/></Modal_1.default>
      <Modal_1.default isOpen={isCompanySearchModalOpen} onClose={function () { return setIsCompanySearchModalOpen(false); }} title="Buscar Empresa"><ul className="max-h-80 overflow-y-auto divide-y divide-base-border custom-scrollbar">{companies.map(function (c) { return <li key={c.id} onClick={function () { return handleSelectCompany(c); }} className="p-3 cursor-pointer hover:bg-base-300">{c.nombre}</li>; })}</ul></Modal_1.default>
      
      <Modal_1.default isOpen={isNewPlantModalOpen} onClose={function () { return setIsNewPlantModalOpen(false); }} title="Añadir Nueva Planta"><PlantForm_1.default plant={null} onSave={handlePlantSaved} onCancel={function () { return setIsNewPlantModalOpen(false); }}/></Modal_1.default>
      <Modal_1.default isOpen={isPlantSearchModalOpen} onClose={function () { return setIsPlantSearchModalOpen(false); }} title="Buscar Planta"><ul className="max-h-80 overflow-y-auto divide-y divide-base-border custom-scrollbar">{filteredPlants.map(function (p) { return <li key={p.id} onClick={function () { return handleSelectPlant(p); }} className="p-3 cursor-pointer hover:bg-base-300">{p.nombre}</li>; })}</ul></Modal_1.default>
      
      <Modal_1.default isOpen={isNewMachineModalOpen} onClose={function () { return setIsNewMachineModalOpen(false); }} title="Añadir Nueva Máquina"><MachineForm_1.default machine={null} onSave={handleMachineSaved} onCancel={function () { return setIsNewMachineModalOpen(false); }}/></Modal_1.default>
      <Modal_1.default isOpen={isMachineSearchModalOpen} onClose={function () { return setIsMachineSearchModalOpen(false); }} title="Buscar Máquina"><ul className="max-h-80 overflow-y-auto divide-y divide-base-border custom-scrollbar">{filteredMachines.map(function (m) { return <li key={m.id} onClick={function () { return handleSelectMachine(m); }} className="p-3 cursor-pointer hover:bg-base-300">{m.serie} - {m.modelo}</li>; })}</ul></Modal_1.default>

      <Modal_1.default isOpen={isNewSupervisorModalOpen} onClose={function () { return setIsNewSupervisorModalOpen(false); }} title="Añadir Nuevo Encargado"><SupervisorForm_1.default supervisor={null} onSave={handleSupervisorSaved} onCancel={function () { return setIsNewSupervisorModalOpen(false); }}/></Modal_1.default>
      <Modal_1.default isOpen={isSupervisorSearchModalOpen} onClose={function () { return setIsSupervisorSearchModalOpen(false); }} title="Buscar Encargado"><ul className="max-h-80 overflow-y-auto divide-y divide-base-border custom-scrollbar">{filteredSupervisors.map(function (s) { return <li key={s.id} onClick={function () { return handleSelectSupervisor(s); }} className="p-3 cursor-pointer hover:bg-base-300">{s.nombre} {s.apellido}</li>; })}</ul></Modal_1.default>
    </div>);
};
exports.default = ReportForm;
