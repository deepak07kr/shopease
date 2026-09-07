import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productApi } from '../api/productApi';

const initialState = {
  products: [],
  categories: [],
  selectedCategory: null,
  searchQuery: '',
  minPrice: '',
  maxPrice: '',
  sortBy: 'id',
  sortDir: 'asc',
  page: 0,
  size: 8,
  totalPages: 0,
  totalElements: 0,
  loading: false,
  error: null,
};

export const fetchProducts = createAsyncThunk(
  'product/fetchProducts',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { product } = getState();
      const params = {
        search: product.searchQuery || undefined,
        categoryId: product.selectedCategory || undefined,
        minPrice: product.minPrice || undefined,
        maxPrice: product.maxPrice || undefined,
        page: product.page,
        size: product.size,
        sortBy: product.sortBy,
        sortDir: product.sortDir,
      };
      return await productApi.getProducts(params);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'product/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      return await productApi.getCategories();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.page = 0;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
      state.page = 0;
    },
    setPriceRange: (state, action) => {
      state.minPrice = action.payload.min;
      state.maxPrice = action.payload.max;
      state.page = 0;
    },
    setSort: (state, action) => {
      state.sortBy = action.payload.sortBy;
      state.sortDir = action.payload.sortDir;
      state.page = 0;
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
    resetFilters: (state) => {
      state.searchQuery = '';
      state.selectedCategory = null;
      state.minPrice = '';
      state.maxPrice = '';
      state.sortBy = 'id';
      state.sortDir = 'asc';
      state.page = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.content || [];
        state.totalPages = action.payload.totalPages || 0;
        state.totalElements = action.payload.totalElements || 0;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload || [];
      });
  },
});

export const {
  setSearchQuery,
  setSelectedCategory,
  setPriceRange,
  setSort,
  setPage,
  resetFilters,
} = productSlice.actions;

export default productSlice.reducer;
