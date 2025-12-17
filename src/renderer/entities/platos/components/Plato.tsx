import DangerBtn from "../../../components/DangerButton";
import PrimaryButton from "../../../components/PrimaryButton";
import Glass from "../../../layout/Glass";
import Wood from "../../../layout/Steel";
import Title from "../../../layout/Title";
import { formatARS } from "../../../utils/utils";
import type { CreatePlatoDto } from "../types";

export default function Plato({ p, onModify, onDelete }: { p: CreatePlatoDto, onModify(id: string): void, onDelete(id: string): void }) {

    return (
        <Wood className="rounded-full">
            <div className="bg-black/60 p-10 rounded-full">
                <Title>{p.id}</Title>
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
                    <p>{formatARS(p.precio)}</p>
                </label>
                <label className="flex gap-2">
                    <h3 className="font-bold">Stock:</h3>
                    <p>{p.stock}</p>
                </label>
                {p.descripcion &&
                    <label className="flex gap-2">
                        <h3 className="font-bold">Descripcion:</h3>
                        <p className="text-sm text-center">{p.descripcion}</p>
                    </label>
                }
                <label className="flex gap-2">
                    <h3 className="font-bold">Ingredientes:</h3>
                    <Glass>
                        <ul className="text-sm list-disc ml-5">{p.ingredientes?.map(i => <li>{i.ingrediente.nombre}</li>)}</ul>
                    </Glass>
                </label>
                {p.subplatos?.length != 0 &&
                    <label className="flex gap-2 font-bold">SubPlatos:
                        <ul className="flex flex-wrap text-xs">{p.subplatos?.map(sp => <li>{sp.platoHijoId}</li>)}</ul>
                    </label>
                }
                <div className="flex flex-wrap mt-5 justify-center gap-2">
                    <PrimaryButton className="text-sm" title="Modificar" functionClick={() => onModify(p.id!)} />
                    <DangerBtn className="text-sm" title="Eliminar" functionClick={() => onDelete(p.id!)} />
                </div>
            </div>
        </Wood>
    )
}
