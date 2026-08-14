import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TicketAPI } from "@/api/ticket.api.js";
import { useAuthContext } from "@/context/AuthContext";

export function useTickets() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const [params, setParams] = useState<Record<string, string> | undefined>(undefined);
  const [loadType, setLoadType] = useState<"user" | "all" | null>(null);

  const { data: ticketsData, isLoading: ticketsLoading, error: ticketsError } = useQuery({
    queryKey: ["tickets", loadType, user?._id, params],
    queryFn: async () => {
      if (loadType === "user" && user?._id) {
        const res = await TicketAPI.getByUser(user._id);
        return res.data?.data || res.data;
      } else if (loadType === "all") {
        const res = await TicketAPI.getAll(params);
        return res.data?.data || res.data;
      }
      return [];
    },
    enabled: loadType !== null,
  });

  const { data: statsData } = useQuery({
    queryKey: ["tickets", "stats"],
    queryFn: async () => {
      const res = await TicketAPI.getStats();
      return res.data?.data || res.data;
    },
    enabled: false, // only fetch if loadStats is called, though ideally this would just be a separate query. For now we mimic the old behavior.
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => TicketAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: (ticketId: string) => TicketAPI.close(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const loadUserTickets = useCallback(() => {
    setLoadType("user");
  }, []);

  const loadAllTickets = useCallback(
    (newParams?: Record<string, string>) => {
      setParams(newParams);
      setLoadType("all");
    },
    []
  );

  const addTicket = useCallback(
    async (data: any) => {
      return createMutation.mutateAsync(data);
    },
    [createMutation]
  );

  const endTicket = useCallback(
    async (ticketId: string) => {
      return closeMutation.mutateAsync(ticketId);
    },
    [closeMutation]
  );

  const loadStats = useCallback(() => {
    queryClient.fetchQuery({ queryKey: ["tickets", "stats"] });
  }, [queryClient]);

  return {
    tickets: ticketsData || [],
    stats: statsData || null,
    loading: ticketsLoading,
    creating: createMutation.isPending,
    error: ticketsError ? (ticketsError as Error).message : null,
    loadUserTickets,
    loadAllTickets,
    addTicket,
    endTicket,
    loadStats,
  };
}
