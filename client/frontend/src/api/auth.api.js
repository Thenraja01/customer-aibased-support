import AxiosInstance from "./axiosInstance.ts";

const BASE_URL = "/auth/v1";

export const AuthAPI = {
  // ── Standard auth ─────────────────────────────────────────────
  signup: async (data) => {
    try {
      const response = await AxiosInstance.post(`${BASE_URL}/register`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  login: async (data) => {
    try {
      const response = await AxiosInstance.post(`${BASE_URL}/login`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Rotate a refresh token into a fresh access token.
   * Returns: { accessToken, refreshToken, user }
   */
  refresh: async (refreshToken) => {
    try {
      const response = await AxiosInstance.post(`${BASE_URL}/refresh`, { refreshToken });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Revoke a refresh session server-side (fires before local cleanup).
   */
  logout: async (refreshToken) => {
    try {
      const response = await AxiosInstance.post(`${BASE_URL}/logout`, { refreshToken });
      return response;
    } catch (error) {
      throw error;
    }
  },

  loginWithOrg: async (email, password, organizationId) => {
    try {
      const response = await AxiosInstance.post(`${BASE_URL}/login`, {
        email,
        password,
        organization_id: organizationId,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  getOrganizations: async () => {
    try {
      const response = await AxiosInstance.get(`${BASE_URL}/organizations`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  getOrgByDomain: async (domain) => {
    try {
      const response = await AxiosInstance.get(`${BASE_URL}/organizations/by-domain`, { params: { domain } });
      return response;
    } catch (error) {
      throw error;
    }
  },

  getRoles: async () => {
    try {
      const response = await AxiosInstance.get(`${BASE_URL}/roles`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  getAppSettings: async () => {
    try {
      const response = await AxiosInstance.get(`${BASE_URL}/app-settings`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // ── Admin Approval Workflow ────────────────────────────────────

  /**
   * Register a new user with status "pending" for admin approval.
   */
  registerWithApproval: async (data) => {
    try {
      const response = await AxiosInstance.post(`${BASE_URL}/register-with-approval`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check the current approval status of a user by email.
   * Returns: { status, name, email, approved_at, rejection_reason }
   */
  checkUserStatus: async (email) => {
    try {
      const response = await AxiosInstance.get(`${BASE_URL}/check-user-status`, {
        params: { email },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all pending registrations (admin only).
   */
  getPendingRegistrations: async () => {
    try {
      const response = await AxiosInstance.get(`${BASE_URL}/pending-registrations`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Approve or reject a pending registration (admin only).
   * @param {string} userId
   * @param {{ action: "approve" | "reject", rejection_reason?: string }} payload
   */
  approveRegistration: async (userId, payload) => {
    try {
      const response = await AxiosInstance.post(
        `${BASE_URL}/approve-registration/${userId}`,
        payload
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Request an OTP email for account activation (after admin approval).
   */
  requestApprovalOTP: async (email) => {
    try {
      const response = await AxiosInstance.post(`${BASE_URL}/otp/request-approval`, { email });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verify the approval OTP and activate the user account.
   * On success the user status becomes "active" and they can login.
   */
  verifyApprovalOTP: async (email, otp) => {
    try {
      const response = await AxiosInstance.post(`${BASE_URL}/otp/verify-approval`, { email, otp });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Shorthand — verify OTP during activation flow.
   */
  verifyOtp: async (email, otp) => {
    return AuthAPI.verifyApprovalOTP(email, otp);
  },

  /**
   * Shorthand — resend activation OTP.
   */
  resendOtp: async (email) => {
    return AuthAPI.requestApprovalOTP(email);
  },

  /**
   * Get the current OTP guard state for an email (resend countdown, lockout,
   * active OTP expiry). Used by the forgot/reset-password pages.
   */
  getOtpStatus: async (email) => {
    try {
      const response = await AxiosInstance.get(`${BASE_URL}/otp-status/${encodeURIComponent(email)}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Shorthand — check registration status by email.
   */
  checkStatus: async (email) => {
    return AuthAPI.checkUserStatus(email);
  },

  // ── OAuth Methods ──────────────────────────────────────────────
  
  getOAuthProviders: async () => {
    try {
      const response = await AxiosInstance.get(`${BASE_URL}/oauth/providers`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  getGoogleAuthUrl: async (params) => {
    try {
      const response = await AxiosInstance.get(`${BASE_URL}/oauth/google/url`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  getFacebookAuthUrl: async (params) => {
    try {
      const response = await AxiosInstance.get(`${BASE_URL}/oauth/facebook/url`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  googleCallback: async (data) => {
    try {
      const response = await AxiosInstance.post(`${BASE_URL}/oauth/google/callback`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

   facebookCallback: async (data) => {
     try {
       const response = await AxiosInstance.post(`${BASE_URL}/oauth/facebook/callback`, data);
       return response;
     } catch (error) {
       throw error;
     }
   },

   /**
    * Get roles requestable for a specific organization (for OAuth registration completion).
    * Falls back to all roles if the org-scoped endpoint is unavailable.
    */
   getRequestableRoles: async (orgId) => {
     try {
       const response = await AxiosInstance.get(`${BASE_URL}/roles/requestable/${orgId}`);
       return response;
     } catch (error) {
       throw error;
     }
   },

   /**
    * Complete OAuth registration by selecting org + role.
    * Body: { oauthToken, organization_id, requested_role }
    */
   completeOAuthRegistration: async (data) => {
     try {
       const response = await AxiosInstance.post(`${BASE_URL}/oauth/complete`, data);
       return response;
     } catch (error) {
       throw error;
     }
   },

  // ── Password Reset Methods ──────────────────────────────────────
  
  forgotPassword: async (email) => {
    try {
      const response = await AxiosInstance.post(`${BASE_URL}/forgot-password`, { email });
      return response;
    } catch (error) {
      throw error;
    }
  },

  verifyResetOtp: async (email, otp) => {
    try {
      const response = await AxiosInstance.post(`${BASE_URL}/verify-reset-otp`, { email, otp });
      return response;
    } catch (error) {
      throw error;
    }
  },

  resetPassword: async (email, otp, newPassword) => {
    try {
      const response = await AxiosInstance.post(`${BASE_URL}/reset-password`, { email, otp, newPassword });
      return response;
    } catch (error) {
      throw error;
    }
  },

  verify2FA: async (email, otp) => {
    try {
      const response = await AxiosInstance.post(`${BASE_URL}/login/verify-2fa`, { email, otp });
      return response;
    } catch (error) {
      throw error;
    }
  },

  request2FAOTP: async (email) => {
    try {
      const response = await AxiosInstance.post(`${BASE_URL}/login/request-2fa`, { email });
      return response;
    } catch (error) {
      throw error;
    }
  },
};
