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
exports.generateVisitReport = exports.generateServiceReport = void 0;
var jspdf_1 = require("jspdf");
var jspdf_autotable_1 = require("jspdf-autotable");
// --- HELPER FUNCTIONS ---
/**
 * Fetches an image from a URL and converts it to a base64 data string.
 * This method uses the `fetch` API to avoid CORS issues that can occur
 * when loading images directly onto a canvas from a different origin.
 * @param url The URL of the image to fetch.
 * @returns A Promise that resolves with the base64 data URL.
 */
var getBase64ImageFromUrl = function (url) { return __awaiter(void 0, void 0, void 0, function () {
    var response, blob_1, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, fetch(url)];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    throw new Error("Network response was not ok: ".concat(response.statusText));
                }
                return [4 /*yield*/, response.blob()];
            case 2:
                blob_1 = _a.sent();
                // Use FileReader to convert the blob to a base64 data URL.
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var reader = new FileReader();
                        reader.onloadend = function () {
                            if (reader.result) {
                                resolve(reader.result);
                            }
                            else {
                                reject(new Error('FileReader failed to produce a result.'));
                            }
                        };
                        reader.onerror = function (error) { return reject(error); };
                        reader.readAsDataURL(blob_1);
                    })];
            case 3:
                error_1 = _a.sent();
                console.error("Error in getBase64ImageFromUrl for URL: ".concat(url), error_1);
                // Rethrow to be caught by the caller
                throw error_1;
            case 4: return [2 /*return*/];
        }
    });
}); };
var addHeaderAndFooter = function (doc, logoUrl, title) { return __awaiter(void 0, void 0, void 0, function () {
    var logoDataUrl, e_1, pageCount, i, pageStr;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logoDataUrl = null;
                if (!logoUrl) return [3 /*break*/, 4];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, getBase64ImageFromUrl(logoUrl)];
            case 2:
                // Fetch the image and convert it to base64
                logoDataUrl = _a.sent();
                return [3 /*break*/, 4];
            case 3:
                e_1 = _a.sent();
                console.error("Failed to fetch or convert logo URL to base64:", e_1);
                return [3 /*break*/, 4];
            case 4:
                pageCount = doc.internal.getNumberOfPages();
                for (i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    // HEADER
                    if (logoDataUrl) {
                        try {
                            // Use the fetched base64 data URL
                            doc.addImage(logoDataUrl, 'PNG', 15, 10, 30, 15, undefined, 'FAST');
                        }
                        catch (e) {
                            console.error("Could not add logo to PDF header:", e);
                            doc.text("Logo", 15, 15); // Fallback text
                        }
                    }
                    else {
                        doc.text("Logo", 15, 15); // Fallback if no logoUrl or fetch failed
                    }
                    doc.setFontSize(14).setFont(undefined, 'bold');
                    doc.text(title, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
                    // FOOTER
                    doc.setFontSize(8);
                    pageStr = "P\u00E1gina ".concat(i, " de ").concat(pageCount);
                    doc.text(pageStr, doc.internal.pageSize.getWidth() / 2, 287, { align: 'center' });
                }
                return [2 /*return*/];
        }
    });
}); };
var addImageGallery = function (doc, images, startY) {
    if (!images || images.length === 0)
        return startY;
    var margin = 15;
    var padding = 5;
    var imgWidth = (doc.internal.pageSize.width - (2 * margin) - (2 * padding)) / 3;
    var imgHeight = 40;
    var pageHeight = doc.internal.pageSize.height;
    var x = margin;
    var y = startY;
    images.forEach(function (imgData, index) {
        if (y + imgHeight + padding > pageHeight - 20) { // Check for footer space
            doc.addPage();
            y = 20;
            x = margin;
        }
        try {
            // Extract format from base64 string, default to JPEG
            var format = (imgData.match(/data:image\/(.+);base64,/) || [, 'jpeg'])[1].toUpperCase();
            doc.addImage(imgData, format, x, y, imgWidth, imgHeight, undefined, 'FAST');
        }
        catch (e) {
            doc.text('Error al cargar imagen', x + 5, y + 20);
            console.error("Error adding image to PDF", e);
        }
        x += imgWidth + padding;
        if ((index + 1) % 3 === 0 && index < images.length - 1) {
            x = margin;
            y += imgHeight + padding;
        }
    });
    // Return the Y position after the last row of images
    return y + imgHeight + padding;
};
// --- MAIN PDF GENERATORS ---
var generateServiceReport = function (report_1, logoUrl_1) {
    var args_1 = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args_1[_i - 2] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([report_1, logoUrl_1], args_1, true), void 0, function (report, logoUrl, outputType) {
        var doc, pageContentStartY, finalY, drawSection, format;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
        if (outputType === void 0) { outputType = 'save'; }
        return __generator(this, function (_t) {
            switch (_t.label) {
                case 0:
                    doc = new jspdf_1.default();
                    pageContentStartY = 30;
                    finalY = pageContentStartY;
                    // --- DETAILS TABLE ---
                    (0, jspdf_autotable_1.default)(doc, {
                        startY: finalY,
                        body: [
                            [{ content: 'CLIENTE', styles: { fontStyle: 'bold' } }, (_b = (_a = report.empresa) === null || _a === void 0 ? void 0 : _a.nombre) !== null && _b !== void 0 ? _b : 'N/A', { content: 'CÓDIGO', styles: { fontStyle: 'bold' } }, (_c = report.codigo_reporte) !== null && _c !== void 0 ? _c : 'N/A'],
                            [{ content: 'RESPONSABLE', styles: { fontStyle: 'bold' } }, "".concat((_e = (_d = report.encargado) === null || _d === void 0 ? void 0 : _d.nombre) !== null && _e !== void 0 ? _e : '', " ").concat((_g = (_f = report.encargado) === null || _f === void 0 ? void 0 : _f.apellido) !== null && _g !== void 0 ? _g : '').trim() || 'N/A', { content: 'FECHA', styles: { fontStyle: 'bold' } }, report.fecha ? new Date(report.fecha + 'T00:00:00Z').toLocaleDateString('es-ES') : 'N/A'],
                            [{ content: 'PLANTA / SEDE', styles: { fontStyle: 'bold' } }, (_h = report.nombre_planta) !== null && _h !== void 0 ? _h : 'N/A', { content: 'HORAS', styles: { fontStyle: 'bold' } }, "E: ".concat((_j = report.entrada) !== null && _j !== void 0 ? _j : '--:--', " - S: ").concat((_k = report.salida) !== null && _k !== void 0 ? _k : '--:--')],
                        ],
                        theme: 'grid',
                        styles: { fontSize: 9, cellPadding: 1.5, valign: 'middle' },
                    });
                    finalY = doc.lastAutoTable.finalY;
                    (0, jspdf_autotable_1.default)(doc, {
                        startY: finalY + 2,
                        body: [
                            [{ content: 'N° SERIE', styles: { fontStyle: 'bold' } }, (_l = report.serie_maquina) !== null && _l !== void 0 ? _l : 'N/A', { content: 'MODELO', styles: { fontStyle: 'bold' } }, (_m = report.modelo_maquina) !== null && _m !== void 0 ? _m : 'N/A'],
                            [{ content: 'MARCA', styles: { fontStyle: 'bold' } }, (_o = report.marca_maquina) !== null && _o !== void 0 ? _o : 'N/A', { content: 'LINEA', styles: { fontStyle: 'bold' } }, (_p = report.linea_maquina) !== null && _p !== void 0 ? _p : 'N/A'],
                        ],
                        theme: 'grid',
                        styles: { fontSize: 9, cellPadding: 1.5, valign: 'middle' },
                    });
                    finalY = doc.lastAutoTable.finalY;
                    drawSection = function (title, content, images) {
                        // Check if there is enough space, otherwise add a new page.
                        // 20 for header, 20 for footer, 10 for table header, 10 for text, 45 for one row of images
                        if (finalY > doc.internal.pageSize.height - 105) {
                            doc.addPage();
                            finalY = pageContentStartY;
                        }
                        (0, jspdf_autotable_1.default)(doc, {
                            startY: finalY + 5,
                            head: [[title]],
                            headStyles: { fontStyle: 'bold', fillColor: '#EAEAEA', textColor: '#333' },
                            body: [[content || 'N/A']],
                            theme: 'grid',
                            didDrawPage: function (data) { var _a, _b; finalY = (_b = (_a = data.cursor) === null || _a === void 0 ? void 0 : _a.y) !== null && _b !== void 0 ? _b : finalY; }
                        });
                        finalY = doc.lastAutoTable.finalY;
                        if (images && images.length > 0) {
                            finalY = addImageGallery(doc, images, finalY + 3);
                        }
                    };
                    drawSection('PROBLEMAS ENCONTRADOS', report.problemas_encontrados, report.fotosProblemasBase64);
                    drawSection('ACCIONES REALIZADAS', report.acciones_realizadas, report.fotosAccionesBase64);
                    drawSection('OBSERVACIONES', report.observaciones, report.fotosObservacionesBase64);
                    // --- FINAL STATUS TABLE ---
                    if (finalY > doc.internal.pageSize.height - 50) {
                        doc.addPage();
                        finalY = pageContentStartY;
                    }
                    (0, jspdf_autotable_1.default)(doc, {
                        startY: finalY + 5,
                        head: [[{ content: 'ESTADO FINAL', colSpan: 6, styles: { halign: 'center', fillColor: '#EAEAEA', textColor: '#333' } }]],
                        body: [
                            [
                                'OPERATIVO',
                                "(".concat(report.operativo || report.estado_maquina === 'operativo' ? 'X' : ' ', ")"),
                                'INOPERATIVO',
                                "(".concat(report.inoperativo || report.estado_maquina === 'inoperativo' ? 'X' : ' ', ")"),
                                'EN PRUEBA',
                                "(".concat(report.en_prueba || report.estado_maquina === 'en_prueba' ? 'X' : ' ', ")"),
                            ]
                        ],
                        theme: 'grid',
                        styles: { fontSize: 9, cellPadding: 1.5, halign: 'center' },
                        didDrawPage: function (data) { var _a, _b; finalY = (_b = (_a = data.cursor) === null || _a === void 0 ? void 0 : _a.y) !== null && _b !== void 0 ? _b : finalY; }
                    });
                    finalY = doc.lastAutoTable.finalY;
                    // --- SIGNATURES ---
                    if (finalY > doc.internal.pageSize.height - 60) {
                        doc.addPage();
                        finalY = pageContentStartY;
                    }
                    // Add signature image first to get its position
                    if (report.fotoFirmaBase64) {
                        try {
                            format = (report.fotoFirmaBase64.match(/data:image\/(.+);base64,/) || [, 'jpeg'])[1].toUpperCase();
                            doc.addImage(report.fotoFirmaBase64, format, 120, finalY + 10, 60, 20, undefined, 'FAST');
                        }
                        catch (e) {
                            console.error("Could not add signature image", e);
                        }
                    }
                    (0, jspdf_autotable_1.default)(doc, {
                        startY: finalY + 5,
                        body: [
                            [{ content: "REALIZADO POR:\n".concat((_r = (_q = report.usuario) === null || _q === void 0 ? void 0 : _q.nombres) !== null && _r !== void 0 ? _r : 'N/A'), styles: { halign: 'center', } }, { content: "CONFORMIDAD CLIENTE:\n".concat((_s = report.nombre_firmante) !== null && _s !== void 0 ? _s : 'N/A'), styles: { halign: 'center' } }],
                        ],
                        theme: 'grid',
                        styles: { minCellHeight: 35, valign: 'bottom', fontStyle: 'bold', fontSize: 9 },
                        bodyStyles: { lineWidth: 0.1, lineColor: '#fff' }, // hide all but top line
                        didParseCell: function (data) {
                            if (data.row.index === 0) {
                                data.cell.styles.lineColor = '#000';
                            }
                        }
                    });
                    // --- ADD HEADERS AND FOOTERS TO ALL PAGES ---
                    return [4 /*yield*/, addHeaderAndFooter(doc, logoUrl, 'REPORTE DE SERVICIO')];
                case 1:
                    // --- ADD HEADERS AND FOOTERS TO ALL PAGES ---
                    _t.sent();
                    if (outputType === 'save') {
                        doc.save("reporte-servicio-".concat(report.codigo_reporte || 'NUEVO', ".pdf"));
                    }
                    else {
                        return [2 /*return*/, doc.output('datauristring')];
                    }
                    return [2 /*return*/];
            }
        });
    });
};
exports.generateServiceReport = generateServiceReport;
var generateVisitReport = function (report_1, logoUrl_1) {
    var args_1 = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args_1[_i - 2] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([report_1, logoUrl_1], args_1, true), void 0, function (report, logoUrl, outputType) {
        var doc, pageContentStartY, finalY, drawSection, format;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        if (outputType === void 0) { outputType = 'save'; }
        return __generator(this, function (_p) {
            switch (_p.label) {
                case 0:
                    doc = new jspdf_1.default();
                    pageContentStartY = 30;
                    finalY = pageContentStartY;
                    // --- DETAILS TABLE ---
                    (0, jspdf_autotable_1.default)(doc, {
                        startY: finalY,
                        body: [
                            [{ content: 'CLIENTE', styles: { fontStyle: 'bold' } }, (_b = (_a = report.empresa) === null || _a === void 0 ? void 0 : _a.nombre) !== null && _b !== void 0 ? _b : 'N/A'],
                            [{ content: 'PLANTA / SEDE', styles: { fontStyle: 'bold' } }, (_d = (_c = report.planta) === null || _c === void 0 ? void 0 : _c.nombre) !== null && _d !== void 0 ? _d : 'N/A'],
                            [{ content: 'RESPONSABLE', styles: { fontStyle: 'bold' } }, "".concat((_f = (_e = report.encargado) === null || _e === void 0 ? void 0 : _e.nombre) !== null && _f !== void 0 ? _f : '', " ").concat((_h = (_g = report.encargado) === null || _g === void 0 ? void 0 : _g.apellido) !== null && _h !== void 0 ? _h : '').trim() || 'N/A'],
                            [{ content: 'FECHA', styles: { fontStyle: 'bold' } }, report.fecha ? new Date(report.fecha + 'T00:00:00Z').toLocaleDateString('es-ES') : 'N/A'],
                            [{ content: 'REALIZADO POR', styles: { fontStyle: 'bold' } }, (_k = (_j = report.usuario) === null || _j === void 0 ? void 0 : _j.nombres) !== null && _k !== void 0 ? _k : 'N/A']
                        ],
                        theme: 'grid',
                        styles: { fontSize: 9, cellPadding: 2 },
                        columnStyles: { 0: { cellWidth: 40 } },
                    });
                    finalY = doc.lastAutoTable.finalY;
                    drawSection = function (title, content) {
                        if (finalY > doc.internal.pageSize.height - 60) {
                            doc.addPage();
                            finalY = pageContentStartY;
                        }
                        (0, jspdf_autotable_1.default)(doc, {
                            startY: finalY + 5,
                            head: [[title]],
                            headStyles: { fontStyle: 'bold', fillColor: '#EAEAEA', textColor: '#333' },
                            body: [[content || 'N/A']],
                            theme: 'grid',
                            didDrawPage: function (data) { var _a, _b; finalY = (_b = (_a = data.cursor) === null || _a === void 0 ? void 0 : _a.y) !== null && _b !== void 0 ? _b : finalY; }
                        });
                        finalY = doc.lastAutoTable.finalY;
                    };
                    drawSection('MOTIVO DE LA VISITA', report.motivo_visita);
                    drawSection('TEMAS TRATADOS', report.temas_tratados);
                    drawSection('ACUERDOS', report.acuerdos);
                    drawSection('PENDIENTES', report.pendientes);
                    drawSection('OBSERVACIONES', report.observaciones);
                    // --- SIGNATURES ---
                    if (finalY > doc.internal.pageSize.height - 60) {
                        doc.addPage();
                        finalY = pageContentStartY;
                    }
                    if (report.fotoFirmaBase64) {
                        try {
                            format = (report.fotoFirmaBase64.match(/data:image\/(.+);base64,/) || [, 'jpeg'])[1].toUpperCase();
                            doc.addImage(report.fotoFirmaBase64, format, 120, finalY + 10, 60, 20, undefined, 'FAST');
                        }
                        catch (e) {
                            console.error("Could not add signature image", e);
                        }
                    }
                    (0, jspdf_autotable_1.default)(doc, {
                        startY: finalY + 5,
                        body: [
                            [{ content: "REALIZADO POR:\n".concat((_m = (_l = report.usuario) === null || _l === void 0 ? void 0 : _l.nombres) !== null && _m !== void 0 ? _m : 'N/A'), styles: { halign: 'center' } }, { content: "CONFORMIDAD CLIENTE:\n".concat((_o = report.nombre_firmante) !== null && _o !== void 0 ? _o : 'N/A'), styles: { halign: 'center' } }],
                        ],
                        theme: 'grid',
                        styles: { minCellHeight: 35, valign: 'bottom', fontStyle: 'bold', fontSize: 9 },
                        bodyStyles: { lineWidth: 0.1, lineColor: '#fff' },
                        didParseCell: function (data) {
                            if (data.row.index === 0) {
                                data.cell.styles.lineColor = '#000';
                            }
                        }
                    });
                    // --- ADD HEADERS AND FOOTERS TO ALL PAGES ---
                    return [4 /*yield*/, addHeaderAndFooter(doc, logoUrl, 'REPORTE DE VISITA')];
                case 1:
                    // --- ADD HEADERS AND FOOTERS TO ALL PAGES ---
                    _p.sent();
                    if (outputType === 'save') {
                        doc.save("reporte-visita-".concat(report.codigo_reporte || 'NUEVO', ".pdf"));
                    }
                    else {
                        return [2 /*return*/, doc.output('datauristring')];
                    }
                    return [2 /*return*/];
            }
        });
    });
};
exports.generateVisitReport = generateVisitReport;
