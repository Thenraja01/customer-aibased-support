import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TicketAPI } from "@/api";
import { useToast } from "@/components/ui/toast";

export function useTicketDetail(ticketId: string | undefined) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const ticketQuery = useQuery({
    queryKey: ["tickets", ticketId],
    queryFn: async () => {
      const res = await TicketAPI.getById(ticketId!);
      return res.data.data;
    },
    enabled: !!ticketId,
  });

  const messagesQuery = useQuery({
    queryKey: ["tickets", ticketId, "messages"],
    queryFn: async () => {
      const res = await TicketAPI.getMessages(ticketId!);
      return res.data.data || [];
    },
    enabled: !!ticketId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, is_internal }: { content: string; is_internal?: boolean }) => {
      const res = await TicketAPI.sendMessage(ticketId!, { content, is_internal });
      return res.data.data;
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData(["tickets", ticketId, "messages"], (old: any) => [...(old || []), newMessage]);
      // Also update ticket status if needed (optimistic)
      queryClient.setQueryData(["tickets", ticketId], (old: any) => old ? { ...old, status: "in_progress" } : old);
    },
    onError: () => {
      toast.error("Error", "Failed to send message");
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await TicketAPI.deleteMessage(ticketId!, messageId);
      return messageId;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(["tickets", ticketId, "messages"], (old: any) => 
        (old || []).filter((m: any) => m._id !== deletedId)
      );
    },
    onError: () => {
      toast.error("Error", "Failed to delete message");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      let res;
      if (status === "resolved") res = await TicketAPI.resolve(ticketId!);
      else if (status === "closed") res = await TicketAPI.close(ticketId!);
      else if (status === "in_progress") res = await TicketAPI.setInProgress(ticketId!);
      else if (status === "pending") res = await TicketAPI.setPending(ticketId!);
      else if (status === "open") res = await TicketAPI.reopen(ticketId!);
      return res?.data.data;
    },
    onSuccess: (updatedTicket) => {
      if (updatedTicket) {
        queryClient.setQueryData(["tickets", ticketId], updatedTicket);
      }
    },
    onError: () => {
      toast.error("Error", "Failed to update status");
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (supportId: string) => {
      const res = await TicketAPI.assign(ticketId!, { supportId });
      return res.data.data;
    },
    onSuccess: (updatedTicket) => {
      if (updatedTicket) {
        queryClient.setQueryData(["tickets", ticketId], updatedTicket);
      }
    },
    onError: () => {
      toast.error("Error", "Failed to assign ticket");
    },
  });

  return {
    ticket: ticketQuery.data,
    ticketLoading: ticketQuery.isLoading,
    messages: messagesQuery.data || [],
    messagesLoading: messagesQuery.isLoading,
    sendMessage: sendMessageMutation.mutate,
    sending: sendMessageMutation.isPending,
    deleteMessage: deleteMessageMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    assignToMe: assignMutation.mutate,
  };
}
