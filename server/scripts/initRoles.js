import mongoose from 'mongoose';
import Role from '../modules/role/role.schema.js';
import env from '../config/env.js';

const defaultRoles = [
  { role_name: "super_admin", level: 0, status: "active", description: "Platform owner. Creates and manages organizations and all admins." },
  { role_name: "admin", level: 1, status: "active", description: "Organization administrator. Creates branches, branch admins, support users, and customers." },
  { role_name: "branch_admin", level: 2, status: "active", description: "Manages a single branch, its support staff, and customers." },
  { role_name: "support", level: 3, status: "active", description: "Assists customers within their assigned branch." },
  { role_name: "customer", level: 4, status: "active", description: "End user with access only to their own account." },
];

async function initRoles() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const roleData of defaultRoles) {
      const exists = await Role.findOne({ role_name: roleData.role_name });
      if (!exists) {
        await Role.create(roleData);
        console.log(`Created role: ${roleData.role_name} (level ${roleData.level})`);
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
