import Glass from "../../layout/Glass";
import Steel from "../../layout/Steel";
import "../../App.css";
import Title from "../../layout/Title";
import SecondaryBtn from "../../components/SecondaryButton";
import DangerBtn from "../../components/DangerButton";
import { aumentarSaldo, disminuirSaldo } from "../../api/db";
import { useState } from "react";
import { useModal } from "../../providers/ModalProvider";
import { toast } from "react-toastify";

type Moneda = "pesos" | "usd";

export default function MoneyMove({ moveType, handleEndMove }: { moveType: "in" | "out", handleEndMove: (moveType: 'in' | 'out') => void }) {
    const [monto, setMonto] = useState<string>("");
    const [moneda, setMoneda] = useState<Moneda>("pesos");
    const [loading, setLoading] = useState(false);
    const { closeModal } = useModal()

    const montoNumber = (() => {
        if (monto.trim() === "") return NaN;
        const normalized = monto.replace(",", ".");
        return Number(normalized);
    })();

    const disabled = loading || isNaN(montoNumber) || montoNumber <= 0;

    const handleSubmit = async () => {
        if (disabled) return;
        try {
            setLoading(true);
            if (moveType === "in") {
                await aumentarSaldo(moneda, Number(montoNumber.toFixed(2)));
            } else {
                await disminuirSaldo(moneda, Number(montoNumber.toFixed(2)));
            }
            closeModal();
            handleEndMove(moveType);
        } catch (err: any) {
            toast.error("Error al guardar el movimiento", err.response.data.message)
            alert(err?.response?.data?.message ?? err?.message ?? "Error al guardar el movimiento");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Steel className="p-6">
            <Glass className="shadow-inner shadow-black text-white flex flex-col gap-3">
                <Title className="mb-2">
                    {moveType === "in" ? "Ingreso" : "Egreso"} de Dinero
                </Title>

                <label className="flex flex-col gap-1">
                    Monto:
                    <input
                        className="no-spin text-black p-2 rounded outline-none border-black border shadow-inner shadow-black"
                        placeholder="Ingresá el monto (ej. 1234,56)"
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        value={monto}
                        onChange={(e) => setMonto(e.target.value)}
                        onKeyDown={(e) => {
                            if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleSubmit(); // ✅ Enviar al presionar Enter
                            }
                        }}
                    />
                </label>

                <label className="flex items-center gap-2">
                    Moneda:
                    <select
                        className="text-black ml-2 outline-none p-2 rounded shadow-inner shadow-black border border-black"
                        value={moneda}
                        onChange={(e) => setMoneda(e.target.value as Moneda)}
                    >
                        <option value="pesos">Pesos</option>
                        <option value="usd">USD</option>
                    </select>
                </label>

                {moveType === "in" ? (
                    <SecondaryBtn
                        functionClick={handleSubmit}
                        disabled={disabled}
                        title={loading ? "Guardando..." : "Ingresar dinero"}
                    />
                ) : (
                    <DangerBtn
                        functionClick={handleSubmit}
                        disabled={disabled}
                        title={loading ? "Guardando..." : "Retirar dinero"}
                    />
                )}
            </Glass>
        </Steel>
    );
}
