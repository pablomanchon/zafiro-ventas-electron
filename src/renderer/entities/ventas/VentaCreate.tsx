import Main from '../../layout/Main'
import Title from '../../layout/Title'
import DynamicForm from '../../layout/DynamicForm'
import bgUrl from '../../assets/fondo-w.png'
import { useVentaCreate } from './useVentaCreate'

export default function VentaCreate() {
  const { formKey, submitting, inputsWithTotal, handleSubmit } = useVentaCreate()

  return (
    <Main
      style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      className="flex flex-col gap-4 md:mt-auto text-white"
    >
      <div className="flex items-center justify-between">
        <Title className="text-white pb-2">
          Crear Venta
        </Title>
      </div>

      <DynamicForm
        key={formKey}
        inputs={inputsWithTotal}
        onSubmit={handleSubmit}
        titleBtn={submitting ? 'Guardando...' : 'Guardar Venta'}
      />
    </Main>
  )
}
