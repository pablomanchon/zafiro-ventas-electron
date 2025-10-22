import React, { useEffect, useState } from "react";
import { formatCurrencyARS, looksLikeMoneyKey } from "../utils";

const Table = ({
  encabezados,
  datos,
  onFilaSeleccionada,
  onDobleClickFila,
  formatoFecha = "fecha-hora",
}) => {
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);

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
    const handler = (e) => {
      if (e.key === "ArrowUp") shift(-1);
      if (e.key === "ArrowDown") shift(1);
      if (e.key === "Enter" && filaSeleccionada != null) {
        onDobleClickFila?.(datos[filaSeleccionada]?.id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filaSeleccionada, datos, onDobleClickFila]);

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
    const isObj =
      typeof encabezado === "object" && encabezado !== null;
    const claveOriginal = isObj
      ? (encabezado.clave ?? encabezado.key ?? "")
      : encabezado ?? "";

    if (!claveOriginal) return null;

    const keys = claveOriginal.split(".");
    let valor = fila;

    for (const key of keys) {
      if (valor == null) break;
      const lowerKey = key.toLowerCase();
      const actualKey = Object.keys(valor).find(
        (k) => k.toLowerCase() === lowerKey
      );
      valor = actualKey != null ? valor[actualKey] : undefined;
    }

    const lastKey = keys[keys.length - 1] ?? "";

    // 👉 si es React element (inputs, botones, etc.), lo devolvemos tal cual
    if (React.isValidElement(valor)) return valor;

    // 1) Fecha
    if (lastKey.toLowerCase().includes("fecha")) {
      return formatearFecha(valor);
    }

    // 2) Dinero (explícito o por nombre de clave)
    const isMoneyColumn =
      (isObj &&
        (encabezado.tipo === "money" ||
          encabezado.formato === "moneda")) ||
      looksLikeMoneyKey(lastKey);

    if (isMoneyColumn) {
      // Solo auto-formateamos si es number o string numérica "pura"
      if (typeof valor === "number") return formatCurrencyARS(valor);
      if (typeof valor === "string") {
        const trimmed = valor.trim();
        // 1234 | 1234.56 | 1234,56
        if (/^-?\d+(?:[.,]\d+)?$/.test(trimmed)) {
          return formatCurrencyARS(trimmed.replace(",", "."));
        }
        // Si viene con símbolos ($, puntos separadores, texto), lo dejamos como está
        return valor;
      }
      return valor;
    }

    // 3) Valor por defecto
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
              className={`cursor-pointer hover:bg-cyan-700 ${
                filaSeleccionada === index
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
