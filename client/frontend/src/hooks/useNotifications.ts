import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/store/notificationSlice";
import type { RootState, AppDispatch } from "@/store/store";

export function useNotifications() {
  const dispatch = useDispatch<AppDispatch>();
  const { notifications, unreadCount, loading, error } = useSelector(
    (state: RootState) => state.notification
  );
  const { user } = useSelector((state: RootState) => state.user);

  const loadNotifications = useCallback(() => {
    if (user?._id) {
      dispatch(fetchNotifications(user._id));
    }
  }, [dispatch, user]);

  const loadUnreadCount = useCallback(() => {
    if (user?._id) {
      dispatch(fetchUnreadCount(user._id));
    }
  }, [dispatch, user]);

  const markRead = useCallback((id: string) => {
    dispatch(markAsRead(id));
  }, [dispatch]);

  const markAllRead = useCallback(() => {
    if (user?._id) {
      dispatch(markAllAsRead(user._id));
    }
  }, [dispatch, user]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    loadUnreadCount,
    markRead,
    markAllRead,
  };
}
