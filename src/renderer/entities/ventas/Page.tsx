import DynamicForm from '../../layout/DynamicForm';
import type { FormInput } from '../../layout/DynamicForm';
import { create } from '../../api/crud';

export default function PageVentas() {
  const inputs: FormInput[] = [
    { name: 'clienteId', label: 'ID Cliente', type: 'number', required: true },
    { name: 'productoId', label: 'ID Producto', type: 'number', required: true },
    { name: 'cantidad', label: 'Cantidad', type: 'number', required: true },
    { name: 'metodoId', label: 'Método de Pago', type: 'number', required: true },
    { name: 'monto', label: 'Monto', type: 'number', required: true },
  ];

  return (
    <div className="p-2 flex flex-col gap-2">
      <h1 className="text-xl font-bold text-white">Crear Venta</h1>
      <DynamicForm
        inputs={inputs}
        onSubmit={async values => {
          const payload = {
            clienteId: values.clienteId,
            detalles: [
              {
                productoId: values.productoId,
                item: { cantidad: values.cantidad },
              },
            ],
            pagos: [
              {
                metodoId: values.metodoId,
                monto: values.monto,
              },
            ],
          };
          await create('ventas', payload);
        }}
        titleBtn="Crear Venta"
      />
    </div>
  );
}
