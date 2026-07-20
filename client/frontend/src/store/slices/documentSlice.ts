import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DocumentAPI, DocumentTypeAPI, DocumentVerificationAPI } from '@/api';

interface DocumentState {
  documents: any[];
  documentTypes: any[];
  documentVerifications: any[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
  pagination: any;
}

const initialState: DocumentState = {
  documents: [],
  documentTypes: [],
  documentVerifications: [],
  loading: false,
  uploading: false,
  error: null,
  pagination: null,
};

export const fetchDocuments = createAsyncThunk(
  'documents/fetchAll',
  async (params?: Record<string, any>) => {
    const res = await DocumentAPI.getAll(params);
    return res.data;
  }
);

export const uploadDocument = createAsyncThunk(
  'documents/upload',
  async (formData: FormData) => {
    const res = await DocumentAPI.upload(formData);
    return res.data.data;
  }
);

export const fetchDocumentTypes = createAsyncThunk(
  'documents/fetchTypes',
  async () => {
    const res = await DocumentTypeAPI.getAll();
    return res.data.data;
  }
);

export const fetchDocumentVerifications = createAsyncThunk(
  'documents/fetchVerifications',
  async (params?: Record<string, any>) => {
    const res = await DocumentVerificationAPI.getAll(params);
    return res.data;
  }
);

const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setDocuments: (state, action: PayloadAction<any[]>) => {
      state.documents = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload.data || action.payload;
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(uploadDocument.pending, (state) => {
        state.uploading = true;
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.uploading = false;
        state.documents.unshift(action.payload);
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchDocumentTypes.fulfilled, (state, action) => {
        state.documentTypes = action.payload;
      })
      .addCase(fetchDocumentVerifications.fulfilled, (state, action) => {
        state.documentVerifications = action.payload.data || action.payload;
      });
  },
});

export const { clearError, setDocuments } = documentSlice.actions;
export default documentSlice.reducer;
