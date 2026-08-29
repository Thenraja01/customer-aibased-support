declare module "@/api/auth.api" {
  export const AuthAPI: {
    signup: (data: any) => Promise<any>;
    login: (data: any) => Promise<any>;
    loginWithOrg: (email: string, password: string, organizationId: string) => Promise<any>;
    refresh: (refreshToken: string) => Promise<any>;
    logout: (data: any) => Promise<any>;
    getOAuthProviders: () => Promise<any>;
    getGoogleAuthUrl: (params: any) => Promise<any>;
    googleCallback: (data: any) => Promise<any>;
    getFacebookAuthUrl: (params: any) => Promise<any>;
    facebookCallback: (data: any) => Promise<any>;
    completeOAuthRegistration: (data: any) => Promise<any>;
    getOrganizations: () => Promise<any>;
    getOrgByDomain: (domain: string) => Promise<any>;
    getRoles: () => Promise<any>;
    getAppSettings: () => Promise<any>;
    registerWithApproval: (data: any) => Promise<any>;
    checkUserStatus: (email: string) => Promise<any>;
    getPendingRegistrations: () => Promise<any>;
    approveRegistration: (userId: string, payload: any) => Promise<any>;
    requestApprovalOTP: (email: string) => Promise<any>;
    verifyApprovalOTP: (email: string, otp: string) => Promise<any>;
    verifyOtp: (email: string, otp: string) => Promise<any>;
    resendOtp: (email: string) => Promise<any>;
    checkStatus: (email: string) => Promise<any>;
    getOtpStatus: (email: string) => Promise<any>;
    forgotPassword: (data: any) => Promise<any>;
    verifyResetOtp: (email: string, otp: string) => Promise<any>;
    resetPassword: (data: any) => Promise<any>;
  };
}

declare module "@/api/auth.api.js" {
  export const AuthAPI: {
    signup: (data: any) => Promise<any>;
    login: (data: any) => Promise<any>;
    loginWithOrg: (email: string, password: string, organizationId: string) => Promise<any>;
    refresh: (refreshToken: string) => Promise<any>;
    logout: (data: any) => Promise<any>;
    getOAuthProviders: () => Promise<any>;
    getGoogleAuthUrl: (params: any) => Promise<any>;
    googleCallback: (data: any) => Promise<any>;
    getFacebookAuthUrl: (params: any) => Promise<any>;
    facebookCallback: (data: any) => Promise<any>;
    completeOAuthRegistration: (data: any) => Promise<any>;
    getOrganizations: () => Promise<any>;
    getOrgByDomain: (domain: string) => Promise<any>;
    getRoles: () => Promise<any>;
    getAppSettings: () => Promise<any>;
    registerWithApproval: (data: any) => Promise<any>;
    checkUserStatus: (email: string) => Promise<any>;
    getPendingRegistrations: () => Promise<any>;
    approveRegistration: (userId: string, payload: any) => Promise<any>;
    requestApprovalOTP: (email: string) => Promise<any>;
    verifyApprovalOTP: (email: string, otp: string) => Promise<any>;
    verifyOtp: (email: string, otp: string) => Promise<any>;
    resendOtp: (email: string) => Promise<any>;
    checkStatus: (email: string) => Promise<any>;
    getOtpStatus: (email: string) => Promise<any>;
    forgotPassword: (data: any) => Promise<any>;
    verifyResetOtp: (email: string, otp: string) => Promise<any>;
    resetPassword: (data: any) => Promise<any>;
  };
}

declare module "@/api/axiosInstance" {
  const AxiosInstance: any;
  export const AUTH_TOKEN_EVENT: string;
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
