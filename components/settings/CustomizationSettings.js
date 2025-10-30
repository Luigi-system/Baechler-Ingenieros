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
var ThemeContext_1 = require("../../contexts/ThemeContext");
var AuthContext_1 = require("../../contexts/AuthContext");
var SupabaseContext_1 = require("../../contexts/SupabaseContext");
var themes_1 = require("../../constants/themes");
var Icons_1 = require("../ui/Icons");
var Spinner_1 = require("../ui/Spinner");
var CustomizationSettings = function () {
    var _a = (0, ThemeContext_1.useTheme)(), currentPalette = _a.currentPalette, setPalette = _a.setPalette, logoUrl = _a.logoUrl, setLogoUrl = _a.setLogoUrl, appTitle = _a.appTitle, setAppTitle = _a.setAppTitle;
    var supabase = (0, SupabaseContext_1.useSupabase)().supabase;
    var auth = (0, react_1.useContext)(AuthContext_1.AuthContext);
    var _b = (0, react_1.useState)(false), isSaving = _b[0], setIsSaving = _b[1];
    var _c = (0, react_1.useState)(null), feedback = _c[0], setFeedback = _c[1];
    var groupedPalettes = themes_1.COLOR_PALETTES.reduce(function (acc, palette) {
        (acc[palette.category] = acc[palette.category] || []).push(palette);
        return acc;
    }, {});
    var handleSave = function () { return __awaiter(void 0, void 0, void 0, function () {
        var saveBranding, saveTheme, _a, brandingError, themeResult, bError, tError;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!supabase || !(auth === null || auth === void 0 ? void 0 : auth.user)) {
                        setFeedback({ type: 'error', message: 'No se puede guardar: usuario no autenticado o conexión a la base de datos no disponible.' });
                        return [2 /*return*/];
                    }
                    setIsSaving(true);
                    setFeedback(null);
                    saveBranding = function () { return __awaiter(void 0, void 0, void 0, function () {
                        var brandingValue, _a, existing, selectError, error, error;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    brandingValue = { app_title: appTitle, logo_url: logoUrl };
                                    return [4 /*yield*/, supabase
                                            .from('Configuracion')
                                            .select('id')
                                            .eq('key', 'general_branding')
                                            .is('id_usuario', null)
                                            .maybeSingle()];
                                case 1:
                                    _a = _b.sent(), existing = _a.data, selectError = _a.error;
                                    if (selectError)
                                        return [2 /*return*/, selectError];
                                    if (!existing) return [3 /*break*/, 3];
                                    return [4 /*yield*/, supabase.from('Configuracion').update({ value: JSON.stringify(brandingValue) }).eq('id', existing.id)];
                                case 2:
                                    error = (_b.sent()).error;
                                    return [2 /*return*/, error];
                                case 3: return [4 /*yield*/, supabase.from('Configuracion').insert({ key: 'general_branding', value: JSON.stringify(brandingValue), id_usuario: null })];
                                case 4:
                                    error = (_b.sent()).error;
                                    return [2 /*return*/, error];
                            }
                        });
                    }); };
                    saveTheme = function () { return __awaiter(void 0, void 0, void 0, function () {
                        var themeValue, _a, existing, selectError, error, error;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    themeValue = { color_palette_name: currentPalette.name };
                                    return [4 /*yield*/, supabase
                                            .from('Configuracion')
                                            .select('id')
                                            .eq('key', 'user_theme_settings')
                                            .eq('id_usuario', auth.user.id)
                                            .maybeSingle()];
                                case 1:
                                    _a = _b.sent(), existing = _a.data, selectError = _a.error;
                                    if (selectError)
                                        return [2 /*return*/, { error: selectError, data: themeValue }];
                                    if (!existing) return [3 /*break*/, 3];
                                    return [4 /*yield*/, supabase.from('Configuracion').update({ value: JSON.stringify(themeValue) }).eq('id', existing.id)];
                                case 2:
                                    error = (_b.sent()).error;
                                    return [2 /*return*/, { error: error, data: themeValue }];
                                case 3: return [4 /*yield*/, supabase.from('Configuracion').insert({ key: 'user_theme_settings', value: JSON.stringify(themeValue), id_usuario: auth.user.id })];
                                case 4:
                                    error = (_b.sent()).error;
                                    return [2 /*return*/, { error: error, data: themeValue }];
                            }
                        });
                    }); };
                    return [4 /*yield*/, Promise.all([saveBranding(), saveTheme()])];
                case 1:
                    _a = _b.sent(), brandingError = _a[0], themeResult = _a[1];
                    setIsSaving(false);
                    if (brandingError || themeResult.error) {
                        bError = brandingError ? "Branding: ".concat(brandingError.message) : '';
                        tError = themeResult.error ? "Theme: ".concat(themeResult.error.message) : '';
                        setFeedback({ type: 'error', message: "Error al guardar: ".concat(bError, " ").concat(tError).trim() });
                    }
                    else {
                        auth.updateUser({ color_palette_name: themeResult.data.color_palette_name });
                        setFeedback({ type: 'success', message: '¡Configuración guardada exitosamente!' });
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    return (<div className="space-y-8">
        <div className="bg-base-200 p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl">
            <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary p-3 rounded-lg">
                    <Icons_1.BuildingIcon className="h-8 w-8"/>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-base-content">Branding de la Aplicación</h3>
                    <p className="mt-1 text-sm text-neutral">
                    Personaliza el título y el logo de la aplicación. Estos cambios son generales y afectarán a todos los usuarios.
                    </p>
                </div>
            </div>
            <div className="mt-6 space-y-4 pt-6 border-t border-base-border">
                <div>
                    <label htmlFor="appTitle" className="block text-sm font-medium">Título de la Aplicación</label>
                    <input id="appTitle" type="text" value={appTitle} onChange={function (e) { return setAppTitle(e.target.value); }} placeholder="Ej: Mi Empresa App" className="mt-1 block w-full max-w-sm input-style"/>
                </div>
                <div>
                    <label htmlFor="logoUrl" className="block text-sm font-medium">URL del Logo</label>
                    <div className="flex items-center space-x-4 mt-1">
                    <img src={logoUrl} alt="Current Logo" className="h-12 w-12 bg-base-300 p-1 rounded-full object-contain"/>
                    <input id="logoUrl" type="text" value={logoUrl} onChange={function (e) { return setLogoUrl(e.target.value); }} placeholder="Ingresa la URL del logo" className="block w-full max-w-sm input-style"/>
                    </div>
                </div>
            </div>
        </div>
      
        <div className="bg-base-200 p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl">
             <div className="flex items-start gap-4">
                <div className="bg-secondary/10 text-secondary p-3 rounded-lg">
                    <Icons_1.PaletteIcon className="h-8 w-8"/>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-base-content">Paleta de Colores</h3>
                    <p className="mt-1 text-sm text-neutral">Selecciona un esquema de colores que se ajuste a tu marca. Este cambio es específico para tu usuario.</p>
                </div>
            </div>
            <div className="mt-6 pt-6 border-t border-base-border">
                {Object.entries(groupedPalettes).map(function (_a) {
            var category = _a[0], palettes = _a[1];
            return (<div key={category} className="mb-6">
                    <h5 className="font-medium text-neutral mb-3">{category}</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {palettes.map(function (palette) { return (<div key={palette.name} onClick={function () { return setPalette(palette); }} className={"cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 ".concat(currentPalette.name === palette.name
                        ? 'border-primary shadow-lg scale-105'
                        : 'border-base-border hover:border-primary/50')}>
                        <div className="flex space-x-2">
                            <div style={{ backgroundColor: palette.light.primary }} className="h-8 w-8 rounded-full"></div>
                            <div style={{ backgroundColor: palette.light.secondary }} className="h-8 w-8 rounded-full"></div>
                            <div style={{ backgroundColor: palette.light.accent }} className="h-8 w-8 rounded-full"></div>
                        </div>
                        <p className="mt-2 text-sm font-medium text-center">{palette.name}</p>
                        </div>); })}
                    </div>
                </div>);
        })}
            </div>
        </div>
      
       {feedback && (<div className={"p-3 rounded-md text-sm ".concat(feedback.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error')}>
          {feedback.message}
        </div>)}

      <div className="flex justify-end pt-6">
          <button onClick={handleSave} disabled={isSaving} className="flex items-center justify-center gap-2 px-5 py-2.5 font-medium text-white bg-primary rounded-lg hover:bg-primary-focus focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors disabled:bg-primary/50">
            {isSaving ? (<Spinner_1.default />) : (<Icons_1.SaveIcon className="h-5 w-5"/>)}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

    </div>);
};
exports.default = CustomizationSettings;
