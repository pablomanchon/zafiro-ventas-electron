import type { CrudConfig } from '../CrudConfig';

const clientesConfig: CrudConfig = {
  entity: 'clientes',
  title: 'Clientes',
  columns: ['id', 'nombre', 'apellido', 'dni', 'email', 'telefono', 'direccion', 'estrellas'],
  searchFields: ['id', 'nombre', 'apellido', 'email', 'dni'],
  formInputs: [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'apellido', label: 'Apellido', type: 'text' },
    { name: 'dni', label: 'DNI', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'telefono', label: 'Teléfono', type: 'text' },
    { name: 'direccion', label: 'Dirección', type: 'text' },
  ],
};

export default clientesConfig;
