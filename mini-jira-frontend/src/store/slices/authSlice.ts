import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User, AuthResponse } from '../../types';
import apiClient from '../../services/apiClient';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

const getInitialUser = (): User | null => {
  const savedUser = localStorage.getItem('user');
  return savedUser ? JSON.parse(savedUser) : null;
};

const initialState: AuthState = {
  user: getInitialUser(),
  isAuthenticated: !!getInitialUser(),
};

export const fetchCurrentUser = createAsyncThunk('auth/fetchCurrentUser', async () => {
  const res = await apiClient.get('/auth/me');
  if (res.data.success && res.data.data) {
    return res.data.data;
  }
  throw new Error('User not found');
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  try {
    await apiClient.post('/auth/logout');
  } catch (e) {

  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<AuthResponse>) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logoutLocally: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      sessionStorage.clear();
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        localStorage.removeItem('user');
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        localStorage.removeItem('user');
        sessionStorage.clear();
      });
  },
});

export const { login, logoutLocally } = authSlice.actions;
export default authSlice.reducer;
