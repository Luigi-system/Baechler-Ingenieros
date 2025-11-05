

import { GoogleGenAI } from '@google/genai';

export enum UserRole {
  ADMIN = 'Administrador',
  MANAGER = 'Gerente',
  TECHNICIAN = 'Técnico',
  CLIENT = 'Cliente',
}

export interface User {
  id: string;
  nombres: string;
  usuario: string; // Changed from email
  email?: string; // Kept as optional for other uses if needed
  rol: number;
  roleName: string;
  permissions: string[];
  dni?: number;
  celular?: number;
  app_title?: string;
  logo_url?: string;
  color_palette_name?: string;
  pass?: number | null; // Changed from password and type to number | null
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
  fotos_problemas_encontrados_url?: string[];
  fotos_acciones_realizadas_url?: string[];
  fotos_observaciones_url?: string[];
  foto_firma_url?: string;
  
  // For passing base64 to PDF generator
  fotosProblemasBase64?: string[];
  fotosAccionesBase64?: string[];
  fotosObservacionesBase64?: string[];
  fotoFirmaBase64?: string;
  
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
  fecha?: string; // YYYY-MM-DD
  hora_ingreso?: string; // HH:MM
  hora_salida?: string; // HH:MM

  // Client/Location Info (denormalized in DB)
  empresa?: string;
  cliente?: string; // Per schema, will populate with same as empresa
  planta?: string;

  // Contact Info (denormalized in DB)
  nombre_encargado?: string;
  celular_encargado?: string;
  email_encargado?: string;
  nombre_operador?: string;
  celular_operador?: string;

  // Technical Checklist
  voltaje_establecido?: boolean;
  presurizacion?: boolean;
  transformador?: boolean;
  
  // Machine Info
  maquinas?: string[]; // Stored as text[] in DB

  // Details
  sugerencias?: string;

  // Files - these store URLs in DB in schema, but we'll handle File objects
  foto_observaciones?: string;
  foto_sugerencias?: string;
  firma?: string;
  
  // For passing base64 to PDF generator
  fotosObservacionesBase64?: string[];
  fotosSugerenciasBase64?: string[];
  fotoFirmaBase64?: string;
  
  // Meta
  id_usuario?: string;
  url_pdf?: string;

  // --- For form state management & PDF generation ---
  // Store IDs from dropdowns to manage state
  form_id_empresa?: number;
  form_id_planta?: number;
  form_id_encargado?: number;
  // Hold full objects for PDF
  usuario?: { nombres: string } | null;
  selected_empresa_pdf?: Company | null;
  selected_planta_pdf?: Plant | null;
  selected_encargado_pdf?: Supervisor | null;
  selected_maquinas_pdf?: {
    machineLabel: string;
    observations: string;
  }[];
}


export type ThemeMode = 'light' | 'dark';

interface ColorSet {
  primary: string;
  'primary-focus': string; // Darker shade for hover/active
  'primary-light': string;
  'primary-lighter': string;
  secondary: string;
  accent: string;
  neutral: string;
  'base-100': string; // Main background
  'base-200': string; // Cards, modals
  'base-300': string; // Hover, subtle backgrounds
  'base-content': string; // Main text color
  'base-border': string;
  info: string;
  success: string;
  warning: string;
  error: string;
}

export interface ColorPalette {
  name: string;
  category: string;
  light: ColorSet;
  dark: ColorSet;
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
    dni?: string;
    nacimiento?: string; // date as string
    email?: string;
    celular?: number;
    cargo?: string;
    nombreEmpresa?: string;
    nombrePlanta?: string;
}

// Types for AI Assistant
export interface TableData {
  headers: string[];
  rows: (string | number | null)[][];
}

export interface ChartData {
  type: 'bar' | 'pie';
  data: { name: string; value: number }[];
}

export interface Action {
  label: string;
  prompt: string;
  style?: 'primary' | 'secondary' | 'danger' | 'ghost'; // Added 'ghost' style
  api?: string; // New: For N8N button's API call
  method?: string; // New: For N8N button's API method
}

