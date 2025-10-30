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
var Login_1 = require("./components/auth/Login");
var Layout_1 = require("./components/layout/Layout");
var AuthContext_1 = require("./contexts/AuthContext");
var ThemeContext_1 = require("./contexts/ThemeContext");
var SupabaseContext_1 = require("./contexts/SupabaseContext");
var AiServiceContext_1 = require("./contexts/AiServiceContext");
var ChatContext_1 = require("./contexts/ChatContext");
var AppContent = function () {
    var _a = (0, react_1.useState)(null), user = _a[0], setUser = _a[1];
    var supabase = (0, SupabaseContext_1.useSupabase)().supabase;
    var fetchUserProfile = function (supabaseUser) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, userData, userError, permissions, roleName, roleId, _b, permissionsData, permissionsError, _c, configData, configError, themeSettings, error_1, errorMessage;
        var _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    if (!supabase || !supabaseUser.email) {
                        throw new Error("Supabase client or user email not available.");
                    }
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, supabase
                            .from('Usuarios')
                            .select('id, nombres, email, rol, role:Roles(nombre)')
                            .eq('email', supabaseUser.email)
                            .single()];
                case 2:
                    _a = _f.sent(), userData = _a.data, userError = _a.error;
                    if (userError)
                        throw new Error("Error fetching user profile: ".concat(userError.message));
                    if (!userData) return [3 /*break*/, 5];
                    permissions = [];
                    roleName = ((_d = userData.role) === null || _d === void 0 ? void 0 : _d.nombre) || 'Usuario';
                    roleId = userData.rol;
                    return [4 /*yield*/, supabase
                            .from('role_permissions')
                            .select('permission_name')
                            .eq('role_id', roleId)];
                case 3:
                    _b = _f.sent(), permissionsData = _b.data, permissionsError = _b.error;
                    if (permissionsError) {
                        console.error("Could not fetch permissions for role ".concat(roleId, ":"), permissionsError.message);
                        permissions = ['dashboard'];
                    }
                    else {
                        permissions = permissionsData.map(function (p) { return p.permission_name; });
                        if (permissions.length === 0) {
                            permissions.push('dashboard');
                        }
                    }
                    return [4 /*yield*/, supabase
                            .from('Configuracion')
                            .select('value')
                            .eq('id_usuario', userData.id)
                            .eq('key', 'user_theme_settings') // Use the new user-specific key
                            .maybeSingle()];
                case 4:
                    _c = _f.sent(), configData = _c.data, configError = _c.error;
                    themeSettings = {};
                    if (configError) {
                        console.warn("Could not fetch theme settings for user ".concat(userData.id, ": ").concat(configError.message, ". Using defaults."));
                    }
                    else if (configData && configData.value) {
                        try {
                            // The value is stored as a JSON string, so it needs to be parsed.
                            themeSettings = JSON.parse(configData.value);
                        }
                        catch (e) {
                            console.error("Failed to parse theme settings JSON:", e);
                        }
                    }
                    // Step 4: Combine all data into the final User object
                    // App title and logo are no longer part of the user profile; they are loaded globally.
                    return [2 /*return*/, {
                            id: userData.id,
                            nombres: userData.nombres,
                            email: userData.email,
                            rol: userData.rol,
                            roleName: roleName,
                            permissions: permissions,
                            color_palette_name: themeSettings.color_palette_name,
                        }];
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_1 = _f.sent();
                    errorMessage = error_1 instanceof Error ? error_1.message : String(error_1);
                    console.error("An unexpected error occurred fetching profile: ".concat(errorMessage, ". A temporary profile will be used."));
                    return [3 /*break*/, 7];
                case 7: 
                // Fallback user profile
                return [2 /*return*/, {
                        id: supabaseUser.id,
                        nombres: ((_e = supabaseUser.email) === null || _e === void 0 ? void 0 : _e.split('@')[0]) || 'Usuario sin nombre',
                        email: supabaseUser.email || '',
                        rol: 0,
                        roleName: 'Usuario',
                        permissions: ['dashboard']
                    }];
            }
        });
    }); };
    var login = function (email, password) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, data, signInError, profile;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!supabase)
                        throw new Error("Cliente Supabase no inicializado.");
                    return [4 /*yield*/, supabase.auth.signInWithPassword({ email: email, password: password })];
                case 1:
                    _a = _b.sent(), data = _a.data, signInError = _a.error;
                    if (signInError)
                        throw signInError;
                    if (!data.user) return [3 /*break*/, 3];
                    return [4 /*yield*/, fetchUserProfile(data.user)];
                case 2:
                    profile = _b.sent();
                    setUser(profile);
                    return [3 /*break*/, 4];
                case 3: throw new Error("No se pudo obtener la información del usuario después del inicio de sesión.");
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var logout = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!supabase)
                        return [2 /*return*/];
                    return [4 /*yield*/, supabase.auth.signOut()];
                case 1:
                    error = (_a.sent()).error;
                    if (error)
                        console.error("Error al cerrar sesión:", error);
                    setUser(null);
                    return [2 /*return*/];
            }
        });
    }); };
    var updateUser = (0, react_1.useCallback)(function (updates) {
        setUser(function (currentUser) {
            if (!currentUser)
                return null;
            return __assign(__assign({}, currentUser), updates);
        });
    }, []);
    var authContextValue = (0, react_1.useMemo)(function () { return ({ user: user, login: login, logout: logout, updateUser: updateUser }); }, [user, updateUser]);
    return (<AuthContext_1.AuthContext.Provider value={authContextValue}>
          <div className="bg-base-100 text-base-content min-h-screen">
            {user ? <Layout_1.default /> : <Login_1.default />}
          </div>
        </AuthContext_1.AuthContext.Provider>);
};
var App = function () {
    return (<SupabaseContext_1.SupabaseProvider>
      <AiServiceContext_1.AiServiceProvider>
        <ThemeContext_1.ThemeProvider>
          <ChatContext_1.ChatProvider>
            <AppContent />
          </ChatContext_1.ChatProvider>
        </ThemeContext_1.ThemeProvider>
      </AiServiceContext_1.AiServiceProvider>
    </SupabaseContext_1.SupabaseProvider>);
};
exports.default = App;
