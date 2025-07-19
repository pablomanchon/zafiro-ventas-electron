// src/layout/Table.jsx
import { useState } from "react";

const Table = ({
  encabezados,
  datos,
  onFilaSeleccionada,
  onDobleClickFila,
  formatoFecha = 'fecha-hora'
}) => {
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);

  const manejarSeleccion = (index) => {
    setFilaSeleccionada(index);
    onFilaSeleccionada?.(datos[index].id);
  };

  const manejarDobleClick = (index) => {
    onDobleClickFila?.(datos[index].id);
  };

  const formatearFecha = (valor) => {
    const fecha = new Date(valor);
    if (isNaN(fecha.getTime())) return valor;
    const opciones = {
      ...(formatoFecha.includes('fecha') && {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      ...(formatoFecha.includes('hora') && {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    return fecha.toLocaleString('es-AR', opciones);
  };

  const obtenerValor = (fila, encabezado) => {
    // Tomamos la clave original
    const claveOriginal = typeof encabezado === 'string'
      ? encabezado
      : encabezado.clave ?? '';
    if (!claveOriginal) return null;

    const keys = claveOriginal.split('.');
    let valor = fila;
    for (const key of keys) {
      if (valor == null) break;
      // Intento con clave exacta
      if (Object.prototype.hasOwnProperty.call(valor, key)) {
        valor = valor[key];
      } else {
        // Fallback: primera letra lowercase
        const keyLower = key.charAt(0).toLowerCase() + key.slice(1);
        if (Object.prototype.hasOwnProperty.call(valor, keyLower)) {
          valor = valor[keyLower];
        } else {
          valor = undefined;
        }
      }
    }
    // Formatear fecha si aplica
    if (keys[keys.length - 1].toLowerCase().includes('fecha')) {
      return formatearFecha(valor);
    }
    return valor;
  };

  const obtenerTitulo = (encabezado) =>
    typeof encabezado === 'string' ? encabezado : encabezado.titulo;

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
