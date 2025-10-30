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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_markdown_1 = require("react-markdown");
var recharts_1 = require("recharts");
var Icons_1 = require("../ui/Icons");
var ChatContext_1 = require("../../contexts/ChatContext");
var ThemeContext_1 = require("../../contexts/ThemeContext");
var AiServiceContext_1 = require("../../contexts/AiServiceContext");
var FilterableTable = function (_a) {
    var data = _a.data;
    var _b = (0, react_1.useState)(''), searchTerm = _b[0], setSearchTerm = _b[1];
    var filteredRows = (0, react_1.useMemo)(function () {
        if (!searchTerm.trim())
            return data.rows;
        return data.rows.filter(function (row) {
            return row.some(function (cell) {
                return String(cell).toLowerCase().includes(searchTerm.toLowerCase());
            });
        });
    }, [searchTerm, data.rows]);
    if (!data || !data.headers || !data.rows)
        return null;
    return (<div className="mt-3 space-y-2">
            <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icons_1.SearchIcon className="h-4 w-4 text-neutral"/>
                </div>
                <input type="text" placeholder={"Filtrar en ".concat(data.rows.length, " filas...")} value={searchTerm} onChange={function (e) { return setSearchTerm(e.target.value); }} className="block w-full text-sm pl-9 pr-3 py-1.5 input-style"/>
            </div>
            <div className="overflow-auto max-h-96 border border-base-border rounded-lg custom-scrollbar">
                <table className="min-w-full text-sm">
                    <thead className="bg-base-100 dark:bg-base-300 sticky top-0 z-10">
                        <tr>
                            {data.headers.map(function (header, i) { return (<th key={i} className="px-3 py-2 text-left font-semibold">{header}</th>); })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-base-border">
                        {filteredRows.length > 0 ? (filteredRows.map(function (row, i) { return (<tr key={i} className="hover:bg-base-100 dark:hover:bg-base-300/50">
                                    {row.map(function (cell, j) { return (<td key={j} className="px-3 py-2 whitespace-pre-wrap">{String(cell)}</td>); })}
                                </tr>); })) : (<tr>
                                <td colSpan={data.headers.length} className="px-3 py-4 text-center text-neutral">
                                    No se encontraron resultados para "{searchTerm}".
                                </td>
                            </tr>)}
                    </tbody>
                </table>
            </div>
        </div>);
};
var BarChartComponent = function (_a) {
    var data = _a.data;
    var themeMode = (0, ThemeContext_1.useTheme)().themeMode;
    var tickColor = themeMode === 'dark' ? '#9CA3AF' : '#6B7280';
    return (<div className="mt-3 h-60">
            <recharts_1.ResponsiveContainer width="100%" height="100%">
                <recharts_1.BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <recharts_1.XAxis dataKey="name" stroke={tickColor} fontSize={12}/>
                    <recharts_1.YAxis stroke={tickColor} fontSize={12}/>
                    <recharts_1.Tooltip contentStyle={{ backgroundColor: 'var(--color-base-200)', border: '1px solid var(--color-base-border)' }}/>
                    <recharts_1.Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]}/>
                </recharts_1.BarChart>
            </recharts_1.ResponsiveContainer>
        </div>);
};
var PieChartComponent = function (_a) {
    var data = _a.data;
    var COLORS = ['var(--color-primary)', 'var(--color-secondary)', 'var(--color-accent)', '#34d399', '#f9a8d4'];
    return (<div className="mt-3 h-60">
            <recharts_1.ResponsiveContainer width="100%" height="100%">
                <recharts_1.PieChart>
                    <recharts_1.Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                         {data.map(function (entry, index) { return <recharts_1.Cell key={"cell-".concat(index)} fill={COLORS[index % COLORS.length]}/>; })}
                    </recharts_1.Pie>
                    <recharts_1.Tooltip contentStyle={{ backgroundColor: 'var(--color-base-200)', border: '1px solid var(--color-base-border)' }}/>
                    <recharts_1.Legend />
                </recharts_1.PieChart>
            </recharts_1.ResponsiveContainer>
        </div>);
};
var Assistant = function (_a) {
    var isOpen = _a.isOpen, onClose = _a.onClose;
    var _b = (0, AiServiceContext_1.useAiService)(), service = _b.service, isConfigured = _b.isConfigured;
    var _c = (0, ChatContext_1.useChat)(), messages = _c.messages, isLoading = _c.isLoading, sendMessage = _c.sendMessage, setHasUnreadMessage = _c.setHasUnreadMessage;
    var _d = (0, react_1.useState)(''), input = _d[0], setInput = _d[1];
    var messagesEndRef = (0, react_1.useRef)(null);
    var _e = (0, react_1.useState)(null), activeForm = _e[0], setActiveForm = _e[1];
    var _f = (0, react_1.useState)({}), formValues = _f[0], setFormValues = _f[1];
    var scrollToBottom = function () { var _a; return (_a = messagesEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: "smooth" }); };
    (0, react_1.useEffect)(function () {
        scrollToBottom();
        // Find the last message from the AI that contains a form
        var lastAiMessageWithForm = __spreadArray([], messages, true).reverse().find(function (msg) { return msg.sender === 'ai' && msg.content.form; });
        if (lastAiMessageWithForm) {
            var messageIndex = messages.indexOf(lastAiMessageWithForm);
            var formContent = lastAiMessageWithForm.content.form;
            var fields = void 0;
            if (Array.isArray(formContent)) {
                // Standard, correct case
                fields = formContent;
            }
            else if (formContent && typeof formContent === 'object' && Array.isArray(formContent.fields)) {
                // Handle malformed AI response: { title: '...', fields: [...] }
                console.warn("AI returned a non-standard form object. Adapting to its structure.");
                fields = formContent.fields;
            }
            if (fields && Array.isArray(fields) && fields.every(function (f) { return typeof f === 'object' && f.name && f.label && f.type; })) {
                // Only update if the form is different from the current active one
                if ((activeForm === null || activeForm === void 0 ? void 0 : activeForm.messageIndex) !== messageIndex) {
                    setActiveForm({ messageIndex: messageIndex, fields: fields });
                    var initialValues = fields.reduce(function (acc, field) {
                        acc[field.name] = field.type === 'checkbox' ? false : '';
                        return acc;
                    }, {});
                    setFormValues(initialValues);
                }
            }
            else {
                console.warn("AI response contained a 'form' field that was not an array or a recognized object structure:", formContent);
                if (activeForm) {
                    setActiveForm(null);
                    setFormValues({});
                }
            }
        }
        else {
            if (activeForm) {
                setActiveForm(null); // Clear form if no longer present in last message
                setFormValues({}); // Also clear form values
            }
        }
    }, [messages, activeForm]);
    (0, react_1.useEffect)(function () {
        if (messages.length > 0 && messages[messages.length - 1].sender === 'ai' && !isOpen) {
            setHasUnreadMessage(true);
        }
    }, [messages, isOpen, setHasUnreadMessage]);
    (0, react_1.useEffect)(function () {
        var handleKeyDown = function (event) {
            if (event.key === 'Escape')
                onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return function () {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);
    var handleSend = (0, react_1.useCallback)(function (prompt) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (prompt.trim() === '' || isLoading)
                        return [2 /*return*/];
                    setInput('');
                    return [4 /*yield*/, sendMessage(prompt)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [isLoading, sendMessage]);
    var handleActionClick = function (actionPrompt) {
        handleSend(actionPrompt);
    };
    var handleFormInputChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value, type = _a.type;
        var isCheckbox = type === 'checkbox';
        var checked = e.target.checked;
        setFormValues(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[name] = isCheckbox ? checked : value, _a)));
        });
    };
    var handleFormSubmit = function () { return __awaiter(void 0, void 0, void 0, function () {
        var processedFormValues, submissionPrompt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!activeForm)
                        return [2 /*return*/];
                    processedFormValues = __assign({}, formValues);
                    activeForm.fields.forEach(function (field) {
                        if (field.type === 'select') {
                            var selectedValue = formValues[field.name];
                            if (typeof selectedValue === 'string' && selectedValue.includes(':')) {
                                processedFormValues[field.name] = selectedValue.split(':')[0].trim();
                            }
                        }
                    });
                    submissionPrompt = "El usuario ha completado el formulario con los siguientes datos: ".concat(JSON.stringify(processedFormValues), ". Procede a crear el registro en la base de datos.");
                    setActiveForm(null);
                    setFormValues({});
                    return [4 /*yield*/, sendMessage(submissionPrompt)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    if (!isOpen)
        return null;
    var assistantContent = function () {
        if (!isConfigured(service)) {
            return (<div className="flex flex-col h-full justify-center items-center text-center p-4">
                <h3 className="text-lg font-semibold">Servicio No Configurado</h3>
                <p className="text-neutral mt-2 text-sm">
                    El servicio de IA ('{service}') no está configurado.
                    <br />
                    Por favor, ve a Configuración &gt; Servicios de IA para seleccionarlo y asegúrate que la API Key esté disponible.
                </p>
            </div>);
        }
        return (<>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                {messages.map(function (msg, index) {
                var isUser = msg.sender === 'user';
                var content = msg.content;
                if (isUser && typeof content === 'string') {
                    return (<div key={index} className="flex justify-end animate-slide-in-up">
                            <div className="max-w-lg px-4 py-2 rounded-2xl bg-primary text-white rounded-br-none">{content}</div>
                          </div>);
                }
                if (!isUser && typeof content === 'object') {
                    var aiContent = content;
                    var statusDisplay = aiContent.statusDisplay;
                    return (<div key={index} className="flex items-start gap-3 justify-start animate-slide-in-up">
                             <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0"><Icons_1.AssistantIcon className="h-5 w-5 text-white"/></div>
                            <div className="max-w-lg p-3 rounded-2xl bg-base-300 rounded-bl-none w-full">
                                {statusDisplay && (<div role="alert" aria-live="assertive" className={"p-4 rounded-lg mb-3 flex items-center gap-3 ".concat(statusDisplay.icon === 'success' ? 'bg-success/10 text-success' :
                                statusDisplay.icon === 'error' ? 'bg-error/10 text-error' :
                                    statusDisplay.icon === 'warning' ? 'bg-warning/10 text-warning' :
                                        'bg-info/10 text-info')}>
                                        {statusDisplay.icon === 'success' && <Icons_1.CheckCircleIcon className="h-8 w-8 shrink-0"/>}
                                        {(statusDisplay.icon === 'error' || statusDisplay.icon === 'warning') && <Icons_1.AlertTriangleIcon className="h-8 w-8 shrink-0"/>}
                                        {statusDisplay.icon === 'info' && <Icons_1.AssistantIcon className="h-8 w-8 shrink-0"/>} {/* Reusing AssistantIcon for general info */}
                                        <div>
                                            <h4 className="font-bold text-lg">{statusDisplay.title}</h4>
                                            <p className="text-sm">{statusDisplay.message}</p>
                                        </div>
                                    </div>)}

                                <div className="prose prose-sm max-w-none prose-zinc dark:prose-invert text-base-content"><react_markdown_1.default>{aiContent.displayText}</react_markdown_1.default></div>
                                {aiContent.table && <FilterableTable data={aiContent.table}/>}
                                {aiContent.chart && aiContent.chart.type === 'bar' && <BarChartComponent data={aiContent.chart.data}/>}
                                {aiContent.chart && aiContent.chart.type === 'pie' && <PieChartComponent data={aiContent.chart.data}/>}
                                {aiContent.actions && (<div className="mt-3 flex flex-wrap gap-2">
                                        {aiContent.actions.map(function (action, i) { return (<button key={i} onClick={function () { return handleActionClick(action.prompt); }} className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-focus transition-colors">
                                                {action.label}
                                            </button>); })}
                                    </div>)}
                                {aiContent.form && (activeForm === null || activeForm === void 0 ? void 0 : activeForm.messageIndex) === index && (<form onSubmit={function (e) { e.preventDefault(); handleFormSubmit(); }} className="mt-4 space-y-3 p-3 bg-base-100/50 rounded-lg">
                                        <p className="text-sm font-semibold text-base-content">Por favor, completa el formulario:</p>
                                        {activeForm.fields.map(function (field) {
                                var _a;
                                return (<div key={field.name}>
                                                <label htmlFor={field.name} className="block text-xs font-medium mb-1">{field.label}</label>
                                                {field.type === 'text' && <input type="text" id={field.name} name={field.name} value={formValues[field.name] || ''} onChange={handleFormInputChange} className="w-full text-sm input-style" required placeholder={field.placeholder || ''}/>}
                                                {field.type === 'select' && (<select id={field.name} name={field.name} value={formValues[field.name] || ''} onChange={handleFormInputChange} className="w-full text-sm input-style" required>
                                                        <option value="" disabled>{field.placeholder || 'Selecciona...'}</option>
                                                        {(_a = field.options) === null || _a === void 0 ? void 0 : _a.map(function (opt) { return <option key={opt} value={opt}>{opt}</option>; })}
                                                    </select>)}
                                                {field.type === 'checkbox' && <input type="checkbox" id={field.name} name={field.name} checked={formValues[field.name] || false} onChange={handleFormInputChange} className="rounded text-primary focus:ring-primary"/>}
                                            </div>);
                            })}
                                        <button type="submit" className="w-full text-sm font-semibold bg-primary text-white rounded-md py-2 hover:bg-primary-focus transition-colors">
                                            Enviar Datos
                                        </button>
                                    </form>)}
                                {aiContent.suggestions && (<div className="mt-3 flex flex-wrap gap-1.5">
                                    {aiContent.suggestions.map(function (s, i) { return (<button key={i} onClick={function () { return handleSend(s); }} className="px-2.5 py-1 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors">
                                            {s}
                                        </button>); })}
                                </div>)}
                            </div>
                          </div>);
                }
                return null;
            })}
                {isLoading && (<div className="flex items-start gap-3 justify-start animate-slide-in-up">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0"><Icons_1.AssistantIcon className="h-5 w-5 text-white"/></div>
                        <div className="max-w-sm p-3 rounded-2xl bg-base-300 rounded-bl-none">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-neutral animate-pulse"></div>
                                <div className="w-2 h-2 rounded-full bg-neutral animate-pulse [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 rounded-full bg-neutral animate-pulse [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    </div>)}
                <div ref={messagesEndRef}/>
            </div>
            <div className="p-4 border-t border-base-border shrink-0">
                <div className="relative">
                    <input type="text" value={input} onChange={function (e) { return setInput(e.target.value); }} onKeyPress={function (e) { return e.key === 'Enter' && handleSend(input); }} placeholder="Ej: ¿Cuántos reportes hay?" className="w-full pl-4 pr-12 py-3 bg-base-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary input-style" disabled={isLoading}/>
                    <button onClick={function () { return handleSend(input); }} disabled={isLoading || !input} className="absolute inset-y-0 right-0 flex items-center justify-center w-12 h-full text-primary disabled:text-neutral transition-colors">
                        <Icons_1.SendIcon className="h-6 w-6"/>
                    </button>
                </div>
            </div>
        </>);
    };
    return (<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-end p-4" onClick={onClose}>
        <div className="bg-base-200 rounded-xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col animate-slide-in-up" onClick={function (e) { return e.stopPropagation(); }}>
            <div className="flex items-center justify-between p-4 border-b border-base-border shrink-0">
                <h2 className="text-lg font-semibold text-base-content">Asistente IA</h2>
                <button onClick={onClose} className="p-1 rounded-full text-neutral hover:bg-base-300">
                    <Icons_1.XIcon className="h-6 w-6"/>
                </button>
            </div>
            {assistantContent()}
        </div>
    </div>);
};
exports.default = Assistant;
