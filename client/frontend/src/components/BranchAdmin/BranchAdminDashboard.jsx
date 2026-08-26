import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";
import { fetchDashboardData, getUrgentTickets, getAgentWorkload } from "../../api/branch.api";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import AttachmentUpload from "./AttachmentUpload";
import { OverviewCards, AgentWorkloadTable, UrgentTicketsList, PerformanceChart } from "./components";
import { DateRangePicker } from "./components/DateRangePicker";
import { refreshData } from "./hooks/useAdminRefresh";
import { useNavigate } from "react-router-dom";

const BranchAdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    from: new Date().setDate(new Date().getDate() - 7),
    to: new Date()
  });
  const [typingUsers, setTypingUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const socket = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    socket.on('user-online', handleUserOnline);
    socket.on('ticket-offline', handleUserOffline);
  }, [filters]);

  const fetchDashboardData = async (from, to) => {
    setLoading(true);
    try {
      const [
        overview,
        agentWorkload,
        urgentTickets,
        performance
      ] = await Promise.all([
        fetchDashboardData(from, to),
        getAgentWorkload(filters.branchId),
        getUrgentTickets(filters.branchId),
        getPerformanceMetrics(filters.branchId, from, to)
      ]);
      setDashboardData({
        overview,
        agentWorkload,
        urgentTickets,
        performance
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    fetchDashboardData();
  };

  const handleTicketClick = (ticketId) => {
    navigate(`/tickets/${ticketId}`);
  };

  const handleUserOnline = ({ userId, role }) => {
    setTypingUsers(prev => [...new Set([...prev, userId])]);
  };

  const handleUserOffline = () => {
    setTypingUsers(prev => prev.filter(name => name !== user?.name));
  };

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tickets/messages?ticketId=${dashboardData?.ticketId || 0}&page=1&limit=50`);
      const data = await response.json();
      setDashboardData(prev => ({ ...prev, messages: data }));
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="branch-dashboard">
      <div className="dashboard-header">
        <h1>Branch Command Center</h1>
        <div className="dashboard-header-actions">
          <DateRangePicker 
            value={filters}
            onChange={handleFiltersChange}
            className="mb-4"
          />
          <button 
            onClick={fetchDashboardData} 
            className="btn-refresh"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <OverviewCards data={dashboardData.overview} />

      <div className="dashboard-grid">
        {/* Agent Workload */}
        <div className="card">
          <h3>Agent Workload</h3>
          <AgentWorkloadTable 
            agents={dashboardData.agentWorkload}
            onAgentClick={(agentId) => {
              navigate(`/agents/${agentId}`);
            }}
          />
        </div>

        {/* Urgent Tickets */}
        <div className="card">
          <h3>Urgent Tickets</h3>
          <UrgentTicketsList 
            tickets={dashboardData.urgentTickets}
            onTicketClick={(ticketId) => {
              navigate(`/tickets/${ticketId}`);
            }}
          />
        </div>

        {/* Performance Chart */}
        <div className="card full-width">
          <h3>Performance Metrics</h3>
          <PerformanceChart data={dashboardData.performance} />
        </div> 
      </div>

      {/* Branch Admin Dashboard */}
      <div className="card full-width">
        <h3>Branch Performance</h3>
        <PerformanceChart data={dashboardData.performance} />
      </div>
    </div>
  );
};

export default BranchAdminDashboard;