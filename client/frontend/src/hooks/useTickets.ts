import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTickets,
  fetchUserTickets,
  createTicket,
  closeTicket,
  fetchTicketStats,
} from "@/store/ticketSlice";
import type { RootState, AppDispatch } from "@/store/store";

export function useTickets() {
  const dispatch = useDispatch<AppDispatch>();
  const { tickets, stats, loading, creating, error } = useSelector(
    (state: RootState) => state.ticket
  );
  const { user } = useSelector((state: RootState) => state.user);

  const loadUserTickets = useCallback(() => {
    if (user?._id) {
      dispatch(fetchUserTickets(user._id));
    }
  }, [dispatch, user]);

  const loadAllTickets = useCallback(
    (params?: Record<string, string>) => {
      dispatch(fetchTickets(params));
    },
    [dispatch]
  );

  const addTicket = useCallback(
    (data: any) => {
      return dispatch(createTicket(data));
    },
    [dispatch]
  );

  const endTicket = useCallback(
    (ticketId: string) => {
      return dispatch(closeTicket(ticketId));
    },
    [dispatch]
  );

  const loadStats = useCallback(() => {
    dispatch(fetchTicketStats());
  }, [dispatch]);

  return {
    tickets,
    stats,
    loading,
    creating,
    error,
    loadUserTickets,
    loadAllTickets,
    addTicket,
    endTicket,
    loadStats,
  };
}
