import AxiosInstance from "./axiosInstance.js";

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
};
