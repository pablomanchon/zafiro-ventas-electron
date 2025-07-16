import CrudPage from './CrudPage';

export default function PageClientes() {
  const config = {
    entity: 'clientes',
    title: 'Clientes',
    columns: ['id', 'nombre', 'apellido', 'email', 'telefono', 'direccion'],
    searchFields: ['nombre', 'apellido', 'email'],
    formInputs: [
      { name: 'nombre', label: 'Nombre', type: 'text', required: true },
      { name: 'apellido', label: 'Apellido', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'telefono', label: 'Teléfono', type: 'text' },
      { name: 'direccion', label: 'Dirección', type: 'text' },
    ],
  };

  return <CrudPage config={config} />;
}
