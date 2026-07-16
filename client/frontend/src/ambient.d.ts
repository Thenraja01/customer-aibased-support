declare module "@/api/auth.api" {
  export const AuthAPI: {
    signup: (data: any) => Promise<any>;
    login: (data: any) => Promise<any>;
    getOrganizations: () => Promise<any>;
    getRoles: () => Promise<any>;
  };
}

declare module "@/api/auth.api.js" {
  export const AuthAPI: {
    signup: (data: any) => Promise<any>;
    login: (data: any) => Promise<any>;
    getOrganizations: () => Promise<any>;
    getRoles: () => Promise<any>;
  };
}

declare module "@/api/axiosInstance" {
  const AxiosInstance: any;
  export default AxiosInstance;
}

declare module "@/api/user.api" {
  export const UsersAPI: any;
}

declare module "@/api/chat.api" {
  export const ChatAPI: any;
}

declare module "@/api/message.api" {
  export const MessageAPI: any;
}

declare module "@/api/ticket.api" {
  export const TicketAPI: any;
}

declare module "@/api/notification.api" {
  export const NotificationAPI: any;
}

declare module "@/api/admin.api" {
  export const AdminAPI: any;
}
