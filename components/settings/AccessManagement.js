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
var SupabaseContext_1 = require("../../contexts/SupabaseContext");
var Spinner_1 = require("../ui/Spinner");
var permissions_1 = require("../../constants/permissions");
var Icons_1 = require("../ui/Icons");
var AccessManagement = function () {
    var supabase = (0, SupabaseContext_1.useSupabase)().supabase;
    var _a = (0, react_1.useState)([]), roles = _a[0], setRoles = _a[1];
    var _b = (0, react_1.useState)(new Map()), permissions = _b[0], setPermissions = _b[1];
    var _c = (0, react_1.useState)(true), isLoading = _c[0], setIsLoading = _c[1];
    var _d = (0, react_1.useState)(null), error = _d[0], setError = _d[1];
    var _e = (0, react_1.useState)(''), searchTerm = _e[0], setSearchTerm = _e[1];
    var generateKey = function (roleId, permissionName) { return "".concat(roleId, "-").concat(permissionName); };
    var fetchData = (0, react_1.useCallback)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, rolesRes, permissionsRes, permsMap_1, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!supabase) {
                        setError("Cliente Supabase no disponible.");
                        setIsLoading(false);
                        return [2 /*return*/];
                    }
                    setIsLoading(true);
                    setError(null);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, Promise.all([
                            supabase.from('Roles').select('*'),
                            supabase.from('role_permissions').select('*')
                        ])];
                case 2:
                    _a = _b.sent(), rolesRes = _a[0], permissionsRes = _a[1];
                    if (rolesRes.error)
                        throw rolesRes.error;
                    if (permissionsRes.error)
                        throw permissionsRes.error;
                    setRoles(rolesRes.data);
                    permsMap_1 = new Map();
                    permissionsRes.data.forEach(function (p) {
                        permsMap_1.set(generateKey(p.role_id, p.permission_name), true);
                    });
                    setPermissions(permsMap_1);
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
    }); }, [supabase]);
    (0, react_1.useEffect)(function () {
        fetchData();
    }, [fetchData]);
    var filteredRoles = roles.filter(function (role) {
        return (role.nombre || '').toLowerCase().includes(searchTerm.toLowerCase());
    });
    var handlePermissionChange = function (roleId, permissionName, isChecked) { return __awaiter(void 0, void 0, void 0, function () {
        var key, newPermissions, error_1, error_2, err_2, revertedPermissions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!supabase)
                        return [2 /*return*/];
                    key = generateKey(roleId, permissionName);
                    newPermissions = new Map(permissions);
                    newPermissions.set(key, isChecked);
                    setPermissions(newPermissions);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    if (!isChecked) return [3 /*break*/, 3];
                    return [4 /*yield*/, supabase.from('role_permissions').insert([{ role_id: roleId, permission_name: permissionName }])];
                case 2:
                    error_1 = (_a.sent()).error;
                    if (error_1)
                        throw error_1;
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, supabase.from('role_permissions').delete().match({ role_id: roleId, permission_name: permissionName })];
                case 4:
                    error_2 = (_a.sent()).error;
                    if (error_2)
                        throw error_2;
                    _a.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    err_2 = _a.sent();
                    // Revert UI on error
                    alert("Error al actualizar permisos: ".concat(err_2.message));
                    revertedPermissions = new Map(permissions);
                    revertedPermissions.set(key, !isChecked);
                    setPermissions(revertedPermissions);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    if (isLoading)
        return <div className="flex justify-center p-8"><Spinner_1.default /></div>;
    if (error)
        return <p className="text-red-500 text-center">{error}</p>;
    return (<div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Gestión de Accesos</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Asigna permisos a los roles para controlar el acceso a los módulos del menú.
                </p>
            </div>
            
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icons_1.SearchIcon className="h-5 w-5 text-gray-400"/>
                </div>
                <input type="text" placeholder="Buscar por nombre de rol..." value={searchTerm} onChange={function (e) { return setSearchTerm(e.target.value); }} className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"/>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
                <div className="overflow-y-auto custom-scrollbar">
                    <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rol</th>
                                {permissions_1.ALL_PERMISSIONS_CONFIG.map(function (p) { return (<th key={p.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{p.label}</th>); })}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredRoles.map(function (role) { return (<tr key={role.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{role.nombre}</td>
                                    {permissions_1.ALL_PERMISSIONS_CONFIG.map(function (perm) {
                var isChecked = permissions.get(generateKey(role.id, perm.id)) || false;
                return (<td key={perm.id} className="px-6 py-4 text-center">
                                                <input type="checkbox" className="h-5 w-5 rounded text-primary focus:ring-primary border-gray-300 dark:border-gray-600 dark:bg-gray-900" checked={isChecked} onChange={function (e) { return handlePermissionChange(role.id, perm.id, e.target.checked); }}/>
                                            </td>);
            })}
                                </tr>); })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>);
};
exports.default = AccessManagement;
