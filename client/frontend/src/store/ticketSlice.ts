import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { TicketAPI } from "@/api/ticket.api";

export const fetchTickets = createAsyncThunk(
  "ticket/fetchTickets",
  async (params: Record<string, string> | undefined, { rejectWithValue }) => {
    try {
      const res = await TicketAPI.getAll(params);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch tickets");
    }
  }
);

export const fetchUserTickets = createAsyncThunk(
  "ticket/fetchUserTickets",
  async (userId: string, { rejectWithValue }) => {
    try {
      const res = await TicketAPI.getByUser(userId);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch user tickets");
    }
  }
);

export const createTicket = createAsyncThunk(
  "ticket/createTicket",
  async (data: any, { rejectWithValue }) => {
    try {
      const res = await TicketAPI.create(data);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to create ticket");
    }
  }
);

export const closeTicket = createAsyncThunk(
  "ticket/closeTicket",
  async (ticketId: string, { rejectWithValue }) => {
    try {
      await TicketAPI.close(ticketId);
      return ticketId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to close ticket");
    }
  }
);

export const fetchTicketStats = createAsyncThunk(
  "ticket/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await TicketAPI.getStats();
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch stats");
    }
  }
);

interface TicketState {
  tickets: any[];
  stats: any;
  loading: boolean;
  creating: boolean;
  error: string | null;
}

const initialState: TicketState = {
  tickets: [],
  stats: null,
  loading: false,
  creating: false,
  error: null,
};

const ticketSlice = createSlice({
  name: "ticket",
  initialState,
  reducers: {
    clearTicketError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUserTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload;
      })
      .addCase(fetchUserTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createTicket.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.creating = false;
        state.tickets.unshift(action.payload);
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string;
      })
      .addCase(closeTicket.fulfilled, (state, action) => {
        const ticket = state.tickets.find((t) => t._id === action.payload);
        if (ticket) ticket.status = "closed";
      })
      .addCase(fetchTicketStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearTicketError } = ticketSlice.actions;
export default ticketSlice.reducer;
