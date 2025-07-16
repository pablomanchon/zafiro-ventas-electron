/* components/CrudForm.tsx */
import DynamicForm from '../layout/DynamicForm';
import type { FormInput } from '../layout/DynamicForm';

interface CrudFormProps {
  inputs: FormInput[];
  editing: any | null;
  onSubmit: (values: any) => void;
}

export default function CrudForm({ inputs, editing, onSubmit }: CrudFormProps) {
  const titleBtn = editing ? 'Actualizar' : 'Crear';
  return <DynamicForm inputs={inputs} onSubmit={onSubmit} titleBtn={titleBtn} />;
}
