import { configureStore } from '@reduxjs/toolkit'
import productsReducer from './productsSlice'
import salesReducer from './salesReduce'

export const store = configureStore({
  reducer: {
    products: productsReducer,
    sales: salesReducer
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
