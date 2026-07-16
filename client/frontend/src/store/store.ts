import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices";
import chatReducer from "./chatSlice";
import ticketReducer from "./ticketSlice";
import notificationReducer from "./notificationSlice";
import adminReducer from "./adminSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    chat: chatReducer,
    ticket: ticketReducer,
    notification: notificationReducer,
    admin: adminReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
