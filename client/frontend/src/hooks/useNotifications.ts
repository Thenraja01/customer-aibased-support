import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NotificationAPI } from "@/api/notification.api.js";
import { useAuthContext } from "@/context/AuthContext";

export function useNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const [shouldLoad, setShouldLoad] = useState(false);

  const { data: notificationsData, isLoading: notificationsLoading, error: notificationsError } = useQuery({
    queryKey: ["notifications", user?._id],
    queryFn: async () => {
      if (!user?._id) return [];
      const res = await NotificationAPI.getByUser(user._id);
      return res.data?.data || res.data || [];
    },
    enabled: shouldLoad && !!user?._id,
  });

  const { data: unreadCountData } = useQuery({
    queryKey: ["notifications", "unreadCount", user?._id],
    queryFn: async () => {
      if (!user?._id) return 0;
      const res = await NotificationAPI.getUnreadCount(user._id);
      return res.data?.data?.count || res.data?.count || 0;
    },
    enabled: shouldLoad && !!user?._id,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => NotificationAPI.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?._id] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unreadCount", user?._id] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: (userId: string) => NotificationAPI.markAllRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?._id] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unreadCount", user?._id] });
    },
  });

  const loadNotifications = useCallback(() => {
    setShouldLoad(true);
  }, []);

  const loadUnreadCount = useCallback(() => {
    setShouldLoad(true);
  }, []);

  const markRead = useCallback(
    (id: string) => {
      markReadMutation.mutate(id);
    },
    [markReadMutation]
  );

  const markAllRead = useCallback(() => {
    if (user?._id) {
      markAllReadMutation.mutate(user._id);
    }
  }, [markAllReadMutation, user]);

  return {
    notifications: notificationsData || [],
    unreadCount: unreadCountData || 0,
    loading: notificationsLoading,
    error: notificationsError ? (notificationsError as Error).message : null,
    loadNotifications,
    loadUnreadCount,
    markRead,
    markAllRead,
  };
}
