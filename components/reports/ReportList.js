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
var Icons_1 = require("../ui/Icons");
var SupabaseContext_1 = require("../../contexts/SupabaseContext");
var Spinner_1 = require("../ui/Spinner");
var ThemeContext_1 = require("../../contexts/ThemeContext");
var pdfGenerator_1 = require("../../services/pdfGenerator");
var PdfViewerModal_1 = require("../ui/PdfViewerModal");
var ProgressCircle_1 = require("../ui/ProgressCircle");
var calculateCompletion = function (report) {
    var totalFields = 10;
    var completedFields = 0;
    if (report.codigo_reporte)
        completedFields++;
    if (report.fecha)
        completedFields++;
    if (report.id_empresa)
        completedFields++;
    if (report.nombre_planta)
        completedFields++;
    if (report.serie_maquina)
        completedFields++;
    if (report.problemas_encontrados)
        completedFields++;
    if (report.acciones_realizadas)
        completedFields++;
    if (report.operativo || report.inoperativo || report.en_prueba)
        completedFields++;
    if (report.nombre_firmante)
        completedFields++;
    if (report.foto_firma_url)
        completedFields++;
    return (completedFields / totalFields) * 100;
};
var ReportList = function (_a) {
    var reportType = _a.reportType, onCreateReport = _a.onCreateReport, onEditReport = _a.onEditReport;
    var supabase = (0, SupabaseContext_1.useSupabase)().supabase;
    var logoUrl = (0, ThemeContext_1.useTheme)().logoUrl;
    var _b = (0, react_1.useState)([]), reports = _b[0], setReports = _b[1];
    var _c = (0, react_1.useState)(true), isLoading = _c[0], setIsLoading = _c[1];
    var _d = (0, react_1.useState)(null), pdfLoadingId = _d[0], setPdfLoadingId = _d[1];
    var _e = (0, react_1.useState)(null), pdfViewingId = _e[0], setPdfViewingId = _e[1];
    var _f = (0, react_1.useState)(null), pdfViewerUri = _f[0], setPdfViewerUri = _f[1];
    var _g = (0, react_1.useState)(null), error = _g[0], setError = _g[1];
    var _h = (0, react_1.useState)(''), searchTerm = _h[0], setSearchTerm = _h[1];
    (0, react_1.useEffect)(function () {
        var fetchReports = function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, data, error_1, formattedData, err_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!supabase || reportType !== 'service') {
                            setIsLoading(false);
                            return [2 /*return*/];
                        }
                        setIsLoading(true);
                        setError(null);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, supabase
                                .from('Reporte_Servicio')
                                .select('*, empresa:Empresa(nombre), usuario:Usuarios(nombres)')
                                .order('fecha', { ascending: false })];
                    case 2:
                        _a = _b.sent(), data = _a.data, error_1 = _a.error;
                        if (error_1)
                            throw error_1;
                        formattedData = data.map(function (item) { return (__assign(__assign({}, item), { empresa: (Array.isArray(item.empresa) ? item.empresa[0] : item.empresa) || null, usuario: (Array.isArray(item.usuario) ? item.usuario[0] : item.usuario) || null, nombre_firmante: item.nombre_usuario })); });
                        setReports(formattedData);
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
        fetchReports();
    }, [supabase, reportType]);
    var handleStatusToggle = function (report) { return __awaiter(void 0, void 0, void 0, function () {
        var newStatus, error;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!supabase || !report.id)
                        return [2 /*return*/];
                    newStatus = !report.estado;
                    // Optimistic UI update
                    setReports(function (prevReports) {
                        return prevReports.map(function (r) { return r.id === report.id ? __assign(__assign({}, r), { estado: newStatus }) : r; });
                    });
                    return [4 /*yield*/, supabase
                            .from('Reporte_Servicio')
                            .update({ estado: newStatus })
                            .eq('id', report.id)];
                case 1:
                    error = (_a.sent()).error;
                    if (error) {
                        // Revert on error
                        setReports(function (prevReports) {
                            return prevReports.map(function (r) { return r.id === report.id ? __assign(__assign({}, r), { estado: !newStatus }) : r; });
                        });
                        alert("Error al actualizar estado: ".concat(error.message));
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    var handleDownloadPDF = function (reportId) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, data, error_2, err_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!supabase) {
                        alert("La conexión con la base de datos no está disponible.");
                        return [2 /*return*/];
                    }
                    setPdfLoadingId(reportId);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, supabase
                            .from('Reporte_Servicio')
                            .select('*, empresa:Empresa(*), encargado:Encargado(*), usuario:Usuarios(nombres)')
                            .eq('id', reportId)
                            .single()];
                case 2:
                    _a = _b.sent(), data = _a.data, error_2 = _a.error;
                    if (error_2)
                        throw error_2;
                    return [4 /*yield*/, (0, pdfGenerator_1.generateServiceReport)(data, logoUrl, 'save')];
                case 3:
                    _b.sent();
                    return [3 /*break*/, 6];
                case 4:
                    err_2 = _b.sent();
                    console.error("Error generating PDF:", err_2);
                    alert("No se pudo generar el PDF: ".concat(err_2.message));
                    return [3 /*break*/, 6];
                case 5:
                    setPdfLoadingId(null);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleViewPDF = function (reportId) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, data, error_3, pdfDataUri, err_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!supabase) {
                        alert("La conexión con la base de datos no está disponible.");
                        return [2 /*return*/];
                    }
                    setPdfViewingId(reportId);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, supabase
                            .from('Reporte_Servicio')
                            .select('*, empresa:Empresa(*), encargado:Encargado(*), usuario:Usuarios(nombres)')
                            .eq('id', reportId)
                            .single()];
                case 2:
                    _a = _b.sent(), data = _a.data, error_3 = _a.error;
                    if (error_3)
                        throw error_3;
                    return [4 /*yield*/, (0, pdfGenerator_1.generateServiceReport)(data, logoUrl, 'datauristring')];
                case 3:
                    pdfDataUri = _b.sent();
                    if (pdfDataUri) {
                        setPdfViewerUri(pdfDataUri);
                    }
                    return [3 /*break*/, 6];
                case 4:
                    err_3 = _b.sent();
                    console.error("Error generating PDF for viewing:", err_3);
                    alert("No se pudo generar el PDF: ".concat(err_3.message));
                    return [3 /*break*/, 6];
                case 5:
                    setPdfViewingId(null);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var filteredReports = reports.filter(function (report) {
        var _a;
        return (report.codigo_reporte || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (((_a = report.empresa) === null || _a === void 0 ? void 0 : _a.nombre) || '').toLowerCase().includes(searchTerm.toLowerCase());
    });
    var getBillingStatusInfo = function (report) {
        if (report.facturado) {
            return {
                className: 'bg-success/10 text-success',
                text: 'Facturado'
            };
        }
        if (report.no_facturado) {
            return {
                className: 'bg-warning/10 text-warning',
                text: 'No Facturado'
            };
        }
        return {
            className: 'bg-base-300 text-neutral',
            text: 'Borrador'
        };
    };
    return (<div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-base-content">Reportes de Servicio</h2>
        <button onClick={onCreateReport} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-focus focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors">
          <Icons_1.PlusIcon className="h-5 w-5"/>
          Crear Reporte
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icons_1.SearchIcon className="h-5 w-5 text-neutral"/>
        </div>
        <input type="text" placeholder="Buscar por código o cliente..." value={searchTerm} onChange={function (e) { return setSearchTerm(e.target.value); }} className="block w-full pl-10 pr-3 py-2 sm:text-sm input-style"/>
      </div>

      {isLoading && <div className="flex justify-center items-center py-8"><Spinner_1.default /><span className="ml-2">Cargando reportes...</span></div>}
      {error && <p className="text-error text-center py-8">{error}</p>}
      
      {!isLoading && !error && (<div className="bg-base-200 shadow-lg rounded-xl overflow-hidden">
          <div className="overflow-y-auto max-h-[60vh] relative custom-scrollbar">
            <table className="w-full table-auto divide-y divide-base-border">
              <thead className="bg-base-300 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Código</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Cliente</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Creado Por</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Facturación</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Completado</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Estado Reporte</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Fecha</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-base-200 divide-y divide-base-border">
                {filteredReports.length > 0 ? filteredReports.map(function (report) {
                var _a, _b;
                var billingStatus = getBillingStatusInfo(report);
                var completion = calculateCompletion(report);
                return (<tr key={report.id} className="hover:bg-base-300">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-base-content">{report.codigo_reporte || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-neutral break-words">{((_a = report.empresa) === null || _a === void 0 ? void 0 : _a.nombre) || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-neutral break-words">{((_b = report.usuario) === null || _b === void 0 ? void 0 : _b.nombres) || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={"px-2 inline-flex text-xs leading-5 font-semibold rounded-full ".concat(billingStatus.className)}>
                        {billingStatus.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><ProgressCircle_1.default percentage={completion}/></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={!!report.estado} onChange={function () { return handleStatusToggle(report); }} className="sr-only peer"/>
                            <div className="w-11 h-6 bg-base-300 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary-focus peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-base-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            <span className="ml-3 text-sm font-medium">{report.estado ? 'Finalizado' : 'En Progreso'}</span>
                        </label>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral">{new Date(report.fecha || '').toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button onClick={function () { return onEditReport(report.id); }} className="text-primary hover:text-primary-focus p-1 rounded-full hover:bg-primary/10 transition"><Icons_1.EditIcon className="h-5 w-5"/></button>
                      <button onClick={function () { return handleViewPDF(report.id); }} disabled={pdfViewingId === report.id} className="text-info hover:text-info/80 p-1 rounded-full hover:bg-info/10 transition disabled:opacity-50 disabled:cursor-not-allowed">
                        {pdfViewingId === report.id ? <Spinner_1.default /> : <Icons_1.ViewIcon className="h-5 w-5"/>}
                      </button>
                      <button onClick={function () { return handleDownloadPDF(report.id); }} disabled={pdfLoadingId === report.id} className="text-success hover:text-success/80 p-1 rounded-full hover:bg-success/10 transition disabled:opacity-50 disabled:cursor-not-allowed">
                        {pdfLoadingId === report.id ? <Spinner_1.default /> : <Icons_1.DownloadIcon className="h-5 w-5"/>}
                      </button>
                    </td>
                  </tr>);
            }) : (<tr>
                    <td colSpan={8} className="text-center py-8 text-neutral">
                        No se encontraron reportes.
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>)}
      {pdfViewerUri && (<PdfViewerModal_1.default pdfDataUri={pdfViewerUri} onClose={function () { return setPdfViewerUri(null); }}/>)}
    </div>);
};
exports.default = ReportList;