// Updated FormField to reflect UI_SCHEMA_RULES
export interface FormField {
    type: 'text' | 'select' | 'checkbox' | 'hidden' | 'file_upload' | 'field' | 'combobox'; // Expanded types
    name: string; // Required for form fields
    label: string;
    inputType?: string; // For type 'field'
    options?: string[]; // For type 'select' or 'combobox' (e.g., "value: Label")
    placeholder?: string;
    value?: any; // Consolidate initialValue and value, use 'value'
    checked?: boolean; // For checkbox
    mimeType?: string; // For file_upload
    selected?: string; // For combobox initial selection (the 'value' part of options)
}

export interface ImageViewer {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  clickAction?: string;
}

export interface FileViewer {
  src: string;
  fileName: string;
  mimeType: string;
  downloadable?: boolean;
}

export interface VideoPlayer {
  src: string;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
}

export interface AudioPlayer {
  src: string;
  controls?: boolean;
  autoplay?: boolean;
  loop?: boolean;
}

export interface ColumnDefinition {
  header: string;
  accessor: string; // Key in your data object
}

export interface TableComponentData {
  columns: ColumnDefinition[];
  data: Record<string, any>[]; // Array of objects, each representing a row
  pagination?: boolean;
  actions?: Action[]; // Actions specific to table rows, if any
}

export interface RecordViewData {
  fields: { label: string; value: any; }[]; // Array of key-value pairs to display
  editable?: boolean;
}

export interface ConfirmationMessage {
  title: string;
  message: string;
  icon: 'success' | 'error' | 'info' | 'warning';
}

export interface AIResponse {
  displayText?: string; // Made optional as other components can be the primary content
  table?: TableData; // Existing table format
  chart?: ChartData;
  actions?: Action[];
  form?: FormField[];
  suggestions?: string[];
  statusDisplay?: ConfirmationMessage; // New field for prominent status messages

  // New components based on UI_SCHEMA_RULES
  imageViewer?: ImageViewer;
  fileViewer?: FileViewer;
  videoPlayer?: VideoPlayer;
  audioPlayer?: AudioPlayer;
  tableComponent?: TableComponentData; // New table format
  recordView?: RecordViewData;
  list?: { title?: string; items: any[]; itemTemplate?: Record<string, any> }; // List with basic rendering, items can be any[]
}

// FIX: Moved OpenAiClient interface definition here from AiServiceContext.tsx
// Define a simple type for our custom fetch-based OpenAI client
export interface OpenAiClient {
    chat: {
        completions: {
            create: (payload: any) => Promise<any>;
        >;
    };
}

// Modified AiService type to include 'n8n'
export type AiService = 'gemini' | 'openai' | 'n8n';

export interface AiApiKeys {
    gemini?: string;
    openai?: string;
}

export interface N8nSettings {
    webhookUrl: string;
    method: 'GET' | 'POST';
    headers: Record<string, string>;
}

// Updated AiServiceContextType to include n8n settings
export interface AiServiceContextType {
    service: AiService; // For main chat/agent
    setService: (service: AiService) => void;
    isChatServiceConfigured: () => boolean; // Specific check for chat service
    
    autocompleteService: 'gemini' | 'openai'; // For file analysis autocompletion
    setAutocompleteService: (service: 'gemini' | 'openai') => void;
    isAutocompleteServiceConfigured: () => boolean; // Specific check for autocomplete service

    geminiClient: GoogleGenAI | null;
    openaiClient: OpenAiClient | null;
    apiKeys: AiApiKeys; // Combined API keys for all services
    
    n8nSettings: N8nSettings; // Replaces n8nWebhookUrl
    
    updateApiKeys: (keys: AiApiKeys) => Promise<{error: Error | null}>;
    updateN8nSettings: (settings: Partial<N8nSettings>) => Promise<{error: Error | null}>; // Replaces updateN8nWebhookUrl
}
