import type { FormInput } from '../layout/DynamicForm';


export interface CrudConfig {
  entity: string;
  
  title: string;
 
  columns: any;
 
  searchFields: string[];
 
  formInputs: FormInput[];
}
