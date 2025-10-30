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
var StatCard_1 = require("./StatCard");
var ReportsChart_1 = require("./ReportsChart");
var Icons_1 = require("../ui/Icons");
var SupabaseContext_1 = require("../../contexts/SupabaseContext");
var Spinner_1 = require("../ui/Spinner");
var Dashboard = function () {
    var _a, _b, _c, _d;
    var supabase = (0, SupabaseContext_1.useSupabase)().supabase;
    var _e = (0, react_1.useState)(null), stats = _e[0], setStats = _e[1];
    var _f = (0, react_1.useState)([]), recentReports = _f[0], setRecentReports = _f[1];
    var _g = (0, react_1.useState)(true), isLoading = _g[0], setIsLoading = _g[1];
    (0, react_1.useEffect)(function () {
        var fetchDashboardData = function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, totalReportsRes, activeUsersRes, completedServicesRes, pendingReportsRes, recentReportsRes, error_1;
            var _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        if (!supabase)
                            return [2 /*return*/];
                        setIsLoading(true);
                        _f.label = 1;
                    case 1:
                        _f.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, Promise.all([
                                supabase.from('Reporte_Servicio').select('id', { count: 'exact', head: true }),
                                supabase.from('Usuarios').select('id', { count: 'exact', head: true }),
                                supabase.from('Reporte_Servicio').select('id', { count: 'exact', head: true }).eq('facturado', true),
                                supabase.from('Reporte_Servicio').select('id', { count: 'exact', head: true }).eq('no_facturado', true),
                                supabase.from('Reporte_Servicio').select('*, empresa:Empresa(nombre), usuario:Usuarios(nombres)').order('created_at', { ascending: false }).limit(3)
                            ])];
                    case 2:
                        _a = _f.sent(), totalReportsRes = _a[0], activeUsersRes = _a[1], completedServicesRes = _a[2], pendingReportsRes = _a[3], recentReportsRes = _a[4];
                        setStats({
                            totalReports: (_b = totalReportsRes.count) !== null && _b !== void 0 ? _b : 0,
                            activeUsers: (_c = activeUsersRes.count) !== null && _c !== void 0 ? _c : 0,
                            completedServices: (_d = completedServicesRes.count) !== null && _d !== void 0 ? _d : 0,
                            pendingReports: (_e = pendingReportsRes.count) !== null && _e !== void 0 ? _e : 0
                        });
                        if (recentReportsRes.data) {
                            setRecentReports(recentReportsRes.data);
                        }
                        return [3 /*break*/, 5];
                    case 3:
                        error_1 = _f.sent();
                        console.error("Error fetching dashboard data:", error_1.message);
                        return [3 /*break*/, 5];
                    case 4:
                        setIsLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        fetchDashboardData();
    }, [supabase]);
    if (isLoading) {
        return (<div className="flex justify-center items-center h-full">
                <Spinner_1.default />
                <span className="ml-2">Cargando dashboard...</span>
            </div>);
    }
    return (<div className="space-y-6">
      <h2 className="text-3xl font-bold text-base-content">Dashboard</h2>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard_1.default title="Reportes Totales" value={(_a = stats === null || stats === void 0 ? void 0 : stats.totalReports.toLocaleString()) !== null && _a !== void 0 ? _a : '0'} icon={<Icons_1.ReportsIcon className="h-8 w-8 text-white"/>} color="bg-info"/>
        <StatCard_1.default title="Usuarios Activos" value={(_b = stats === null || stats === void 0 ? void 0 : stats.activeUsers.toLocaleString()) !== null && _b !== void 0 ? _b : '0'} icon={<Icons_1.UsersIcon className="h-8 w-8 text-white"/>} color="bg-success"/>
        <StatCard_1.default title="Servicios Completados" value={(_c = stats === null || stats === void 0 ? void 0 : stats.completedServices.toLocaleString()) !== null && _c !== void 0 ? _c : '0'} icon={<Icons_1.CheckCircleIcon className="h-8 w-8 text-white"/>} color="bg-primary"/>
        <StatCard_1.default title="Reportes Pendientes" value={(_d = stats === null || stats === void 0 ? void 0 : stats.pendingReports.toLocaleString()) !== null && _d !== void 0 ? _d : '0'} icon={<Icons_1.ClockIcon className="h-8 w-8 text-white"/>} color="bg-warning"/>
      </div>

      {/* Charts and other widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-base-200 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-base-content">Resumen de Reportes (Últimos 6 meses)</h3>
          <div className="h-80">
            <ReportsChart_1.default />
          </div>
        </div>
        <div className="bg-base-200 p-6 rounded-xl shadow-lg">
           <h3 className="text-xl font-semibold mb-4 text-base-content">Actividad Reciente</h3>
           {recentReports.length > 0 ? (<ul className="space-y-4">
              {recentReports.map(function (report) {
                var _a, _b, _c;
                return (<li key={report.id} className="flex items-start">
                      <div className="flex-shrink-0"><Icons_1.CheckCircleIcon className="h-5 w-5 text-success mt-1"/></div>
                      <div className="ml-3">
                          <p className="text-sm font-medium text-base-content">
                            {(_b = (_a = report.usuario) === null || _a === void 0 ? void 0 : _a.nombres) !== null && _b !== void 0 ? _b : 'Usuario desconocido'} creó el reporte #{report.codigo_reporte}.
                          </p>
                          <p className="text-sm text-neutral">
                            {new Date((_c = report.created_at) !== null && _c !== void 0 ? _c : '').toLocaleDateString()}
                          </p>
                      </div>
                  </li>);
            })}
           </ul>) : (<p className="text-sm text-neutral">No hay actividad reciente.</p>)}
        </div>
      </div>
    </div>);
};
exports.default = Dashboard;
