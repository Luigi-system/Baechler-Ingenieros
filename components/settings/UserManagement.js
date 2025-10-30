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
var Icons_1 = require("../ui/Icons");
var Spinner_1 = require("../ui/Spinner");
var Modal_1 = require("../ui/Modal");
var UserManagement = function () {
    var supabase = (0, SupabaseContext_1.useSupabase)().supabase;
    var _a = (0, react_1.useState)([]), users = _a[0], setUsers = _a[1];
    var _b = (0, react_1.useState)([]), roles = _b[0], setRoles = _b[1];
    var _c = (0, react_1.useState)(true), isLoading = _c[0], setIsLoading = _c[1];
    var _d = (0, react_1.useState)(null), error = _d[0], setError = _d[1];
    var _e = (0, react_1.useState)(false), isModalOpen = _e[0], setIsModalOpen = _e[1];
    var _f = (0, react_1.useState)(null), currentUser = _f[0], setCurrentUser = _f[1];
    var _g = (0, react_1.useState)(''), searchTerm = _g[0], setSearchTerm = _g[1];
    var fetchUsersAndRoles = function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, rolesRes, usersRes, formattedUsers, err_1;
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
                            supabase.from('Roles').select('id, nombre'),
                            supabase.from('Usuarios').select('*, role:Roles(nombre)')
                        ])];
                case 2:
                    _a = _b.sent(), rolesRes = _a[0], usersRes = _a[1];
                    if (rolesRes.error)
                        throw rolesRes.error;
                    setRoles(rolesRes.data);
                    if (usersRes.error)
                        throw usersRes.error;
                    formattedUsers = usersRes.data.map(function (user) {
                        var _a;
                        return (__assign(__assign({}, user), { roleName: ((_a = user.role) === null || _a === void 0 ? void 0 : _a.nombre) || 'N/A' }));
                    });
                    setUsers(formattedUsers);
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
        fetchUsersAndRoles();
    }, [supabase]);
    var filteredUsers = users.filter(function (user) {
        return (user.nombres || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.roleName || '').toLowerCase().includes(searchTerm.toLowerCase());
    });
    var handleOpenModal = function (user) {
        var _a;
        if (user === void 0) { user = null; }
        setCurrentUser(user ? __assign({}, user) : { nombres: '', email: '', rol: (_a = roles[0]) === null || _a === void 0 ? void 0 : _a.id });
        setIsModalOpen(true);
    };
    var handleCloseModal = function () {
        setIsModalOpen(false);
        setCurrentUser(null);
    };
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var userData, error;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!supabase || !currentUser)
                        return [2 /*return*/];
                    userData = {
                        nombres: currentUser.nombres,
                        email: currentUser.email,
                        dni: currentUser.dni,
                        celular: currentUser.celular,
                        rol: currentUser.rol
                    };
                    if (!currentUser.id) return [3 /*break*/, 2];
                    return [4 /*yield*/, supabase.from('Usuarios').update(userData).eq('id', currentUser.id)];
                case 1:
                    // Update
                    (error = (_a.sent()).error);
                    return [3 /*break*/, 3];
                case 2:
                    // Create
                    // This would typically be handled by Supabase Auth for new sign-ups.
                    // This form is more for admin-level user creation.
                    // A default password would be needed here.
                    alert("La creación de usuarios a través de este formulario no está completamente implementada por razones de seguridad.");
                    return [2 /*return*/];
                case 3:
                    if (error) {
                        alert(error.message);
                    }
                    else {
                        handleCloseModal();
                        fetchUsersAndRoles();
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    var handleDelete = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var error;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!supabase || !window.confirm('¿Estás seguro de que quieres eliminar este usuario?'))
                        return [2 /*return*/];
                    return [4 /*yield*/, supabase.from('Usuarios').delete().eq('id', id)];
                case 1:
                    error = (_a.sent()).error;
                    if (error) {
                        alert(error.message);
                    }
                    else {
                        fetchUsersAndRoles();
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    var handleFormChange = function (e) {
        var _a;
        if (!currentUser)
            return;
        var _b = e.target, name = _b.name, value = _b.value;
        setCurrentUser(__assign(__assign({}, currentUser), (_a = {}, _a[name] = name === 'rol' ? parseInt(value) : value, _a)));
    };
    return (<div className="space-y-6">
            <div className="flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Gestión de Usuarios</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Añade, edita o elimina usuarios del sistema.
                    </p>
                </div>
                <button onClick={function () { return handleOpenModal(); }} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark">
                    <Icons_1.PlusIcon className="h-5 w-5"/>
                    Añadir Usuario
                </button>
            </div>
            
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icons_1.SearchIcon className="h-5 w-5 text-gray-400"/>
                </div>
                <input type="text" placeholder="Buscar por nombre, email o rol..." value={searchTerm} onChange={function (e) { return setSearchTerm(e.target.value); }} className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"/>
            </div>

             {isLoading && <div className="flex justify-center"><Spinner_1.default /></div>}
            {error && <p className="text-red-500 text-center">{error}</p>}

            {!isLoading && !error && (<div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
                    <div className="overflow-y-auto max-h-[60vh] relative custom-scrollbar">
                        <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rol</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredUsers.map(function (user) { return (<tr key={user.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white break-words">{user.nombres}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 break-words">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.roleName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button onClick={function () { return handleOpenModal(user); }} className="text-primary hover:text-primary-dark p-1 rounded-full hover:bg-primary/10 transition"><Icons_1.EditIcon className="h-5 w-5"/></button>
                                        <button onClick={function () { return handleDelete(user.id); }} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-500/10 transition"><Icons_1.TrashIcon className="h-5 w-5"/></button>
                                    </td>
                                </tr>); })}
                            </tbody>
                        </table>
                    </div>
                </div>)}
            
            <Modal_1.default isOpen={isModalOpen} onClose={handleCloseModal} title={(currentUser === null || currentUser === void 0 ? void 0 : currentUser.id) ? 'Editar Usuario' : 'Añadir Nuevo Usuario'}>
                {currentUser && (<form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="nombres" className="block text-sm font-medium">Nombre Completo</label>
                            <input type="text" name="nombres" id="nombres" value={currentUser.nombres || ''} onChange={handleFormChange} required className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium">Email</label>
                            <input type="email" name="email" id="email" value={currentUser.email || ''} onChange={handleFormChange} required className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                         <div>
                            <label htmlFor="rol" className="block text-sm font-medium">Rol</label>
                            <select name="rol" id="rol" value={currentUser.rol || ''} onChange={handleFormChange} required className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600">
                                {roles.map(function (role) { return <option key={role.id} value={role.id}>{role.nombre}</option>; })}
                            </select>
                        </div>
                        <div className="flex justify-end pt-4 space-x-2">
                            <button type="button" onClick={handleCloseModal} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
                            <button type="submit" className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors">Guardar Usuario</button>
                        </div>
                    </form>)}
            </Modal_1.default>
        </div>);
};
exports.default = UserManagement;
