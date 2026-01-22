import React, { useEffect, useRef, useState } from "react";
import { formatCurrencyARS, looksLikeMoneyKey } from "../utils/utils";
import { useModal } from "../providers/ModalProvider";

function isEditableTarget(t) {
  const el = t;
  if (!el) return false;
  if (el.closest?.('input, textarea, select, [contenteditable="true"], [role="textbox"]')) return true;
  // @ts-ignore
  if (el.isContentEditable) return true;
  return false;
}

const Table = ({
  encabezados,
  datos,
  onFilaSeleccionada,
  onDobleClickFila,
  formatoFecha = "fecha-hora",
}) => {
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const { isModalOpen } = useModal();

  // 👉 flag: si abrimos modal con Enter, tragamos el próximo keyup(Enter)
  const swallowNextEnterUpRef = useRef(false);

  const shift = (delta) => {
    setFilaSeleccionada((prev) => {
      const actual = prev == null ? -1 : prev;
      let next = actual + delta;

      if (datos.length === 0) return null;

      if (next < 0) next = 0;
      if (next > datos.length - 1) next = datos.length - 1;

      onFilaSeleccionada?.(datos[next]?.id);
      return next;
    });
  };

  const manejarSeleccion = (index) => {
    setFilaSeleccionada(index);
    onFilaSeleccionada?.(datos[index]?.id);
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (isModalOpen) return;                       // no hacer nada si hay modal
      if (isEditableTarget(e.target)) return;        // no interferir con inputs

      // navegación por flechas
      if (e.key === "ArrowUp") {
        e.preventDefault();
        shift(-1);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        shift(1);
        return;
      }

      if (e.key === "Enter" && filaSeleccionada != null) {
        // Abrimos modal con Enter desde la tabla
        e.preventDefault();
        e.stopPropagation();
        swallowNextEnterUpRef.current = true;        // 👈 tragamos el próximo keyup(Enter)
        onDobleClickFila?.(datos[filaSeleccionada]?.id);
      }
    };

    // Capturamos el keyup ANTES que llegue al nuevo modal/form
    const onKeyUpCapture = (e) => {
      if (swallowNextEnterUpRef.current && e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        swallowNextEnterUpRef.current = false;       // sólo una vez
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUpCapture, true); // << captura

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUpCapture, true);
    };
  }, [filaSeleccionada, datos, onDobleClickFila, isModalOpen]);

  const manejarDobleClick = (index) => {
    onDobleClickFila?.(datos[index]?.id);
  };

  const formatearFecha = (valor) => {
    const fecha = new Date(valor);
    if (isNaN(fecha.getTime())) return valor;
    const opciones = {
      ...(formatoFecha.includes("fecha") && {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      ...(formatoFecha.includes("hora") && {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    return fecha.toLocaleString("es-AR", opciones);
  };

  const obtenerValor = (fila, encabezado) => {
    const isObj = typeof encabezado === "object" && encabezado !== null;
    const claveOriginal = isObj ? (encabezado.clave ?? encabezado.key ?? "") : encabezado ?? "";
    if (!claveOriginal) return null;

    const keys = claveOriginal.split(".");
    let valor = fila;

    for (const key of keys) {
      if (valor == null) break;
      const lowerKey = key.toLowerCase();
      const actualKey = Object.keys(valor).find((k) => k.toLowerCase() === lowerKey);
      valor = actualKey != null ? valor[actualKey] : undefined;
    }

    const lastKey = keys[keys.length - 1] ?? "";

    if (React.isValidElement(valor)) return valor;

    const lk = lastKey.toLowerCase()

    const isDateTimeKey =
      lk.includes("fecha") ||
      lk.includes("hora") ||        // 👈 horaIngreso / horaEgreso
      lk.includes("ingreso") ||     // opcional
      lk.includes("egreso")         // opcional

    if (isDateTimeKey) {
      return formatearFecha(valor)
    }


    const isMoneyColumn =
      (isObj && (encabezado.tipo === "money" || encabezado.formato === "moneda")) ||
      looksLikeMoneyKey(lastKey);

    if (isMoneyColumn) {
      if (typeof valor === "number") return formatCurrencyARS(valor);
      if (typeof valor === "string") {
        const trimmed = valor.trim();
        if (/^-?\d+(?:[.,]\d+)?$/.test(trimmed)) {
          return formatCurrencyARS(trimmed.replace(",", "."));
        }
        return valor;
      }
      return valor;
    }

    return valor;
  };

  const obtenerTitulo = (encabezado) =>
    typeof encabezado === "string" ? encabezado : encabezado.titulo;

  return (
    <div className="w-full">
      <table className="w-full bg-sky-900 border-white text-white shadow-lg shadow-black">
        <thead className="border-white border-2">
          <tr>
            {encabezados.map((enc, idx) => (
              <th key={idx} className="border-white border-2 m-2 p-2">
                {obtenerTitulo(enc)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {datos.map((fila, index) => (
            <tr
              key={index}
              onClick={() => manejarSeleccion(index)}
              onDoubleClick={() => manejarDobleClick(index)}
              className={`cursor-pointer hover:bg-cyan-700 ${filaSeleccionada === index
                  ? "bg-cyan-600"
                  : index % 2 === 0
                    ? "bg-gray-950"
                    : "bg-gray-800"
                }`}
            >
              {encabezados.map((enc, i) => (
                <td key={i} className="px-2 border-x-2 text-center">
                  {obtenerValor(fila, enc)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
