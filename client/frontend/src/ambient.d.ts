import { AxiosInstance, AxiosResponse } from 'axios';

declare module '@/api/axiosInstance' {
  const AxiosInstance: AxiosInstance;
  export default AxiosInstance;
}

declare module '@/api/auth.api' {
  export const AuthAPI: {
    signup: (data: any) => Promise<AxiosResponse>;
    login: (data: any) => Promise<AxiosResponse>;
    logout: () => Promise<AxiosResponse>;
    refreshToken: (refreshToken: string) => Promise<AxiosResponse>;
    sendOTP: (phone: string) => Promise<AxiosResponse>;
    verifyOTP: (phone: string, otp: string) => Promise<AxiosResponse>;
    forgotPassword: (email: string) => Promise<AxiosResponse>;
    resetPassword: (token: string, newPassword: string) => Promise<AxiosResponse>;
    getOrganizations: () => Promise<AxiosResponse>;
    getRoles: () => Promise<AxiosResponse>;
  };
}

declare module '@/api/user.api' {
  export const UsersAPI: {
    getAll: (params?: any) => Promise<AxiosResponse>;
    getById: (id: string) => Promise<AxiosResponse>;
    create: (data: any) => Promise<AxiosResponse>;
    update: (id: string, data: any) => Promise<AxiosResponse>;
    delete: (id: string) => Promise<AxiosResponse>;
    updateStatus: (id: string, status: string) => Promise<AxiosResponse>;
    getProfile: () => Promise<AxiosResponse>;
    updateProfile: (data: any) => Promise<AxiosResponse>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<AxiosResponse>;
    uploadAvatar: (formData: FormData) => Promise<AxiosResponse>;
    getActivityLogs: () => Promise<AxiosResponse>;
  };
}

declare module '@/api/chat.api' {
  export const ChatAPI: {
    create: (data: any) => Promise<AxiosResponse>;
    getAll: (params?: any) => Promise<AxiosResponse>;
    getActive: () => Promise<AxiosResponse>;
    getById: (id: string) => Promise<AxiosResponse>;
    getByUser: (userId: string) => Promise<AxiosResponse>;
    getUserCount: (userId: string) => Promise<AxiosResponse>;
    search: (params?: any) => Promise<AxiosResponse>;
    updateTopic: (id: string, data: any) => Promise<AxiosResponse>;
    close: (id: string) => Promise<AxiosResponse>;
    reopen: (id: string) => Promise<AxiosResponse>;
    delete: (id: string) => Promise<AxiosResponse>;
    escalate: (id: string, data: any) => Promise<AxiosResponse>;
    sendAI: (chatId: string, message: string) => Promise<AxiosResponse>;
    streamAI: (
      chatId: string,
      message: string,
      onToken: (token: string) => void,
      onDone: (meta: any) => void,
      onError: (error: string) => void
    ) => Promise<void>;
  };
}

declare module '@/api/message.api' {
  export const MessageAPI: {
    send: (data: any) => Promise<AxiosResponse>;
    getByChat: (chatId: string) => Promise<AxiosResponse>;
    getPaginated: (chatId: string, params?: any) => Promise<AxiosResponse>;
    getLatest: (chatId: string) => Promise<AxiosResponse>;
    getCount: (chatId: string) => Promise<AxiosResponse>;
    getAI: (chatId: string) => Promise<AxiosResponse>;
    search: (chatId: string, params?: any) => Promise<AxiosResponse>;
    update: (id: string, data: any) => Promise<AxiosResponse>;
    updateFeedback: (id: string, feedback: string) => Promise<AxiosResponse>;
    delete: (id: string) => Promise<AxiosResponse>;
    deleteAll: (chatId: string) => Promise<AxiosResponse>;
  };
}

