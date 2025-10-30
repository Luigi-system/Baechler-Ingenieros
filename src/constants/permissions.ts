export const PERMISSIONS = {
    DASHBOARD: 'dashboard',
    REPORTS: 'reports',
    MANAGEMENT: 'management',
    ASSISTANT: 'assistant',
    SETTINGS: 'settings',
};

// An array of all permission strings.
export const ALL_PERMISSIONS_LIST: string[] = Object.values(PERMISSIONS);

// An array of objects for UI rendering.
export const ALL_PERMISSIONS_CONFIG = [
    { id: PERMISSIONS.DASHBOARD, label: 'Dashboard' },
    { id: PERMISSIONS.REPORTS, label: 'Reportes' },
    { id: PERMISSIONS.MANAGEMENT, label: 'Gestión' },
    { id: PERMISSIONS.ASSISTANT, label: 'Asistente IA' },
    { id: PERMISSIONS.SETTINGS, label: 'Configuración' },
];