"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_PERMISSIONS_CONFIG = exports.ALL_PERMISSIONS_LIST = exports.PERMISSIONS = void 0;
exports.PERMISSIONS = {
    DASHBOARD: 'dashboard',
    REPORTS: 'reports',
    MANAGEMENT: 'management',
    ASSISTANT: 'assistant',
    SETTINGS: 'settings',
};
// An array of all permission strings.
exports.ALL_PERMISSIONS_LIST = Object.values(exports.PERMISSIONS);
// An array of objects for UI rendering.
exports.ALL_PERMISSIONS_CONFIG = [
    { id: exports.PERMISSIONS.DASHBOARD, label: 'Dashboard' },
    { id: exports.PERMISSIONS.REPORTS, label: 'Reportes' },
    { id: exports.PERMISSIONS.MANAGEMENT, label: 'Gestión' },
    { id: exports.PERMISSIONS.ASSISTANT, label: 'Asistente IA' },
    { id: exports.PERMISSIONS.SETTINGS, label: 'Configuración' },
];