declare module '@/api/ticket.api' {
  export const TicketAPI: {
    create: (data: any) => Promise<AxiosResponse>;
    getAll: (params?: any) => Promise<AxiosResponse>;
    getStats: () => Promise<AxiosResponse>;
    getById: (id: string) => Promise<AxiosResponse>;
    getByUser: (userId: string) => Promise<AxiosResponse>;
    getByAgent: (agentId: string) => Promise<AxiosResponse>;
    getByStatus: (status: string) => Promise<AxiosResponse>;
    updateStatus: (id: string, status: string) => Promise<AxiosResponse>;
    assign: (id: string, data: any) => Promise<AxiosResponse>;
    updatePriority: (id: string, data: any) => Promise<AxiosResponse>;
    resolve: (id: string, data?: any) => Promise<AxiosResponse>;
    close: (id: string) => Promise<AxiosResponse>;
    escalate: (id: string, reason: string) => Promise<AxiosResponse>;
    getComments: (ticketId: string) => Promise<AxiosResponse>;
    addComment: (ticketId: string, data: any) => Promise<AxiosResponse>;
    delete: (id: string) => Promise<AxiosResponse>;
  };
}

declare module '@/api/notification.api' {
  export const NotificationAPI: {
    create: (data: any) => Promise<AxiosResponse>;
    broadcast: (data: any) => Promise<AxiosResponse>;
    getByUser: (userId: string) => Promise<AxiosResponse>;
    getUnread: (userId: string) => Promise<AxiosResponse>;
    getUnreadCount: (userId: string) => Promise<AxiosResponse>;
    markRead: (id: string) => Promise<AxiosResponse>;
    markAllRead: (userId: string) => Promise<AxiosResponse>;
    delete: (id: string) => Promise<AxiosResponse>;
    clearAll: (userId: string) => Promise<AxiosResponse>;
  };
}

declare module '@/api/admin.api' {
  export const AdminAPI: {
    getDashboardStats: () => Promise<AxiosResponse>;
    getOrganizations: (params?: any) => Promise<AxiosResponse>;
    createOrganization: (data: any) => Promise<AxiosResponse>;
    updateOrganization: (id: string, data: any) => Promise<AxiosResponse>;
    deleteOrganization: (id: string) => Promise<AxiosResponse>;
    getOrgUsers: (id: string, params?: any) => Promise<AxiosResponse>;
    getUsers: (params?: any) => Promise<AxiosResponse>;
    createUser: (data: any) => Promise<AxiosResponse>;
    updateUser: (id: string, data: any) => Promise<AxiosResponse>;
    updateUserStatus: (id: string, status: string) => Promise<AxiosResponse>;
    deleteUser: (id: string) => Promise<AxiosResponse>;
    getRoles: (params?: any) => Promise<AxiosResponse>;
    createRole: (data: any) => Promise<AxiosResponse>;
    updateRole: (id: string, data: any) => Promise<AxiosResponse>;
    deleteRole: (id: string) => Promise<AxiosResponse>;
    getAuditLogs: (params?: any) => Promise<AxiosResponse>;
    getAuditStats: (params?: any) => Promise<AxiosResponse>;
    exportAuditLogs: (params?: any) => Promise<AxiosResponse>;
  };
}

declare module '@/api/document.api' {
  const DocumentAPI: {
    getAll: (params?: any) => Promise<AxiosResponse>;
    getById: (id: string) => Promise<AxiosResponse>;
    getByUser: (userId: string) => Promise<AxiosResponse>;
    getByStatus: (status: string) => Promise<AxiosResponse>;
    upload: (formData: FormData) => Promise<AxiosResponse>;
    updateStatus: (id: string, status: string) => Promise<AxiosResponse>;
    delete: (id: string) => Promise<AxiosResponse>;
    remove: (id: string) => Promise<AxiosResponse>;
    download: (id: string) => Promise<AxiosResponse>;
    getDownloadUrl: (id: string) => Promise<string>;
  };
  export default DocumentAPI;
}

declare module '@/api/documentType.api' {
  const DocumentTypeAPI: {
    getAll: () => Promise<AxiosResponse>;
    getById: (id: string) => Promise<AxiosResponse>;
    create: (data: any) => Promise<AxiosResponse>;
    update: (id: string, data: any) => Promise<AxiosResponse>;
    remove: (id: string) => Promise<AxiosResponse>;
  };
  export default DocumentTypeAPI;
}

