import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { NotificationAPI } from "@/api/notification.api";

export const fetchNotifications = createAsyncThunk(
  "notification/fetch",
  async (userId: string, { rejectWithValue }) => {
    try {
      const res = await NotificationAPI.getByUser(userId);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch notifications");
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  "notification/unreadCount",
  async (userId: string, { rejectWithValue }) => {
    try {
      const res = await NotificationAPI.getUnreadCount(userId);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch unread count");
    }
  }
);

export const markAsRead = createAsyncThunk(
  "notification/markRead",
  async (id: string, { rejectWithValue }) => {
    try {
      await NotificationAPI.markRead(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to mark as read");
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  "notification/markAllRead",
  async (userId: string, { rejectWithValue }) => {
    try {
      await NotificationAPI.markAllRead(userId);
      return userId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to mark all as read");
    }
  }
);

interface NotificationState {
  notifications: any[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notif = state.notifications.find((n) => n._id === action.payload);
        if (notif && notif.status === "unread") {
          notif.status = "read";
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.status = "read";
        });
        state.unreadCount = 0;
      });
  },
});

export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
