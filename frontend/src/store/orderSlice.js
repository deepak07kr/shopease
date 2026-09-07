import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { orderApi } from '../api/orderApi';

const initialState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
};

export const fetchMyOrders = createAsyncThunk(
  'order/fetchMyOrders',
  async (_, { rejectWithValue }) => {
    try {
      return await orderApi.getMyOrders();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch order history');
    }
  }
);

export const checkoutCart = createAsyncThunk(
  'order/checkoutCart',
  async (orderData, { rejectWithValue }) => {
    try {
      return await orderApi.checkout(orderData);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Checkout failed');
    }
  }
);

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    clearOrderState: (state) => {
      state.currentOrder = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload || [];
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(checkoutCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkoutCart.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(checkoutCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentOrder, clearOrderState } = orderSlice.actions;
export default orderSlice.reducer;
