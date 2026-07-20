import { combineReducers } from '@reduxjs/toolkit';
import userReducer from './slices';
import authReducer from './slices/authSlice';
import chatReducer from './chatSlice';
import ticketReducer from './ticketSlice';
import notificationReducer from './notificationSlice';
import adminReducer from './adminSlice';
import documentReducer from './slices/documentSlice';
import analyticsReducer from './slices/analyticsSlice';
import uiReducer from './slices/uiSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  chat: chatReducer,
  ticket: ticketReducer,
  notification: notificationReducer,
  admin: adminReducer,
  documents: documentReducer,
  analytics: analyticsReducer,
  ui: uiReducer,
});
