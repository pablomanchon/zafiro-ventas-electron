// src/store/movimientoStockSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getAll } from '../api/crud'
// 👆 cambia el nombre de la función si en tu db.ts se llama distinto

export interface MovimientoStockState {
  items: any[]
  loading: boolean
  error: boolean
}

const initialState: MovimientoStockState = {
  items: [],
  loading: false,
  error: false,
}

export const fetchMovimientosStock = createAsyncThunk(
  'movimientoStock/fetch',
  async () => {
    const data = await getAll('movimiento-stock')
    return data
  }
)

const movimientoStockSlice = createSlice({
  name: 'movimientoStock',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchMovimientosStock.pending, state => {
        state.loading = true
        state.error = false
      })
      .addCase(fetchMovimientosStock.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchMovimientosStock.rejected, state => {
        state.loading = false
        state.error = true
      })
  },
})

export default movimientoStockSlice.reducer
