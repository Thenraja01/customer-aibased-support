import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices";
import chatReducer from "./chatSlice";
import ticketReducer from "./ticketSlice";
import notificationReducer from "./notificationSlice";
import adminReducer from "./adminSlice";
import navigationReducer from "./navigationSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    chat: chatReducer,
    ticket: ticketReducer,
    notification: notificationReducer,
    admin: adminReducer,
    navigation: navigationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