declare module '@/api/documentVerification.api' {
  const DocumentVerificationAPI: {
    getAll: (params?: any) => Promise<AxiosResponse>;
    getByDocument: (documentId: string) => Promise<AxiosResponse>;
    getByStatus: (status: string) => Promise<AxiosResponse>;
    create: (data: any) => Promise<AxiosResponse>;
    verify: (documentId: string, data: any) => Promise<AxiosResponse>;
    approve: (id: string) => Promise<AxiosResponse>;
    reject: (id: string, remarks: string) => Promise<AxiosResponse>;
    delete: (id: string) => Promise<AxiosResponse>;
    remove: (id: string) => Promise<AxiosResponse>;
  };
  export default DocumentVerificationAPI;
}

declare module '@/api/faq.api' {
  export const FAQAPI: {
    create: (data: any) => Promise<AxiosResponse>;
    getActive: () => Promise<AxiosResponse>;
    getAll: (params?: any) => Promise<AxiosResponse>;
    getById: (id: string) => Promise<AxiosResponse>;
    update: (id: string, data: any) => Promise<AxiosResponse>;
    delete: (id: string) => Promise<AxiosResponse>;
  };
}

declare module '@/api/rag.api' {
  export const RAGAPI: {
    ingest: (data: any) => Promise<AxiosResponse>;
    query: (data: any) => Promise<AxiosResponse>;
    getStats: () => Promise<AxiosResponse>;
    getGlobalStats: () => Promise<AxiosResponse>;
    getDocumentGraph: (documentId: string) => Promise<AxiosResponse>;
    getDocumentChunks: (documentId: string) => Promise<AxiosResponse>;
    searchByKeyword: (params?: any) => Promise<AxiosResponse>;
    removeDocumentData: (documentId: string) => Promise<AxiosResponse>;
  };
}

declare module '@/api/knowledgeGraph.api' {
  export const KnowledgeGraphAPI: {
    getNodesByDocument: (documentId: string) => Promise<AxiosResponse>;
    searchNodes: (params?: any) => Promise<AxiosResponse>;
    traverse: (params?: any) => Promise<AxiosResponse>;
    getStats: (documentId: string) => Promise<AxiosResponse>;
    getNodeById: (id: string) => Promise<AxiosResponse>;
  };
}

declare module '@/api/memory.api' {
  export const MemoryAPI: {
    store: (data: any) => Promise<AxiosResponse>;
    getUserMemories: (userId: string) => Promise<AxiosResponse>;
    searchByKeyword: (userId: string, params?: any) => Promise<AxiosResponse>;
    getRelevant: (userId: string, params?: any) => Promise<AxiosResponse>;
    getStats: (userId: string) => Promise<AxiosResponse>;
    getContext: (userId: string, params?: any) => Promise<AxiosResponse>;
    extractFacts: (userId: string, data: any) => Promise<AxiosResponse>;
    update: (memoryId: string, data: any) => Promise<AxiosResponse>;
    remove: (memoryId: string) => Promise<AxiosResponse>;
    removeUserMemories: (userId: string) => Promise<AxiosResponse>;
    loadShortTerm: (chatId: string) => Promise<AxiosResponse>;
    clearShortTerm: (chatId: string) => Promise<AxiosResponse>;
  };
}

declare module '@/api/aiSession.api' {
  export const AISessionAPI: {
    create: (data: any) => Promise<AxiosResponse>;
    getAll: (params?: any) => Promise<AxiosResponse>;
    getStats: () => Promise<AxiosResponse>;
    getByChat: (chatId: string) => Promise<AxiosResponse>;
    getChatTokens: (chatId: string) => Promise<AxiosResponse>;
    getById: (id: string) => Promise<AxiosResponse>;
    removeByChat: (chatId: string) => Promise<AxiosResponse>;
  };
}
