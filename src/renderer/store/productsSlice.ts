import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getAllProducts } from '../api/db'

export interface ProductsState {
  items: any[]
  loading: boolean
  error: boolean
}

const initialState: ProductsState = {
  items: [],
  loading: false,
  error: false,
}

export const fetchProducts = createAsyncThunk('products/fetch', async () => {
  const data = await getAllProducts()
  return data
})

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchProducts.pending, state => {
        state.loading = true
        state.error = false
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchProducts.rejected, state => {
        state.loading = false
        state.error = true
      })
  },
})

export default productsSlice.reducer
