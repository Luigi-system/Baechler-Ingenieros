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
var SupabaseContext_1 = require("../../contexts/SupabaseContext");
var AuthContext_1 = require("../../contexts/AuthContext");
var ThemeContext_1 = require("../../contexts/ThemeContext");
var pdfGenerator_1 = require("../../services/pdfGenerator");
var Icons_1 = require("../ui/Icons");
var Spinner_1 = require("../ui/Spinner");
var ImageUpload_1 = require("../ui/ImageUpload");
var fileToBase64 = function (file) { return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () { return resolve(reader.result); };
    reader.onerror = function (error) { return reject(error); };
}); };
var VisitReportForm = function (_a) {
    var reportId = _a.reportId, onBack = _a.onBack;
    var supabase = (0, SupabaseContext_1.useSupabase)().supabase;
    var auth = (0, react_1.useContext)(AuthContext_1.AuthContext);
    var logoUrl = (0, ThemeContext_1.useTheme)().logoUrl;
    var _b = (0, react_1.useState)({ fecha: new Date().toISOString().split('T')[0] }), formData = _b[0], setFormData = _b[1];
    var _c = (0, react_1.useState)(false), isSubmitting = _c[0], setIsSubmitting = _c[1];
    // Relational Data
    var _d = (0, react_1.useState)([]), companies = _d[0], setCompanies = _d[1];
    var _e = (0, react_1.useState)([]), plants = _e[0], setPlants = _e[1];
    var _f = (0, react_1.useState)([]), supervisors = _f[0], setSupervisors = _f[1];
    // File state
    var _g = (0, react_1.useState)([]), fotoFirma = _g[0], setFotoFirma = _g[1];
    // UI & Simulator States
    var _h = (0, react_1.useState)(true), isDataLoading = _h[0], setIsDataLoading = _h[1];
    var _j = (0, react_1.useState)(true), isSimulatorVisible = _j[0], setIsSimulatorVisible = _j[1];
    var _k = (0, react_1.useState)(null), pdfPreviewUri = _k[0], setPdfPreviewUri = _k[1];
    var _l = (0, react_1.useState)(false), isPdfLoading = _l[0], setIsPdfLoading = _l[1];
    var debounceTimeout = (0, react_1.useRef)(null);
    // Fetch relational data
    (0, react_1.useEffect)(function () {
        var fetchInitialData = function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, companyRes, plantRes, supervisorRes, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!supabase)
                            return [2 /*return*/];
                        setIsDataLoading(true);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, Promise.all([
                                supabase.from('Empresa').select('*'),
                                supabase.from('Planta').select('*'),
                                supabase.from('Encargado').select('*'),
                            ])];
                    case 2:
                        _a = _b.sent(), companyRes = _a[0], plantRes = _a[1], supervisorRes = _a[2];
                        if (companyRes.error)
                            throw companyRes.error;
                        if (plantRes.error)
                            throw plantRes.error;
                        if (supervisorRes.error)
                            throw supervisorRes.error;
                        setCompanies(companyRes.data);
                        setPlants(plantRes.data);
                        setSupervisors(supervisorRes.data);
                        if (reportId) {
                            // Fetch and set editing report data
                        }
                        return [3 /*break*/, 5];
                    case 3:
                        error_1 = _b.sent();
                        console.error("Error fetching dropdown data", error_1);
                        return [3 /*break*/, 5];
                    case 4:
                        setIsDataLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        fetchInitialData();
    }, [supabase, reportId]);
    // PDF Preview Generation (Debounced)
    (0, react_1.useEffect)(function () {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        setIsPdfLoading(true);
        debounceTimeout.current = window.setTimeout(function () { return __awaiter(void 0, void 0, void 0, function () {
            var fotoFirmaBase64, _a, enrichedData, uri, e_1;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 5, 6, 7]);
                        if (!fotoFirma[0]) return [3 /*break*/, 2];
                        return [4 /*yield*/, fileToBase64(fotoFirma[0])];
                    case 1:
                        _a = _c.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = undefined;
                        _c.label = 3;
                    case 3:
                        fotoFirmaBase64 = _a;
                        enrichedData = __assign(__assign({}, formData), { empresa: companies.find(function (c) { return c.id === Number(formData.id_empresa); }) || null, planta: plants.find(function (p) { return p.id === Number(formData.id_planta); }) || null, encargado: supervisors.find(function (s) { return s.id === Number(formData.id_encargado); }) || null, usuario: { nombres: ((_b = auth === null || auth === void 0 ? void 0 : auth.user) === null || _b === void 0 ? void 0 : _b.nombres) || 'N/A' }, fotoFirmaBase64: fotoFirmaBase64 });
                        return [4 /*yield*/, (0, pdfGenerator_1.generateVisitReport)(enrichedData, logoUrl, 'datauristring')];
                    case 4:
                        uri = _c.sent();
                        setPdfPreviewUri(uri);
                        return [3 /*break*/, 7];
                    case 5:
                        e_1 = _c.sent();
                        console.error("Error generating PDF preview:", e_1);
                        return [3 /*break*/, 7];
                    case 6:
                        setIsPdfLoading(false);
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        }); }, 500); // 500ms debounce
    }, [formData, companies, plants, supervisors, logoUrl, auth === null || auth === void 0 ? void 0 : auth.user, fotoFirma]);
    // Form handlers
    var handleChange = (0, react_1.useCallback)(function (e) {
        var _a = e.target, name = _a.name, value = _a.value;
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
        });
    }, []);
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var payload, error, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    e.preventDefault();
                    setIsSubmitting(true);
                    if (!supabase || !(auth === null || auth === void 0 ? void 0 : auth.user))
                        return [2 /*return*/];
                    payload = __assign(__assign({}, formData), { id_usuario: auth.user.id });
                    if (!reportId) return [3 /*break*/, 2];
                    return [4 /*yield*/, supabase.from('Reporte_Visita').update(payload).eq('id', reportId)];
                case 1:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, supabase.from('Reporte_Visita').insert(payload)];
                case 3:
                    _a = _b.sent();
                    _b.label = 4;
                case 4:
                    error = (_a).error;
                    setIsSubmitting(false);
                    if (error) {
                        alert("Error al guardar el reporte: " + error.message);
                    }
                    else {
                        alert("¡Reporte de visita guardado exitosamente!");
                        onBack();
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    // Memoized lists for dependent dropdowns
    var filteredPlants = (0, react_1.useMemo)(function () { return plants.filter(function (p) { return p.id_empresa === Number(formData.id_empresa); }); }, [plants, formData.id_empresa]);
    var filteredSupervisors = (0, react_1.useMemo)(function () { return supervisors.filter(function (s) { return s.id_planta === Number(formData.id_planta); }); }, [supervisors, formData.id_planta]);
    if (isDataLoading)
        return <div className="flex justify-center items-center h-full"><Spinner_1.default /> Cargando datos...</div>;
    return (<div className="flex h-full gap-4">
        {/* Form Section */}
        <div className="flex-1 overflow-y-auto pr-2">
             <div className="flex items-center mb-6">
                <button onClick={onBack} className="p-2 mr-4 rounded-full hover:bg-base-300 transition"><Icons_1.BackIcon className="h-6 w-6"/></button>
                <h2 className="text-3xl font-bold">{reportId ? 'Editar Reporte de Visita' : 'Crear Reporte de Visita'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Client Info */}
                <div className="bg-base-200 p-6 rounded-xl shadow-lg space-y-4">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Información General</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label htmlFor="codigo_reporte" className="block text-sm font-medium">Código Reporte</label><input type="text" name="codigo_reporte" value={formData.codigo_reporte || ''} onChange={handleChange} className="mt-1 block w-full input-style"/></div>
                        <div><label htmlFor="fecha" className="block text-sm font-medium">Fecha</label><input type="date" name="fecha" value={formData.fecha || ''} onChange={handleChange} required className="mt-1 block w-full input-style"/></div>
                        <div>
                           <label htmlFor="id_empresa" className="block text-sm font-medium">Empresa</label>
                           <select name="id_empresa" value={formData.id_empresa || ''} onChange={handleChange} required className="mt-1 block w-full input-style">
                                <option value="" disabled>Seleccionar empresa...</option>
                                {companies.map(function (c) { return <option key={c.id} value={c.id}>{c.nombre}</option>; })}
                           </select>
                        </div>
                         <div>
                           <label htmlFor="id_planta" className="block text-sm font-medium">Planta / Sede</label>
                           <select name="id_planta" value={formData.id_planta || ''} onChange={handleChange} required disabled={!formData.id_empresa} className="mt-1 block w-full input-style">
                                <option value="" disabled>Seleccionar planta...</option>
                                {filteredPlants.map(function (p) { return <option key={p.id} value={p.id}>{p.nombre}</option>; })}
                           </select>
                        </div>
                        <div className="md:col-span-2">
                           <label htmlFor="id_encargado" className="block text-sm font-medium">Encargado / Contacto</label>
                           <select name="id_encargado" value={formData.id_encargado || ''} onChange={handleChange} required disabled={!formData.id_planta} className="mt-1 block w-full input-style">
                                <option value="" disabled>Seleccionar encargado...</option>
                                {filteredSupervisors.map(function (s) { return <option key={s.id} value={s.id}>{s.nombre} {s.apellido}</option>; })}
                           </select>
                        </div>
                    </div>
                </div>
                {/* Visit Details */}
                <div className="bg-base-200 p-6 rounded-xl shadow-lg space-y-4">
                    <h3 className="text-xl font-semibold border-b border-base-border pb-2">Detalles de la Visita</h3>
                    <div><label htmlFor="motivo_visita" className="block text-sm font-medium">Motivo de la Visita</label><textarea name="motivo_visita" rows={2} value={formData.motivo_visita || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea></div>
                    <div><label htmlFor="temas_tratados" className="block text-sm font-medium">Temas Tratados</label><textarea name="temas_tratados" rows={4} value={formData.temas_tratados || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea></div>
                    <div><label htmlFor="acuerdos" className="block text-sm font-medium">Acuerdos</label><textarea name="acuerdos" rows={3} value={formData.acuerdos || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea></div>
                    <div><label htmlFor="pendientes" className="block text-sm font-medium">Pendientes</label><textarea name="pendientes" rows={3} value={formData.pendientes || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea></div>
                    <div><label htmlFor="observaciones" className="block text-sm font-medium">Observaciones</label><textarea name="observaciones" rows={2} value={formData.observaciones || ''} onChange={handleChange} className="mt-1 block w-full input-style"></textarea></div>
                </div>
                {/* Signature */}
                 <div className="bg-base-200 p-6 rounded-xl shadow-lg space-y-4">
                     <h3 className="text-xl font-semibold border-b border-base-border pb-2">Conformidad del Cliente</h3>
                     <div><label htmlFor="nombre_firmante" className="block text-sm font-medium">Nombre del Receptor</label><input type="text" name="nombre_firmante" value={formData.nombre_firmante || ''} onChange={handleChange} className="mt-1 block w-full input-style"/></div>
                     <ImageUpload_1.default id="foto-firma" label="Firma de Conformidad" files={fotoFirma} onFilesChange={setFotoFirma} multiple={false}/>
                </div>

                <div className="flex justify-end items-center pt-4 gap-4">
                    <button type="button" onClick={onBack} className="bg-base-300 py-2 px-4 rounded-lg hover:bg-neutral/20 transition-colors">Cancelar</button>
                    <button type="submit" disabled={isSubmitting} className="bg-primary text-white py-2 px-6 rounded-lg hover:bg-primary-focus transition-colors disabled:bg-primary/50 flex items-center gap-2">
                        {isSubmitting && <Spinner_1.default />}
                        <Icons_1.SaveIcon className="h-5 w-5"/>
                        {isSubmitting ? 'Guardando...' : 'Guardar Reporte'}
                    </button>
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
    </div>);
};
exports.default = VisitReportForm;
