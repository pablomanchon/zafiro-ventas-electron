import type { CrudConfig } from '../CrudConfig';

const ingredientesConfig: CrudConfig = {
  entity: 'ingredientes',
  title: 'Ingredientes',
  columns: [
    { titulo: 'Nombre', clave: 'nombre' },
    { titulo: 'Unidad base', clave: 'unidadBase' },
    { titulo: 'Cantidad base', clave: 'cantidadBase' },
    { titulo: 'Costo base', clave: 'precioCostoBase', tipo: 'money' },
  ],
  searchFields: ['id', 'nombre', 'unidadBase'],
  formInputs: [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    {
      name: 'unidadBase',
      label: 'Unidad base',
      type: 'select',
      required: true,
      options: [
        { label: '-', value: '-' },
        { label: 'Unidad', value: 'UNIDAD' },
        { label: 'Gramos', value: 'GRAMOS' },
        { label: 'Mililitros', value: 'MILILITROS' },
      ],
    },
    { name: 'cantidadBase', label: 'Cantidad base', type: 'number', required: true },
    { name: 'precioCostoBase', label: 'Costo base', type: 'number', required: true },
  ],
};

export default ingredientesConfig;
