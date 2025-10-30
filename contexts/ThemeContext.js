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
exports.useTheme = exports.ThemeProvider = void 0;
var react_1 = require("react");
var themes_1 = require("../constants/themes");
var AuthContext_1 = require("./AuthContext");
var SupabaseContext_1 = require("./SupabaseContext");
var ThemeContext = (0, react_1.createContext)(undefined);
var DEFAULT_LOGO_URL = 'https://jhhlrndxepowacrndhni.supabase.co/storage/v1/object/public/assets/report-ai-logo.png';
var ThemeProvider = function (_a) {
    var children = _a.children;
    var auth = (0, react_1.useContext)(AuthContext_1.AuthContext);
    var supabase = (0, SupabaseContext_1.useSupabase)().supabase;
    var _b = (0, react_1.useState)('light'), themeMode = _b[0], setThemeMode = _b[1];
    var _c = (0, react_1.useState)(themes_1.DEFAULT_PALETTE), currentPalette = _c[0], setCurrentPalette = _c[1];
    var _d = (0, react_1.useState)(DEFAULT_LOGO_URL), logoUrl = _d[0], setLogoUrl = _d[1];
    var _e = (0, react_1.useState)('Report-AI'), appTitle = _e[0], setAppTitle = _e[1];
    // Effect to fetch global branding settings once on app load
    (0, react_1.useEffect)(function () {
        var fetchGeneralBranding = function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, data, error, settings;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!supabase)
                            return [2 /*return*/];
                        return [4 /*yield*/, supabase
                                .from('Configuracion')
                                .select('value')
                                .eq('key', 'general_branding')
                                .is('id_usuario', null)
                                .maybeSingle()];
                    case 1:
                        _a = _b.sent(), data = _a.data, error = _a.error;
                        if (error) {
                            console.warn("Could not fetch general branding settings: ".concat(error.message));
                        }
                        else if (data && data.value) {
                            try {
                                settings = JSON.parse(data.value);
                                if (settings.app_title)
                                    setAppTitle(settings.app_title);
                                if (settings.logo_url)
                                    setLogoUrl(settings.logo_url);
                            }
                            catch (e) {
                                console.error("Failed to parse general branding JSON:", e);
                            }
                        }
                        return [2 /*return*/];
                }
            });
        }); };
        fetchGeneralBranding();
    }, [supabase]);
    // Effect to load user-specific theme palette on login
    (0, react_1.useEffect)(function () {
        if (auth === null || auth === void 0 ? void 0 : auth.user) {
            var userPaletteName_1 = auth.user.color_palette_name;
            var userPalette = themes_1.COLOR_PALETTES.find(function (p) { return p.name === userPaletteName_1; }) || themes_1.DEFAULT_PALETTE;
            setCurrentPalette(userPalette);
        }
    }, [auth === null || auth === void 0 ? void 0 : auth.user]);
    // Effect to apply theme mode (light/dark) class on initial load
    (0, react_1.useEffect)(function () {
        var root = window.document.documentElement;
        var storedTheme = localStorage.getItem('theme');
        var initialTheme = storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        setThemeMode(initialTheme);
        root.classList.remove('light', 'dark');
        root.classList.add(initialTheme);
    }, []);
    // Effect to apply color palette CSS variables
    (0, react_1.useEffect)(function () {
        var root = window.document.documentElement;
        var colorsToApply = themeMode === 'dark' ? currentPalette.dark : currentPalette.light;
        for (var _i = 0, _a = Object.entries(colorsToApply); _i < _a.length; _i++) {
            var _b = _a[_i], name_1 = _b[0], value_1 = _b[1];
            root.style.setProperty("--color-".concat(name_1), value_1);
        }
    }, [currentPalette, themeMode]);
    var toggleTheme = function () {
        setThemeMode(function (prevMode) {
            var newMode = prevMode === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newMode);
            var root = window.document.documentElement;
            root.classList.remove('light', 'dark');
            root.classList.add(newMode);
            return newMode;
        });
    };
    var value = (0, react_1.useMemo)(function () { return ({
        themeMode: themeMode,
        toggleTheme: toggleTheme,
        currentPalette: currentPalette,
        setPalette: setCurrentPalette,
        logoUrl: logoUrl,
        setLogoUrl: setLogoUrl,
        appTitle: appTitle,
        setAppTitle: setAppTitle,
    }); }, [themeMode, currentPalette, logoUrl, appTitle]);
    return (<ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>);
};
exports.ThemeProvider = ThemeProvider;
var useTheme = function () {
    var context = (0, react_1.useContext)(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
exports.useTheme = useTheme;
