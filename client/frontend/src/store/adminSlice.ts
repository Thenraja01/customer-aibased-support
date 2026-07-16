import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  IOrganization,
  IUser,
  IRole,
  IDocument,
  IDocumentType,
  IDocumentVerification,
} from "@/types/index";

interface DashboardStats {
  totalUsers: number;
  totalOrgs: number;
  totalRoles: number;
  blockedUsers: number;
  activeUsers: number;
  recentLogs: number;
  recentActivity: number;
  orgStats: Array<{
    organizationId: string;
    name: string;
    organization_id: string;
    userCount: number;
  }>;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AdminState {
  dashboardStats: DashboardStats | null;
  organizations: IOrganization[];
  users: IUser[];
  roles: IRole[];
  auditLogs: any[];
  orgUsers: IUser[];
  documents: IDocument[];
  documentTypes: IDocumentType[];
  documentVerifications: IDocumentVerification[];
  loading: boolean;
  orgPagination: Pagination | null;
  userPagination: Pagination | null;
  rolePagination: Pagination | null;
  logPagination: Pagination | null;
  orgUserPagination: Pagination | null;
}

const initialState: AdminState = {
  dashboardStats: null,
  organizations: [],
  users: [],
  roles: [],
  auditLogs: [],
  orgUsers: [],
  documents: [],
  documentTypes: [],
  documentVerifications: [],
  loading: false,
  orgPagination: null,
  userPagination: null,
  rolePagination: null,
  logPagination: null,
  orgUserPagination: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setDashboardStats: (state, action: PayloadAction<DashboardStats>) => {
      state.dashboardStats = action.payload;
    },
    setOrganizations: (state, action: PayloadAction<IOrganization[]>) => {
      state.organizations = action.payload;
    },
    setOrgPagination: (state, action: PayloadAction<Pagination>) => {
      state.orgPagination = action.payload;
    },
    setUsers: (state, action: PayloadAction<IUser[]>) => {
      state.users = action.payload;
    },
    setUserPagination: (state, action: PayloadAction<Pagination>) => {
      state.userPagination = action.payload;
    },
    setOrgUsers: (state, action: PayloadAction<IUser[]>) => {
      state.orgUsers = action.payload;
    },
    setOrgUserPagination: (state, action: PayloadAction<Pagination>) => {
      state.orgUserPagination = action.payload;
    },
    setRoles: (state, action: PayloadAction<IRole[]>) => {
      state.roles = action.payload;
    },
    setRolePagination: (state, action: PayloadAction<Pagination>) => {
      state.rolePagination = action.payload;
    },
    setAuditLogs: (state, action: PayloadAction<any[]>) => {
      state.auditLogs = action.payload;
    },
    setLogPagination: (state, action: PayloadAction<Pagination>) => {
      state.logPagination = action.payload;
    },
    setDocuments: (state, action: PayloadAction<IDocument[]>) => {
      state.documents = action.payload;
    },
    setDocumentTypes: (state, action: PayloadAction<IDocumentType[]>) => {
      state.documentTypes = action.payload;
    },
    setDocumentVerifications: (
      state,
      action: PayloadAction<IDocumentVerification[]>
    ) => {
      state.documentVerifications = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setDashboardStats,
  setOrganizations,
  setOrgPagination,
  setUsers,
  setUserPagination,
  setOrgUsers,
  setOrgUserPagination,
  setRoles,
  setRolePagination,
  setAuditLogs,
  setLogPagination,
  setDocuments,
  setDocumentTypes,
  setDocumentVerifications,
  setLoading,
} = adminSlice.actions;

export default adminSlice.reducer;
