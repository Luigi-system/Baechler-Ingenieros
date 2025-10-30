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
var Icons_1 = require("../ui/Icons");
var sampleJson = JSON.stringify([
    {
        "nombre": "Nuevo Cliente Alfa",
        "ruc": "12345678901",
        "direccion": "Calle Falsa 123"
    },
    {
        "nombre": "Compañía Beta",
        "ruc": "10987654321",
        "direccion": "Avenida Siempre Viva 742"
    }
], null, 2);
var DataImporter = function () {
    var supabase = (0, SupabaseContext_1.useSupabase)().supabase;
    var _a = (0, react_1.useState)(sampleJson), jsonInput = _a[0], setJsonInput = _a[1];
    var _b = (0, react_1.useState)('Empresa'), collectionName = _b[0], setCollectionName = _b[1];
    var _c = (0, react_1.useState)(false), isSaving = _c[0], setIsSaving = _c[1];
    var _d = (0, react_1.useState)(null), feedback = _d[0], setFeedback = _d[1];
    var handleSave = function () { return __awaiter(void 0, void 0, void 0, function () {
        var dataToInsert, error, error_1, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!collectionName.trim()) {
                        setFeedback({ type: 'error', message: 'Por favor, especifica el nombre de la colección/tabla.' });
                        return [2 /*return*/];
                    }
                    if (!supabase) {
                        setFeedback({ type: 'error', message: 'El cliente de Supabase no está inicializado. Por favor, ve a la configuración de la base de datos.' });
                        return [2 /*return*/];
                    }
                    setIsSaving(true);
                    setFeedback(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    dataToInsert = JSON.parse(jsonInput);
                    if (!Array.isArray(dataToInsert)) {
                        throw new Error("El JSON debe ser un array de objetos.");
                    }
                    return [4 /*yield*/, supabase.from(collectionName.trim()).insert(dataToInsert)];
                case 2:
                    error = (_a.sent()).error;
                    if (error)
                        throw error;
                    setFeedback({ type: 'success', message: "\u00A1".concat(dataToInsert.length, " registros importados exitosamente en la tabla '").concat(collectionName, "'!") });
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    errorMessage = 'Ocurrió un error inesperado.';
                    if (error_1 instanceof SyntaxError) {
                        errorMessage = 'Formato JSON inválido. Por favor, revisa tus datos.';
                    }
                    else if (error_1.message) {
                        // Customize Supabase error for clarity
                        if (error_1.message.includes("relation") && error_1.message.includes("does not exist")) {
                            errorMessage = "La tabla '".concat(collectionName, "' no existe. Por favor, verifica el nombre.");
                        }
                        else {
                            errorMessage = error_1.message;
                        }
                    }
                    setFeedback({ type: 'error', message: "Error al importar: ".concat(errorMessage) });
                    return [3 /*break*/, 5];
                case 4:
                    setIsSaving(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="space-y-6">
       <div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Importador de Datos</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Importa datos a tus tablas de la base de datos usando formato JSON.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="collection-name" className="font-medium text-sm">Nombre de la Colección/Tabla</label>
        <input type="text" id="collection-name" value={collectionName} onChange={function (e) { return setCollectionName(e.target.value); }} placeholder="Escribe el nombre de la tabla (ej. Empresa)" className="block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary focus:border-primary sm:text-sm"/>
      </div>

      <div>
        <label htmlFor="json-editor" className="block text-sm font-medium mb-1">Datos JSON (Debe ser un array de objetos)</label>
        <textarea id="json-editor" value={jsonInput} onChange={function (e) { return setJsonInput(e.target.value); }} placeholder="Pega tus datos JSON aquí..." className="w-full h-80 p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary"/>
      </div>

      {feedback && (<div className={"p-3 rounded-md text-sm ".concat(feedback.type === 'success' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200')}>
          {feedback.message}
        </div>)}

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={isSaving} className="flex items-center justify-center gap-2 px-5 py-2.5 font-medium text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors disabled:bg-primary/50">
          {isSaving ? (<svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>) : (<Icons_1.SaveIcon className="h-5 w-5"/>)}
          {isSaving ? 'Importando...' : 'Importar Datos'}
        </button>
      </div>
    </div>);
};
exports.default = DataImporter;
