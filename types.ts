export enum UserRole {
  ADMIN = 'Administrador',
  MANAGER = 'Gerente',
  TECHNICIAN = 'Técnico',
  CLIENT = 'Cliente',
}

export interface User {
  id: string;
  nombres: string;
  email: string;
  rol: number;
  roleName: string;
  permissions: string[];
  dni?: number;
  celular?: number;
  app_title?: string;
  logo_url?: string;
  color_palette_name?: string;
}

export interface Report {
  id: number;
  created_at: string;
  codigo_reporte: string;
  fecha: string;
  empresa: { nombre: string } | null;
  usuario: { nombres: string } | null;
  // FIX: Replaced 'estado_facturacion' with boolean fields to match the DB schema.
  facturado: boolean | null;
  no_facturado: boolean | null;
  estado: boolean | null;
}


// Added new ServiceReport type for the detailed form
export interface ServiceReport {
  id?: number;
  created_at?: string;
  codigo_reporte?: string;
  fecha?: string; // YYYY-MM-DD
  entrada?: string; // HH:MM
  salida?: string; // HH:MM
  
  // Linked IDs
  id_empresa?: number;
  id_planta?: number;
  nombre_planta?: string; // From DB schema
  id_encargado?: number;
  
  // Denormalized machine data for the report
  serie_maquina?: string;
  modelo_maquina?: string;
  marca_maquina?: string;
  linea_maquina?: string;
  
  // Service Details
  problemas_encontrados?: string;
  acciones_realizadas?: string;
  observaciones?: string;

  // Statuses
  estado_maquina?: 'operativo' | 'inoperativo' | 'en_prueba';
  estado_garantia?: 'con_garantia' | 'sin_garantia';
  estado_facturacion?: 'facturado' | 'no_facturado'; // Used for form state only
  
  // Boolean fields from DB schema for persistence.
  facturado?: boolean;
  no_facturado?: boolean;
  con_garantia?: boolean;
  sin_garantia?: boolean;
  operativo?: boolean;
  inoperativo?: boolean;
  en_prueba?: boolean;
  estado?: boolean;

  // Files - will handle URLs from storage
  fotos_problemas_encontrados?: string[];
  fotos_acciones_realizadas?: string[];
  fotos_observaciones?: string[];
  foto_firma?: string;
  
  // Sign-off (maps to nombre_usuario, celular_usuario in db)
  nombre_firmante?: string; 
  celular_firmante?: string;
  
  // Meta
  id_usuario?: string; // The user creating the report
  url_pdf?: string;

  // Joined data properties for PDF generation.
  // These should be populated by a specific query.
  usuario?: { nombres: string } | null;
  empresa?: Company | null;
  encargado?: Supervisor | null;
}

export interface VisitReport {
  id?: number;
  created_at?: string;
  codigo_reporte?: string;
  fecha?: string; // YYYY-MM-DD

  // Linked IDs
  id_empresa?: number;
  id_planta?: number;
  id_encargado?: number;

  // Visit Details
  motivo_visita?: string;
  temas_tratados?: string;
  acuerdos?: string;
  pendientes?: string;
  observaciones?: string;

  // Sign-off
  nombre_firmante?: string;
  foto_firma?: string;

  // Meta
  id_usuario?: string;
  url_pdf?: string;

  // Joined data for PDF
  usuario?: { nombres: string } | null;
  empresa?: Company | null;
  encargado?: Supervisor | null;
  planta?: { nombre: string } | null;
}


export type ThemeMode = 'light' | 'dark';

export interface ColorPalette {
  name: string;
  category: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    'base-100': string;
    // FIX: Added missing 'neutral' color property to match theme definitions.
    neutral: string;
  };
}

export interface Role {
    id: number;
    created_at?: string;
    nombre: string;
}

export interface Company {
    id: number;
    created_at?: string;
    nombre: string;
    direccion?: string;
    distrito?: string;
    ruc?: string;
}

// FIX: Added missing type definitions for Plant, Machine, and Supervisor.
export interface Plant {
    id: number;
    created_at?: string;
    nombre: string;
    direccion?: string;
    estado: boolean;
    id_empresa: number;
    empresa_nombre?: string;
}

export interface Machine {
    id: number;
    created_at?: string;
    serie: string;
    modelo?: string;
    marca?: string;
    linea?: string;
    estado: boolean;
    id_planta: number;
    planta_nombre?: string;
    id_empresa: number;
    empresa_nombre?: string;
}

export interface Supervisor {
    id: number;
    created_at?: string;
    nombre: string;
    apellido?: string;
    email?: string;
    celular?: number;
    id_planta: number;
    planta_nombre?: string;
    id_empresa: number;
    empresa_nombre?: string;
}