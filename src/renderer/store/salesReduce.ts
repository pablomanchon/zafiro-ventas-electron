// src/store/sales/sales.slice.ts

import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getAll } from "../api/crud";

export type TotalPorTipo = { tipo: string; total: number }
export type DateRange = { from?: string; to?: string } | null

type SalesState = {
  ventas: any[]
  totales: TotalPorTipo[]
  loading: boolean
  error: string | null
  lastRange: DateRange
}

const initialState: SalesState = {
  ventas: [],
  totales: [],
  loading: false,
  error: null,
  lastRange: null,
}

// Un solo thunk que trae ventas y totales en paralelo
export const fetchSales = createAsyncThunk(
  'sales/fetchSales',
  async (range: DateRange, { rejectWithValue }) => {
    try {
      const [ventasRes, totalesRes] = await Promise.all([
        getAll('ventas', range ?? undefined),
        getAll('ventas/totales/tipos', range ?? undefined),
      ])
      return {
        ventas: ventasRes ?? [],
        totales: totalesRes ?? [],
        range,
      }
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Error cargando ventas')
    }
  }
)

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    clearSales(state) {
      state.ventas = []
      state.totales = []
      state.error = null
      state.loading = false
      state.lastRange = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSales.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSales.fulfilled, (state, action: PayloadAction<{ ventas: any[]; totales: TotalPorTipo[]; range: DateRange }>) => {
        state.ventas = action.payload.ventas
        state.totales = action.payload.totales
        state.lastRange = action.payload.range
        state.loading = false
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) ?? 'Error cargando ventas'
      })
  },
})

export const { clearSales } = salesSlice.actions
export default salesSlice.reducer

// Selectors
export const selectVentas = (s: any) => s.sales.ventas as any[]
export const selectTotales = (s: any) => s.sales.totales as TotalPorTipo[]
export const selectLoading = (s: any) => s.sales.loading as boolean
export const selectError = (s: any) => s.sales.error as string | null
export const selectLastRange = (s: any) => s.sales.lastRange as DateRange
export const selectTotalGeneral = (s: any) =>
  (s.sales.totales as TotalPorTipo[]).reduce((acc, t) => acc + Number(t.total ?? 0), 0)
