import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface Modal {
  id: string;
  isOpen: boolean;
  data?: any;
}

interface Branding {
  app_name: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  favicon_url: string;
  font_family: string;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  visible: boolean;
}

interface Permissions {
  can_upload_documents: boolean;
  can_verify_documents: boolean;
  can_manage_users: boolean;
  can_view_analytics: boolean;
  can_broadcast_notifications: boolean;
  can_configure_ai: boolean;
  can_export_data: boolean;
  can_bulk_upload: boolean;
  can_manage_organizations: boolean;
  can_view_system_config: boolean;
}

interface Features {
  rag_enabled: boolean;
  chat_enabled: boolean;
  tickets_enabled: boolean;
  knowledge_base_enabled: boolean;
  document_verification_enabled: boolean;
  analytics_enabled: boolean;
  bulk_upload_enabled: boolean;
  api_access_enabled: boolean;
  sso_enabled: boolean;
  two_factor_required: boolean;
}

interface Limits {
  max_file_size_mb: number;
  allowed_file_types: string[];
  max_uploads_per_day: number;
}

interface UIConfig {
  branding: Branding;
  navigation: NavigationItem[];
  permissions: Permissions;
  features: Features;
  limits: Limits;
}

interface UISlice {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  toasts: Toast[];
  modals: Modal[];
  isOnline: boolean;
  ui_config: UIConfig | null;
}

const initialState: UISlice = {
  sidebarOpen: false,
  sidebarCollapsed: false,
  toasts: [],
  modals: [],
  isOnline: navigator.onLine,
  ui_config: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      state.toasts.push({ ...action.payload, id: Date.now().toString() });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    openModal: (state, action: PayloadAction<{ id: string; data?: any }>) => {
      const existing = state.modals.find((m) => m.id === action.payload.id);
      if (existing) {
        existing.isOpen = true;
        existing.data = action.payload.data;
      } else {
        state.modals.push({ id: action.payload.id, isOpen: true, data: action.payload.data });
      }
    },
    closeModal: (state, action: PayloadAction<string>) => {
      const modal = state.modals.find((m) => m.id === action.payload);
      if (modal) modal.isOpen = false;
    },
    setOnline: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setUIConfig: (state, action: PayloadAction<UIConfig>) => {
      state.ui_config = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapsed,
  addToast,
  removeToast,
  openModal,
  closeModal,
  setOnline,
  setUIConfig,
} = uiSlice.actions;
export default uiSlice.reducer;
