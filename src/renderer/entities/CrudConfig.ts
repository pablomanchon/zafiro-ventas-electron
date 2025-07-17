// src/entities/CrudConfig.ts
import type { FormInput } from '../layout/DynamicForm';

/**
 * Configuración para páginas CRUD genéricas.
 */
export interface CrudConfig {
  /** Nombre de la entidad (ruta API) */
  entity: string;
  /** Título a mostrar en la página */
  title: string;
  /** Encabezados de columna para la tabla */
  columns: string[];
  /** Definición de los inputs del formulario */
  formInputs: FormInput[];
  /** Campos para búsqueda dentro de cada ítem */
  searchFields: string[];
}
