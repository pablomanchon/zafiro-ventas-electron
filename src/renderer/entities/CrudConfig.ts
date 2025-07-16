export interface CrudConfig {
  entity: string;
  title: string;
  columns: (string | { titulo: string; clave: string })[];
  searchFields: string[];
  formInputs: any[];
}
