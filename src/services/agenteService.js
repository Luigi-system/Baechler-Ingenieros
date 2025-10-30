"use strict";
// services/agenteService.ts
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
exports.createAgenteClient = void 0;
var createAgenteClient = function () {
    return {
        /**
         * Sends a payload to the configured external agent webhook.
         * The webhook is expected to interpret this payload (either a natural language query or structured data for insertion)
         * and return a structured response.
         * @param payload The natural language query from the user (string) or structured data for insertion (object).
         * @param webhookUrl The URL of the external agent webhook.
         * @returns A Promise that resolves with the agent's structured response (expected AIResponse format or raw data).
         */
        sendToAgent: function (payload, webhookUrl) { return __awaiter(void 0, void 0, void 0, function () {
            var consultaContent, body, response, errorDetail, errorData, jsonParseError_1, responseText, text;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!webhookUrl)
                            throw new Error("Agente webhook URL no está configurado.");
                        if (typeof payload === 'string') {
                            consultaContent = payload; // Natural language query
                        }
                        else if (typeof payload === 'object' && payload !== null) {
                            // Structured data for insertion/action, wrap in 'data' key as per instruction
                            consultaContent = { "data": payload };
                        }
                        else {
                            throw new Error("Payload de Agente no válido. Debe ser un string (consulta) o un objeto (datos a guardar).");
                        }
                        body = {
                            key: "agente", // Fixed key as per user specification
                            consulta: consultaContent
                        };
                        return [4 /*yield*/, fetch(webhookUrl, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(body),
                            })];
                    case 1:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 7];
                        errorDetail = "Agente webhook request failed with status: ".concat(response.status);
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 6]);
                        return [4 /*yield*/, response.json()];
                    case 3:
                        errorData = _b.sent();
                        // If errorData is an object, try to extract a message or stringify it
                        errorDetail = ((_a = errorData.error) === null || _a === void 0 ? void 0 : _a.message) || JSON.stringify(errorData);
                        return [3 /*break*/, 6];
                    case 4:
                        jsonParseError_1 = _b.sent();
                        return [4 /*yield*/, response.text()];
                    case 5:
                        responseText = _b.sent();
                        errorDetail = "Agente webhook request failed (status: ".concat(response.status, ", response: ").concat(responseText.substring(0, 200), "...)");
                        return [3 /*break*/, 6];
                    case 6: throw new Error(errorDetail);
                    case 7: return [4 /*yield*/, response.text()];
                    case 8:
                        text = _b.sent();
                        try {
                            // Attempt to parse the response text as JSON.
                            // An empty string will cause an error, which is caught below.
                            return [2 /*return*/, JSON.parse(text)];
                        }
                        catch (e) {
                            // If parsing fails, check for common non-JSON webhook responses.
                            if (text.trim().toLowerCase() === 'accepted') {
                                // This indicates an async webhook. Our app requires a sync response with data.
                                throw new Error('El agente aceptó la solicitud pero no devolvió datos de inmediato. La configuración del webhook debe ser ajustada para que devuelva una respuesta JSON síncrona.');
                            }
                            // If the response is not "Accepted" and not valid JSON, it's an unexpected format.
                            throw new Error("Respuesta inesperada del agente (no es JSON): ".concat(text.substring(0, 200)));
                        }
                        return [2 /*return*/];
                }
            });
        }); }
    };
};
exports.createAgenteClient = createAgenteClient;
