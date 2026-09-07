import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartApi } from '../api/cartApi';

const GUEST_CART_KEY = 'guestCart';

const readGuestCart = () => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeGuestCart = (items) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

const computeTotals = (items) => ({
  cartTotal: items.reduce((sum, i) => sum + i.productPrice * i.quantity, 0),
  totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
});

/**
 * Guest cart items live entirely in localStorage (via GUEST_CART_KEY) and use
 * the productId itself as `id`, so the Cart UI can treat guest and
 * server-backed cart items identically. Once the guest logs in or registers,
 * getGuestCartItems() below is sent to POST /api/cart/merge and the guest
 * cart is cleared - see authSlice's loginUser/registerUser thunks.
 */
export const getGuestCartItems = () => readGuestCart();
export const clearGuestCartStorage = () => localStorage.removeItem(GUEST_CART_KEY);

const initialState = {
  items: [],
  cartTotal: 0,
  totalQuantity: 0,
  loading: false,
  error: null,
};

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { getState, rejectWithValue }) => {
    const { isAuthenticated } = getState().auth;
    if (!isAuthenticated) {
      const items = readGuestCart();
      return { items, ...computeTotals(items) };
    }
    try {
      return await cartApi.getCart();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch cart');
    }
  }
);

export const addToCartThunk = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity, product }, { getState, rejectWithValue }) => {
    const { isAuthenticated } = getState().auth;

    if (!isAuthenticated) {
      const items = readGuestCart();
      const existing = items.find((i) => i.productId === productId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        items.push({
          id: productId,
          productId,
          productName: product?.name,
          productPrice: product?.price ?? 0,
          productImage: product?.imageUrl,
          quantity,
        });
      }
      writeGuestCart(items);
      return { items, ...computeTotals(items) };
    }

    try {
      return await cartApi.addToCart(productId, quantity);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add item to cart');
    }
  }
);

export const updateCartQuantityThunk = createAsyncThunk(
  'cart/updateQuantity',
  async ({ cartItemId, quantity }, { getState, rejectWithValue }) => {
    const { isAuthenticated } = getState().auth;

    if (!isAuthenticated) {
      let items = readGuestCart();
      if (quantity <= 0) {
        items = items.filter((i) => i.id !== cartItemId);
      } else {
        items = items.map((i) => (i.id === cartItemId ? { ...i, quantity } : i));
      }
      writeGuestCart(items);
      return { items, ...computeTotals(items) };
    }

    try {
      return await cartApi.updateQuantity(cartItemId, quantity);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update quantity');
    }
  }
);

export const removeFromCartThunk = createAsyncThunk(
  'cart/removeFromCart',
  async (cartItemId, { getState, rejectWithValue }) => {
    const { isAuthenticated } = getState().auth;

    if (!isAuthenticated) {
      const items = readGuestCart().filter((i) => i.id !== cartItemId);
      writeGuestCart(items);
      return { items, ...computeTotals(items) };
    }

    try {
      return await cartApi.removeFromCart(cartItemId);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove item');
    }
  }
);

export const clearCartThunk = createAsyncThunk(
  'cart/clearCart',
  async (_, { getState, rejectWithValue }) => {
    const { isAuthenticated } = getState().auth;

    if (!isAuthenticated) {
      clearGuestCartStorage();
      return { items: [], cartTotal: 0, totalQuantity: 0 };
    }

    try {
      await cartApi.clearCart();
      return { items: [], cartTotal: 0, totalQuantity: 0 };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to clear cart');
    }
  }
);

/** Merges whatever is in the guest cart into the now-authenticated user's server cart. */
export const mergeGuestCartThunk = createAsyncThunk(
  'cart/mergeGuestCart',
  async (_, { rejectWithValue }) => {
    const guestItems = readGuestCart();
    if (guestItems.length === 0) {
      try {
        return await cartApi.getCart();
      } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch cart');
      }
    }
    try {
      const merged = await cartApi.mergeCart(
        guestItems.map((i) => ({ productId: i.productId, quantity: i.quantity }))
      );
      clearGuestCartStorage();
      return merged;
    } catch (err) {
      // Non-fatal: fall back to fetching whatever is already on the server
      // rather than blocking login/registration on a cart-merge failure.
      clearGuestCartStorage();
      try {
        return await cartApi.getCart();
      } catch {
        return rejectWithValue(err.response?.data?.message || 'Failed to merge cart');
      }
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    resetCart: (state) => {
      state.items = [];
      state.cartTotal = 0;
      state.totalQuantity = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const handleFulfilled = (state, action) => {
      state.loading = false;
      state.items = action.payload.items || [];
      state.cartTotal = action.payload.cartTotal || 0;
      state.totalQuantity = action.payload.totalQuantity || 0;
    };

    builder
      .addCase(fetchCart.pending, (state) => { state.loading = true; })
      .addCase(fetchCart.fulfilled, handleFulfilled)
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(addToCartThunk.fulfilled, handleFulfilled)
      .addCase(updateCartQuantityThunk.fulfilled, handleFulfilled)
      .addCase(removeFromCartThunk.fulfilled, handleFulfilled)
      .addCase(mergeGuestCartThunk.fulfilled, handleFulfilled)
      .addCase(clearCartThunk.fulfilled, (state) => {
        state.items = [];
        state.cartTotal = 0;
        state.totalQuantity = 0;
      });
  },
});

export const { resetCart } = cartSlice.actions;
export default cartSlice.reducer;
