import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SupportTicketTable } from "@/components/support/Tickets/SupportTicketTable";
import { TicketFilters } from "@/components/admin/Tickets/TicketFilters";
import { useTickets } from "@/hooks/useTickets";

export default function SupportTicketsPage() {
  const { tickets, loading, loadAllTickets } = useTickets();
  const [filters, setFilters] = useState({ search: "", status: "", priority: "" });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(filters), 350);
    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    loadAllTickets(debouncedFilters);
  }, [loadAllTickets, debouncedFilters]);

  const handleClear = () => {
    setFilters({ search: "", status: "", priority: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <p className="text-muted-foreground">Manage and resolve customer tickets</p>
      </div>
      <TicketFilters
        filters={filters}
        onFilterChange={setFilters}
        onClear={handleClear}
      />
      <SupportTicketTable tickets={tickets} loading={loading} />
    </div>
  );
}
