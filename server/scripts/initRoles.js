import mongoose from 'mongoose';
import Role from '../modules/role/role.schema.js';
import env from '../config/env.js';

const defaultRoles = [
  { role_name: "super admin", permissions: ["*"], status: "active", description: "Super administrator with full system access" },
  { role_name: "tenant admin", permissions: ["manage_documents", "manage_users", "manage_document_types", "view_analytics", "manage_organizations"], status: "active", description: "Tenant administrator with limited system access" },
  { role_name: "admin", permissions: ["manage_documents", "manage_users", "manage_faq", "view_analytics"], status: "active", description: "Organization admin with management permissions" },
  { role_name: "support", permissions: ["view_tickets", "manage_tickets", "view_documents", "view_faq", "view_chats"], status: "active", description: "Support agent with ticket and chat access" },
  { role_name: "user", permissions: ["view_documents", "upload_documents", "view_own_profile"], status: "active", description: "Regular user with basic access" }
];

async function initRoles() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const roleData of defaultRoles) {
      const exists = await Role.findOne({ role_name: roleData.role_name });
      if (!exists) {
        await Role.create(roleData);
        console.log(`Created role: ${roleData.role_name}`);
      } else {
        console.log(`Role already exists: ${roleData.role_name}`);
      }
    }

    console.log('Roles initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize roles:', error.message);
    process.exit(1);
  }
}

initRoles();