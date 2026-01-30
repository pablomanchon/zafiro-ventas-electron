import axios from "axios"

export const baseUrl = "http://localhost:3000/api"

export const getAllProducts = async () => {
    try {
        const respuesta = await axios.get(`${baseUrl}/productos`)
        return respuesta.data;
    } catch (error) {
        console.log(error)
        throw error;
    }
}

export const getAllLotes = async () => {
    try {
        const res = await axios.get(`${baseUrl}/lote`)
        return res.data;
    } catch (error) {
        console.log(error)
        throw error;
    }
}

export const getAllSaldos = async () => {
    try {
        const res = await axios.get(`${baseUrl}/caja/saldos`)
        return res.data
    } catch (error) {
        console.log(error)
        throw error;
    }
}

export const aumentarSaldo = async (moneda: 'pesos' | 'usd', monto: number) => {
    try {
        await axios.post(`${baseUrl}/caja/ingresar`, { moneda, monto })
    } catch (error) {
        console.log(error)
        throw error;
    }
}
export const disminuirSaldo = async (moneda: 'pesos' | 'usd', monto: number) => {
    try {
        await axios.post(`${baseUrl}/caja/disminuir`, { moneda, monto })
    } catch (error) {
        console.log(error)
        throw error;
    }
}
export const getMoves = async () => {
    try {
        const res = await axios.get(`${baseUrl}/caja/moves`)
        return res.data
    } catch (error) {
        console.log(error)
        throw error;
    }
}

export const getSelledProductsByDate = async (from: string, to: string) => {
    try {
        const res = await axios.get(`${baseUrl}/ventas/reportes/productos-vendidos?from=${from}&to=${to}`)
        return res.data
    } catch (error) {
        console.log(error)
        throw error;
    }
}

export const getUser = async (id: string) => {
    try {
        const res = await axios.get(`${baseUrl}/users/${id}`)
        return res.data;
    } catch (error) {
        console.log(error)
        throw error;
    }
}

export type MetodoTotal = { tipo: string; total: number };

export async function getTotalesPorTipoPago(from?: string, to?: string): Promise<MetodoTotal[]> {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const res = await fetch(`${baseUrl}/ventas/totales/tipos?${params.toString()}`);
    if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));

    const rows = (await res.json()) as Array<{ tipo: string; total: string | number }>;
    return (rows ?? []).map(r => ({ tipo: r.tipo, total: Number(r.total) }));
}

