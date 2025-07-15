import axios from "axios"

export const getAllProducts = async () => {
    try {
        const respuesta = await axios.get("http://localhost:3000/api/productos")
        return respuesta.data;
    } catch (error) {
        console.log(error)
        throw error;
    }
}

export const getAllLotes = async () => {
    try {
        const res = await axios.get("http://localhost:3000/api/lote")
        return res.data;
    } catch (error) {
        console.log(error)
        throw error;
    }
}