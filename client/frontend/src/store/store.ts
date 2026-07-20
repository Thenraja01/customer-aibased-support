import { configureStore } from "@reduxjs/toolkit";
import { rootReducer } from "./rootReducer";
import { authMiddleware } from "./middleware/authMiddleware";
import { errorMiddleware } from "./middleware/errorMiddleware";
import { tokenManager } from "@/utils/tokenManager";

// Hydrate auth state from localStorage
const userData = localStorage.getItem("user");
const preloadedState = userData
  ? {
      user: {
        user: JSON.parse(userData),
        isAuthenticated: !!tokenManager.getAccessToken(),
      },
    }
  : {};

export const store = configureStore({
  reducer: rootReducer,
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(authMiddleware, errorMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
