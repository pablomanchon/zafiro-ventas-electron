import type { CrudConfig } from '../CrudConfig';
import IngredientesListInput from './components/IngredientesListInput';
import SubplatosListInput from './components/SubplatosListInput';

const platosConfig: CrudConfig = {
  entity: 'platos',
  title: 'Platos',
  columns: [
    { titulo: 'ID', clave: 'id' },
    { titulo: 'Nombre', clave: 'nombre' },
    { titulo: 'Precio venta', clave: 'precio', tipo: 'money' },
    { titulo: 'Costo', clave: 'precioCosto', tipo: 'money' },
    { titulo: 'Stock', clave: 'stock' },
    { titulo: 'Ingredientes', clave: 'ingredientes.length' },
    { titulo: 'Subplatos', clave: 'subplatos.length' },
  ],
  searchFields: ['id', 'nombre', 'descripcion'],
  formInputs: [
    { name: 'id', label: 'ID', type: 'text', required: true },
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea' },
    { name: 'precio', label: 'Precio de venta', type: 'number', required: true },
    { name: 'stock', label: 'Stock', type: 'number', required: true },
    {
      name: 'ingredientes',
      label: 'Ingredientes',
      type: 'component',
      Component: IngredientesListInput,
      required:true,
      value: [],
    },
    {
      name: 'subplatos',
      label: 'Subplatos (opcional)',
      type: 'component',
      Component: SubplatosListInput,
      value: [],
    },
  ],
};

export default platosConfig;
