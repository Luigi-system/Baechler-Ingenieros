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
var recharts_1 = require("recharts");
var ThemeContext_1 = require("../../contexts/ThemeContext");
var SupabaseContext_1 = require("../../contexts/SupabaseContext");
var Spinner_1 = require("../ui/Spinner");
var ReportsChart = function () {
    var themeMode = (0, ThemeContext_1.useTheme)().themeMode;
    var supabase = (0, SupabaseContext_1.useSupabase)().supabase;
    var _a = (0, react_1.useState)([]), data = _a[0], setData = _a[1];
    var _b = (0, react_1.useState)(true), isLoading = _b[0], setIsLoading = _b[1];
    (0, react_1.useEffect)(function () {
        var fetchChartData = function () { return __awaiter(void 0, void 0, void 0, function () {
            var today, lastSixMonths, i, d, sixMonthsAgo, _a, reports, error, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!supabase)
                            return [2 /*return*/];
                        setIsLoading(true);
                        today = new Date();
                        lastSixMonths = [];
                        for (i = 5; i >= 0; i--) {
                            d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                            lastSixMonths.push({
                                name: d.toLocaleString('default', { month: 'short' }),
                                service: 0,
                                visit: 0,
                            });
                        }
                        sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, supabase
                                .from('Reporte_Servicio')
                                .select('fecha')
                                .gte('fecha', sixMonthsAgo.toISOString().split('T')[0])];
                    case 2:
                        _a = _b.sent(), reports = _a.data, error = _a.error;
                        if (error)
                            throw error;
                        // 3. Process data
                        reports.forEach(function (report) {
                            var reportDate = new Date(report.fecha);
                            var monthName = reportDate.toLocaleString('default', { month: 'short' });
                            var monthIndex = lastSixMonths.findIndex(function (m) { return m.name === monthName; });
                            if (monthIndex > -1) {
                                lastSixMonths[monthIndex].service++;
                            }
                        });
                        setData(lastSixMonths);
                        return [3 /*break*/, 5];
                    case 3:
                        error_1 = _b.sent();
                        console.error("Error fetching chart data:", error_1.message);
                        return [3 /*break*/, 5];
                    case 4:
                        setIsLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        fetchChartData();
    }, [supabase]);
    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Spinner_1.default /></div>;
    }
    var tickColor = themeMode === 'dark' ? '#9CA3AF' : '#6B7280';
    var gridColor = themeMode === 'dark' ? '#374151' : '#E5E7EB';
    return (<recharts_1.ResponsiveContainer width="100%" height="100%">
      <recharts_1.AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="colorService" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorVisit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <recharts_1.CartesianGrid strokeDasharray="3 3" stroke={gridColor}/>
        <recharts_1.XAxis dataKey="name" stroke={tickColor}/>
        <recharts_1.YAxis stroke={tickColor}/>
        <recharts_1.Tooltip contentStyle={{
            backgroundColor: themeMode === 'dark' ? '#1F2937' : '#FFFFFF',
            borderColor: themeMode === 'dark' ? '#4B5563' : '#E5E7EB',
        }}/>
        <recharts_1.Legend />
        <recharts_1.Area type="monotone" dataKey="service" name="Reportes de Servicio" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorService)"/>
        <recharts_1.Area type="monotone" dataKey="visit" name="Reportes de Visita" stroke="var(--color-secondary)" fillOpacity={1} fill="url(#colorVisit)"/>
      </recharts_1.AreaChart>
    </recharts_1.ResponsiveContainer>);
};
exports.default = ReportsChart;
