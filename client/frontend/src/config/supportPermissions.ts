export interface SupportPermissions {
  viewAllChats: boolean;
  viewBranchChats: boolean;
  replyToCustomer: boolean;
  addInternalNote: boolean;
  assignAgent: boolean;
  reassignAgent: boolean;
  escalateChat: boolean;
  convertToTicket: boolean;
  viewAIIntelligence: boolean;
  monitorChat: boolean;
}

export type UserSupportRole = "admin" | "super_admin" | "branch_admin" | "support" | "customer";

export const getRoleSupportPermissions = (roleInput?: string | null): SupportPermissions => {
  const role = (roleInput || "").toLowerCase();

  switch (role) {
    case "admin":
    case "super_admin":
      return {
        viewAllChats: true,
        viewBranchChats: true,
        replyToCustomer: false, // Supervisory mode by default: no direct public reply to customer
        addInternalNote: true,
        assignAgent: true,
        reassignAgent: true,
        escalateChat: true,
        convertToTicket: true,
        viewAIIntelligence: true,
        monitorChat: true,
      };

    case "branch_admin":
      return {
        viewAllChats: false,
        viewBranchChats: true,
        replyToCustomer: false, // Optional / controlled for branch admin
        addInternalNote: true,
        assignAgent: true,
        reassignAgent: true,
        escalateChat: true,
        convertToTicket: true,
        viewAIIntelligence: true,
        monitorChat: true,
      };

    case "support":
      return {
        viewAllChats: false,
        viewBranchChats: true,
        replyToCustomer: true, // Primary handler for live chats
        addInternalNote: true,
        assignAgent: false,
        reassignAgent: false,
        escalateChat: true,
        convertToTicket: true,
        viewAIIntelligence: true,
        monitorChat: false,
      };

    case "customer":
    default:
      return {
        viewAllChats: false,
        viewBranchChats: false,
        replyToCustomer: true, // Own chat
        addInternalNote: false, // Hidden from customer
        assignAgent: false,
        reassignAgent: false,
        escalateChat: false,
        convertToTicket: false,
        viewAIIntelligence: false,
        monitorChat: false,
      };
  }
};
