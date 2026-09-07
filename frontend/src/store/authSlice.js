import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../api/authApi';
import { mergeGuestCartThunk } from './cartSlice';

const storedUser = localStorage.getItem('user');
const storedToken = localStorage.getItem('token');

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  isAuthenticated: !!storedToken,
  loading: false,
  error: null,
  // Set right after register/resend-otp so the Verify Account page knows who it's verifying.
  pendingVerification: null,
};

function persistSession(data) {
  localStorage.setItem('token', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.user));
}

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await authApi.register(userData);
      return { identifier: data.identifier, message: data.message, devOtp: data.devOtp };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const verifyAccount = createAsyncThunk(
  'auth/verifyAccount',
  async ({ identifier, otpCode }, { rejectWithValue }) => {
    try {
      const data = await authApi.verifyAccount(identifier, otpCode);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Verification failed');
    }
  }
);

export const resendOtp = createAsyncThunk(
  'auth/resendOtp',
  async (identifier, { rejectWithValue }) => {
    try {
      const data = await authApi.resendOtp(identifier);
      return { identifier: data.identifier, message: data.message, devOtp: data.devOtp };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to resend code');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      const data = await authApi.login(credentials);
      persistSession(data);
      // Fold any guest cart into the now-authenticated user's server cart.
      dispatch(mergeGuestCartThunk());
      return { user: data.user, token: data.accessToken };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Even if the server call fails (e.g. token already expired), we still
      // want to clear the local session below.
    }
    return true;
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (identifier, { rejectWithValue }) => {
    try {
      const data = await authApi.forgotPassword(identifier);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Request failed');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await authApi.resetPassword(payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to reset password');
    }
  }
);

const clearLocalSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      clearLocalSession();
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearPendingVerification: (state) => {
      state.pendingVerification = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingVerification = action.payload.identifier;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Verify account
      .addCase(verifyAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyAccount.fulfilled, (state) => {
        state.loading = false;
        state.pendingVerification = null;
      })
      .addCase(verifyAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Resend OTP
      .addCase(resendOtp.pending, (state) => {
        state.error = null;
      })
      .addCase(resendOtp.fulfilled, (state, action) => {
        state.pendingVerification = action.payload.identifier;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        clearLocalSession();
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })

      // Forgot / reset password
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError, clearPendingVerification } = authSlice.actions;
export default authSlice.reducer;
