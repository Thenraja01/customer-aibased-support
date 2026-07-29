const now = new Date();
const daysAgo = (n) => new Date(now.getTime() - n * 86400000);

export const MOCK = {
  commandCenterStatus: {
    platformStatus: {
      maintenanceMode: false,
      uptimeSeconds: 187200,
      memoryUsedMB: 342,
      totalMemoryMB: 1024,
      env: "production",
    },
    activeOrganizationsCard: {
      total: 12,
      active: 10,
      suspended: 1,
      planBreakdown: { enterprise: 3, business: 5 },
    },
    onlineUsersCard: {
      total: 2847,
      active: 2156,
      blocked: 43,
    },
    aiServicesCard: {
      activeModel: "gpt-5.5",
      totalSessions: 18420,
      totalMessages: 142380,
      monthlyAiRequests: 28410,
    },
    apiHealthCard: {
      expressStatus: "Healthy",
      dbPingMs: 3,
      socketClients: 47,
      totalStorageMB: 51200,
    },
    criticalAlertsCard: {
      totalAlerts: 3,
      pendingVerifications: 8,
      blockedUsers: 43,
      suspendedOrgs: 1,
    },
    recentAuditLogs: [
      { _id: "log1", action: "Organization Created", user_id: { name: "Alice Admin", email: "alice@example.com" }, table_name: "organizations", created_at: daysAgo(0).toISOString() },
      { _id: "log2", action: "User Role Updated", user_id: { name: "Bob Super", email: "bob@example.com" }, table_name: "users", created_at: daysAgo(0).toISOString() },
      { _id: "log3", action: "Global Settings Modified", user_id: { name: "Alice Admin" }, table_name: "global_settings", created_at: daysAgo(1).toISOString() },
      { _id: "log4", action: "API Key Generated", user_id: { name: "System" }, table_name: "api_keys", created_at: daysAgo(1).toISOString() },
      { _id: "log5", action: "Organization Suspended", user_id: { name: "Bob Super" }, table_name: "organizations", created_at: daysAgo(2).toISOString() },
    ],
    charts: {
      heatmapData: Array.from({ length: 24 }, (_, h) => ({
        hour: `${h}:00`,
        Mon: Math.floor(Math.random() * 100),
        Tue: Math.floor(Math.random() * 100),
        Wed: Math.floor(Math.random() * 100),
        Thu: Math.floor(Math.random() * 100),
        Fri: Math.floor(Math.random() * 100),
        Sat: Math.floor(Math.random() * 50),
        Sun: Math.floor(Math.random() * 30),
      })),
      latencyHistogramData: [
        { bin: "<100ms", count: 1240 }, { bin: "100-200ms", count: 890 }, { bin: "200-500ms", count: 420 },
        { bin: "500-1s", count: 180 }, { bin: "1-2s", count: 65 }, { bin: ">2s", count: 22 },
      ],
      trafficAreaData: Array.from({ length: 30 }, (_, i) => ({
        date: daysAgo(29 - i).toISOString().split("T")[0],
        volume: Math.floor(Math.random() * 5000) + 2000,
      })),
    },
  },

  dashboardStats: {
    totalUsers: 2847,
    activeUsers: 2156,
    blockedUsers: 43,
    totalOrgs: 12,
    totalRoles: 8,
    recentActivity: 482,
    orgStats: [
      { organizationId: "ORG-001", name: "Acme Corp", organization_id: "ORG-001", userCount: 342 },
      { organizationId: "ORG-002", name: "Globex Inc", organization_id: "ORG-002", userCount: 891 },
      { organizationId: "ORG-003", name: "Initech", organization_id: "ORG-003", userCount: 156 },
      { organizationId: "ORG-004", name: "Hooli", organization_id: "ORG-004", userCount: 623 },
      { organizationId: "ORG-005", name: "Stark Industries", organization_id: "ORG-005", userCount: 412 },
    ],
  },

  organizations: [
    { _id: "org1", organization_id: "ORG-001", name: "Acme Corp", domain: "acme", email: "admin@acme.com", phone: "+1-555-0100", address: "123 Main St, San Francisco, CA", status: "active", plan: "enterprise", created_at: daysAgo(365).toISOString(), userCount: 342 },
    { _id: "org2", organization_id: "ORG-002", name: "Globex Inc", domain: "globex", email: "admin@globex.com", phone: "+1-555-0200", address: "456 Market St, New York, NY", status: "active", plan: "business", created_at: daysAgo(280).toISOString(), userCount: 891 },
    { _id: "org3", organization_id: "ORG-003", name: "Initech", domain: "initech", email: "admin@initech.com", phone: "+1-555-0300", address: "789 Oak Ave, Austin, TX", status: "active", plan: "starter", created_at: daysAgo(180).toISOString(), userCount: 156 },
    { _id: "org4", organization_id: "ORG-004", name: "Hooli", domain: "hooli", email: "admin@hooli.com", phone: "+1-555-0400", address: "321 Tech Blvd, Palo Alto, CA", status: "active", plan: "enterprise", created_at: daysAgo(90).toISOString(), userCount: 623 },
    { _id: "org5", organization_id: "ORG-005", name: "Stark Industries", domain: "stark", email: "admin@stark.com", phone: "+1-555-0500", address: "1 Stark Tower, New York, NY", status: "suspended", plan: "business", created_at: daysAgo(60).toISOString(), userCount: 412 },
    { _id: "org6", organization_id: "ORG-006", name: "Wayne Enterprises", domain: "wayne", email: "admin@wayne.com", phone: "+1-555-0600", address: "1007 Mountain Dr, Gotham", status: "active", plan: "enterprise", created_at: daysAgo(45).toISOString(), userCount: 278 },
    { _id: "org7", organization_id: "ORG-007", name: "Cyberdyne Systems", domain: "cyberdyne", email: "admin@cyberdyne.com", phone: "+1-555-0700", address: "42 Skynet Ave, Los Angeles, CA", status: "active", plan: "starter", created_at: daysAgo(30).toISOString(), userCount: 89 },
    { _id: "org8", organization_id: "ORG-008", name: "Umbrella Corp", domain: "umbrella", email: "admin@umbrella.com", phone: "+1-555-0800", address: "88 Raccoon St, Detroit, MI", status: "active", plan: "business", created_at: daysAgo(20).toISOString(), userCount: 167 },
  ],

  orgFullDetails: (id) => ({
    organization: {
      _id: id,
      organization_id: id === "org1" ? "ORG-001" : `ORG-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      name: id === "org1" ? "Acme Corp" : `Organization ${id}`,
      domain: "example",
      email: "admin@example.com",
      phone: "+1-555-0000",
      address: "123 Main St",
      status: "active",
      plan: "business",
      customPrompt: "You are a helpful support assistant for {ORGANIZATION_NAME}.",
      chatbot_name: "Support AI",
      default_language: "en",
      greeting_message: "Hello! How can I help you today?",
      logo: { url: "", public_id: "" },
      brand_colors: { primary: "#2563eb", secondary: "#7c3aed", accent: "#f59e0b" },
      ai_settings: { temperature: 0.7, top_k: 40, similarity_threshold: 0.75, max_tokens: 2048, response_style: "balanced" },
      working_hours: {
        timezone: "UTC",
        monday: { open: "09:00", close: "17:00", enabled: true },
        tuesday: { open: "09:00", close: "17:00", enabled: true },
        wednesday: { open: "09:00", close: "17:00", enabled: true },
        thursday: { open: "09:00", close: "17:00", enabled: true },
        friday: { open: "09:00", close: "17:00", enabled: true },
        saturday: { open: "10:00", close: "14:00", enabled: false },
        sunday: { open: "10:00", close: "14:00", enabled: false },
      },
      email_templates: {
        ticket_assigned: { subject: "New ticket assigned: {{ticket_id}}", body: "Hello {{agent_name}}, Ticket {{ticket_id}} has been assigned to you." },
        ticket_resolved: { subject: "Ticket resolved: {{ticket_id}}", body: "Hello {{customer_name}}, Your ticket {{ticket_id}} has been resolved." },
      },
      storage_used: 104857600,
      storage_limit: 524288000,
      ai_requests_month: 5000,
      ai_requests_limit: 10000,
      api_keys: [
        { _id: "key1", name: "Mobile App", key: "sk-xxxx...xxxx", is_active: true, created_at: daysAgo(30).toISOString(), last_used: daysAgo(1).toISOString() },
        { _id: "key2", name: "Web Client", key: "sk-yyyy...yyyy", is_active: true, created_at: daysAgo(60).toISOString(), last_used: daysAgo(0).toISOString() },
      ],
      subscription_start: daysAgo(365).toISOString(),
      subscription_end: daysAgo(-30).toISOString(),
      created_at: daysAgo(365).toISOString(),
    },
    activityLogs: [
      { _id: "alog1", action: "User Created", user_id: { name: "System" }, created_at: daysAgo(0).toISOString() },
      { _id: "alog2", action: "Settings Updated", user_id: { name: "Admin User" }, created_at: daysAgo(1).toISOString() },
      { _id: "alog3", action: "API Key Generated", user_id: { name: "Admin User" }, created_at: daysAgo(3).toISOString() },
      { _id: "alog4", action: "Organization Plan Changed to Enterprise", user_id: { name: "Super Admin" }, created_at: daysAgo(7).toISOString() },
    ],
  }),

  orgAnalytics: {
    revenueAnalytics: {
      waterfall: [
        { label: "Starting MRR", value: 50000, isTotal: true },
        { label: "New Subscriptions", value: 8500 },
        { label: "Upgrades", value: 3200 },
        { label: "Downgrades", value: -1200 },
        { label: "Churn", value: -3400 },
        { label: "Ending MRR", value: 57100, isTotal: true },
      ],
    },
    userAnalytics: {
      histogram: [
        { bin: "0-7d", count: 42 }, { bin: "7-14d", count: 38 }, { bin: "14-21d", count: 31 },
        { bin: "21-30d", count: 25 }, { bin: "30-60d", count: 18 }, { bin: "60d+", count: 12 },
      ],
    },
    aiPerformance: {
      area: Array.from({ length: 14 }, (_, i) => ({
        date: daysAgo(13 - i).toISOString().split("T")[0],
        sessions: Math.floor(Math.random() * 300) + 100,
      })),
    },
  },

  users: [
    { _id: "u1", name: "Alice Johnson", email: "alice@acme.com", organization_id: "org1", organization_name: "Acme Corp", role_name: "admin", status: "active", created_at: daysAgo(100).toISOString() },
    { _id: "u2", name: "Bob Smith", email: "bob@globex.com", organization_id: "org2", organization_name: "Globex Inc", role_name: "support", status: "active", created_at: daysAgo(80).toISOString() },
    { _id: "u3", name: "Carol Davis", email: "carol@initech.com", organization_id: "org3", organization_name: "Initech", role_name: "customer", status: "active", created_at: daysAgo(60).toISOString() },
    { _id: "u4", name: "Dan Wilson", email: "dan@hooli.com", organization_id: "org4", organization_name: "Hooli", role_name: "admin", status: "blocked", created_at: daysAgo(45).toISOString() },
    { _id: "u5", name: "Eve Martinez", email: "eve@stark.com", organization_id: "org5", organization_name: "Stark Industries", role_name: "customer", status: "active", created_at: daysAgo(30).toISOString() },
    { _id: "u6", name: "Frank Lee", email: "frank@wayne.com", organization_id: "org6", organization_name: "Wayne Enterprises", role_name: "support", status: "active", created_at: daysAgo(20).toISOString() },
    { _id: "u7", name: "Grace Kim", email: "grace@cyberdyne.com", organization_id: "org7", organization_name: "Cyberdyne Systems", role_name: "customer", status: "inactive", created_at: daysAgo(10).toISOString() },
    { _id: "u8", name: "Henry Brown", email: "henry@umbrella.com", organization_id: "org8", organization_name: "Umbrella Corp", role_name: "admin", status: "active", created_at: daysAgo(5).toISOString() },
    { _id: "u9", name: "Ivy Chen", email: "ivy@acme.com", organization_id: "org1", organization_name: "Acme Corp", role_name: "customer", status: "active", created_at: daysAgo(3).toISOString() },
    { _id: "u10", name: "Jack Thompson", email: "jack@globex.com", organization_id: "org2", organization_name: "Globex Inc", role_name: "customer", status: "active", created_at: daysAgo(1).toISOString() },
    { _id: "u11", name: "Super Admin", email: "super@admin.com", organization_id: null, organization_name: "Platform", role_name: "super_admin", status: "active", created_at: daysAgo(500).toISOString() },
  ],

  roles: [
    { _id: "r1", role_name: "super_admin", description: "Full platform access" },
    { _id: "r2", role_name: "admin", description: "Organization admin" },
    { _id: "r3", role_name: "support", description: "Support agent" },
    { _id: "r4", role_name: "customer", description: "End user" },
  ],

  auditLogs: Array.from({ length: 20 }, (_, i) => ({
    _id: `audit${i}`,
    action: ["Organization Created", "User Updated", "Role Changed", "Settings Modified", "API Key Generated", "Organization Suspended", "User Blocked", "Plan Upgraded"][Math.floor(Math.random() * 8)],
    user_id: { _id: `u${Math.floor(Math.random() * 5) + 1}`, name: ["Alice Johnson", "Bob Smith", "System", "Super Admin", "Carol Davis"][Math.floor(Math.random() * 5)] },
    table_name: ["organizations", "users", "roles", "global_settings", "api_keys"][Math.floor(Math.random() * 5)],
    created_at: daysAgo(Math.floor(Math.random() * 14)).toISOString(),
  })),

  globalSettings: {
    app_name: "AI Customer Support",
    logo: { url: "", public_id: "" },
    favicon_url: "",
    brand_colors: { primary: "#2563eb", secondary: "#7c3aed", accent: "#f59e0b" },
    marketing: {
      hero_title: "AI-Powered Customer Support",
      hero_subtitle: "Transform your customer experience with intelligent automation.",
      features: [
        { title: "Smart Responses", description: "AI-powered replies" },
        { title: "Multi-Tenant", description: "Organize your teams" },
      ],
    },
    login_page: {
      title: "Welcome Back",
      subtitle: "Sign in to your organization account",
    },
    legal: {
      privacy_policy: "https://example.com/privacy",
      terms_of_service: "https://example.com/terms",
    },
  },

  knowledgeGraphStats: {
    totalNodes: 1284,
    totalEdges: 4273,
    topics: Array.from({ length: 10 }, (_, i) => ({
      _id: `topic${i}`,
      name: ["Password Reset", "Billing", "Account Setup", "API Integration", "Troubleshooting", "Security", "Performance", "Compliance", "Reporting", "General FAQ"][i],
      nodeCount: Math.floor(Math.random() * 50) + 5,
    })),
    recentConnections: Array.from({ length: 8 }, (_, i) => ({
      _id: `conn${i}`,
      source: `Topic ${String.fromCharCode(65 + i)}`,
      target: `Topic ${String.fromCharCode(75 + i)}`,
      weight: Math.random(),
      created_at: daysAgo(i).toISOString(),
    })),
  },

  orgUsers: (orgId) => MOCK.users.filter((u) => u.organization_id === orgId).concat({
    _id: "u-org-user", name: "Default User", email: "user@org.com",
    organization_id: orgId, organization_name: "Organization", role_name: "customer", status: "active", created_at: daysAgo(30).toISOString(),
  }),

  pagination: { page: 1, limit: 10, total: 50, totalPages: 5 },

  success: (data, message = "Success") => ({ data: { success: true, data, message, pagination: data?.length ? MOCK.pagination : undefined } }),

  successDetail: (data) => ({ data: { success: true, data } }),
};
