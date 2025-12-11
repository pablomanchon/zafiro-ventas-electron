import { configureStore } from '@reduxjs/toolkit'
import productsReducer from './productsSlice'
import salesReducer from './salesReduce'
import movimientoStockReducer from './movimientoStockSlice'

export const store = configureStore({
  reducer: {
    products: productsReducer,
    sales: salesReducer,
    movimientoStock: movimientoStockReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
