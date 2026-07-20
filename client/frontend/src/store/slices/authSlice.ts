import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthAPI } from '@/api/auth.api';
import { tokenManager } from '@/utils/tokenManager';

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role_id?: { _id: string; role_name: string };
  role?: { _id: string; name: string };
  organization_id?: { _id: string; name: string };
  status?: string;
}

interface UIConfig {
  branding: {
    app_name: string;
    primary_color: string;
    secondary_color: string;
    logo_url: string;
    favicon_url: string;
    font_family: string;
  };
  navigation: Array<{
    id: string;
    label: string;
    icon: string;
    path: string;
    visible: boolean;
  }>;
  permissions: Record<string, boolean>;
  features: Record<string, boolean>;
  limits: {
    max_file_size_mb: number;
    allowed_file_types: string[];
    max_uploads_per_day: number;
  };
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserData | null;
  ui_config: UIConfig | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: !!tokenManager.getAccessToken(),
  user: null,
  ui_config: null,
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const response = await AuthAPI.login({ email, password });
    const data = response.data.data;
    const { access_token, user, ui_config } = data;
    tokenManager.setAccessToken(access_token);
    return { user, ui_config };
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: any) => {
    const response = await AuthAPI.signup(userData);
    const data = response.data.data;
    const { access_token, user, ui_config } = data;
    tokenManager.setAccessToken(access_token);
    return { user, ui_config };
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await (AuthAPI as any).logout();
  } finally {
    tokenManager.clearTokens();
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserData>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<UserData>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.ui_config = action.payload.ui_config;
      })
      .addCase(loginUser.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Login failed'; })
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.ui_config = action.payload.ui_config;
      })
      .addCase(registerUser.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Registration failed'; })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.ui_config = null;
      });
  },
});

export const { setUser, clearUser, clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
