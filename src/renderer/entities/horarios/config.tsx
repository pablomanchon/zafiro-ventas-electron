import type { CrudConfig } from '../CrudConfig';

const horariosConfig: CrudConfig = {
  entity: 'horarios',
  title: 'Horarios',
  columns: [
    { titulo: 'ID', clave: 'vendedor.id' },
    { titulo: 'Vendedor', clave: 'vendedor.nombre' },
    { titulo: 'Hora Ingreso', clave: 'horaIngreso' },
    { titulo: 'Hora Egreso', clave: 'horaEgreso' },
    { titulo: 'Estado', clave: 'estado' },
  ],
  searchFields: ['vendedor.id', 'vendedor.nombre', 'horaIngreso', 'horaEgreso'],
  formInputs: [],
};

export default horariosConfig;
