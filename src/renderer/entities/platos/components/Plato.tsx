import DangerBtn from '../../../components/DangerButton'
import PrimaryButton from '../../../components/PrimaryButton'
import Glass from '../../../layout/Glass'
import Wood from '../../../layout/Steel'
import Title from '../../../layout/Title'
import { formatARS } from '../../../utils/utils'
import type { CreatePlatoDto } from '../types'

type PlatoWithCost = CreatePlatoDto & {
  precioCosto?: number
  subplatos?: Array<{
    platoHijoId: string | number
    cantidadUsada: number
    platoHijo?: { nombre?: string; codigo?: string }
  }>
}

export default function Plato({
  p,
  onModify,
  onDelete,
}: {
  p: PlatoWithCost
  onModify(id: string | number): void
  onDelete(id: string | number): void
}) {
  return (
    <Wood className="rounded-3xl h-full">
      <div className="bg-black/60 p-6 rounded-3xl h-full flex flex-col gap-3">
        <Title>{p.codigo}</Title>
        <label className="flex gap-2">
          <h3 className="font-bold">Nombre:</h3>
          <p>{p.nombre}</p>
        </label>
        <label className="flex gap-2">
          <h3 className="font-bold">Precio Venta:</h3>
          <p>{formatARS(p.precio)}</p>
        </label>
        <label className="flex gap-2">
          <h3 className="font-bold">Precio Costo:</h3>
          <p>{formatARS(p.precioCosto ?? 0)}</p>
        </label>
        <label className="flex gap-2">
          <h3 className="font-bold">Stock:</h3>
          <p>{p.stock}</p>
        </label>
        {p.descripcion && (
          <label className="flex gap-2">
            <h3 className="font-bold">Descripcion:</h3>
            <p className="text-sm">{p.descripcion}</p>
          </label>
        )}
        <label className="flex gap-2 items-start">
          <h3 className="font-bold shrink-0">Ingredientes:</h3>
          <Glass className="flex-1">
            {p.ingredientes?.length ? (
              <ul className="text-sm list-disc ml-5">
                {p.ingredientes.map((i, index) => (
                  <li key={`${i.id ?? i.ingrediente?.nombre ?? 'ing'}-${index}`}>
                    {i.ingrediente.nombre}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-300">Sin ingredientes.</p>
            )}
          </Glass>
        </label>
        {!!p.subplatos?.length && (
          <label className="flex gap-2 items-start">
            <h3 className="font-bold shrink-0">Subplatos:</h3>
            <ul className="flex flex-col text-xs gap-1">
              {p.subplatos.map((sp, index) => (
                <li key={`${sp.platoHijoId}-${index}`}>
                  {sp.platoHijo?.nombre ?? sp.platoHijo?.codigo ?? sp.platoHijoId} x
                  {sp.cantidadUsada}
                </li>
              ))}
            </ul>
          </label>
        )}
        <div className="flex flex-wrap mt-auto justify-center gap-2">
          <PrimaryButton className="text-sm" title="Modificar" functionClick={() => onModify(p.id)} />
          <DangerBtn className="text-sm" title="Eliminar" functionClick={() => onDelete(p.id)} />
        </div>
      </div>
    </Wood>
  )
}
