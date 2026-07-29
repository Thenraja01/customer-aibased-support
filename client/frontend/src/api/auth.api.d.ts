declare module "@/api/auth.api" {
  export const AuthAPI: {
    signup: (data: any) => Promise<any>;
    login: (data: any) => Promise<any>;
    loginWithOrg: (email: string, password: string, organizationId: string) => Promise<any>;
    refresh: (refreshToken: string) => Promise<any>;
    logout: (refreshToken: string) => Promise<any>;
    getOrganizations: () => Promise<any>;
    getOrgByDomain: (domain: string) => Promise<any>;
    getRoles: () => Promise<any>;
    getAppSettings: () => Promise<any>;
    registerWithApproval: (data: any) => Promise<any>;
    checkUserStatus: (email: string) => Promise<any>;
    getPendingRegistrations: () => Promise<any>;
    approveRegistration: (userId: string, payload: { action: "approve" | "reject"; rejection_reason?: string }) => Promise<any>;
    requestApprovalOTP: (email: string) => Promise<any>;
    verifyApprovalOTP: (email: string, otp: string) => Promise<any>;
    verifyOtp: (email: string, otp: string) => Promise<any>;
    resendOtp: (email: string) => Promise<any>;
    checkStatus: (email: string) => Promise<any>;
    getOtpStatus: (email: string) => Promise<any>;
    getOAuthProviders: () => Promise<any>;
    getGoogleAuthUrl: (params: any) => Promise<any>;
    getFacebookAuthUrl: (params: any) => Promise<any>;
    googleCallback: (data: any) => Promise<any>;
    facebookCallback: (data: any) => Promise<any>;
    getRequestableRoles: (orgId: string) => Promise<any>;
    completeOAuthRegistration: (data: { oauthToken: string; organization_id: string; requested_role: string }) => Promise<any>;
    forgotPassword: (email: string) => Promise<any>;
    verifyResetOtp: (email: string, otp: string) => Promise<any>;
    resetPassword: (email: string, otp: string, newPassword: string) => Promise<any>;
  };
}
