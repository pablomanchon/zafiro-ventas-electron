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
