export type CompanyType = "CA" | "SRL" | "FP" | "PYME";
export type CompanyStatus = "draft" | "wizard" | "constitucion" | "post" | "activa";

export interface Socio {
  id?: string;
  nombre: string;
  cedula: string;
  porcentaje: number;
  cargo: string;
}

export interface JuntaDirectiva {
  presidente: string;
  vicepresidente: string;
  tesorero: string;
  comisario: string;
}

export interface Company {
  id: string;
  user_id: string;
  name: string;
  type: CompanyType;
  status: CompanyStatus;
  domicilio: string;
  objeto_social: string;
  capital_social: number;
  ejercicio_fiscal: string;
  tipo_negocio: string;
  num_socios: string;
  es_extranjero: boolean;
  current_step: number;
  wizard_data: Record<string, unknown>;
  created_at: string;
}

export interface Tarea {
  id: string;
  company_id: string;
  fase: number;
  nombre: string;
  descripcion: string;
  completada: boolean;
  completed_at: string | null;
  link: string | null;
  orden: number;
}

export type TipoNegocio =
  | "restaurante"
  | "bar_licoreria"
  | "tienda_retail"
  | "consultoria_servicios"
  | "tecnologia"
  | "salud"
  | "construccion"
  | "importacion"
  | "exportacion"
  | "educacion"
  | "otro";

export const TIPOS_NEGOCIO: { value: TipoNegocio; label: string; icon: string }[] = [
  { value: "restaurante", label: "Restaurante / Comida", icon: "🍽️" },
  { value: "bar_licoreria", label: "Bar / Licorería", icon: "🍹" },
  { value: "tienda_retail", label: "Tienda / Comercio", icon: "🛍️" },
  { value: "consultoria_servicios", label: "Consultoría / Servicios", icon: "💼" },
  { value: "tecnologia", label: "Tecnología / Software", icon: "💻" },
  { value: "salud", label: "Salud / Clínica", icon: "🏥" },
  { value: "construccion", label: "Construcción / Inmobiliaria", icon: "🏗️" },
  { value: "importacion", label: "Importación", icon: "📦" },
  { value: "exportacion", label: "Exportación", icon: "🚢" },
  { value: "educacion", label: "Educación / Academia", icon: "📚" },
  { value: "otro", label: "Otro", icon: "⚡" },
];

export const COMPANY_TYPE_INFO: Record<CompanyType, {
  nombre: string;
  descripcion: string;
  pros: string[];
  capital: string;
  socios: string;
}> = {
  FP: {
    nombre: "Firma Personal",
    descripcion: "Para un solo dueño. Más simple y rápido de constituir.",
    pros: ["Más fácil y rápido", "Sin capital mínimo alto", "Proceso simplificado"],
    capital: "Sin mínimo específico",
    socios: "Solo tú",
  },
  PYME: {
    nombre: "PYME",
    descripcion: "Pequeña o mediana empresa. Exoneración de aranceles SAREN.",
    pros: ["Sin aranceles SAREN", "Beneficios fiscales", "Acceso a financiamiento"],
    capital: "Máx. 400 petros",
    socios: "1-50 empleados",
  },
  SRL: {
    nombre: "Sociedad de Responsabilidad Limitada",
    descripcion: "Para 2 a 20 socios. Responsabilidad limitada al capital.",
    pros: ["Responsabilidad limitada", "Más flexible que CA", "Estructura clara"],
    capital: "$5,000 - $10,000",
    socios: "2 a 20",
  },
  CA: {
    nombre: "Compañía Anónima",
    descripcion: "Estructura corporativa completa. Ideal para negocios grandes.",
    pros: ["Mayor credibilidad", "Acepta inversión", "Ideal para escalar"],
    capital: "$15,000+",
    socios: "2 o más",
  },
};
