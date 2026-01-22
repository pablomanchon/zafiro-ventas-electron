import type { CrudConfig } from '../CrudConfig';

const horariosConfig: CrudConfig = {
  entity: 'clientes',
  title: 'Clientes',
  columns: ['id', 'nombre Completo', 'apellido', 'email', 'telefono', 'direccion'],
  searchFields: ['id', 'nombre', 'apellido', 'email'],
  formInputs: [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'apellido', label: 'Apellido', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'telefono', label: 'Teléfono', type: 'text' },
    { name: 'direccion', label: 'Dirección', type: 'text' },
  ],
};

export default horariosConfig;
