import mongoose from 'mongoose';
import User from '../modules/user/user.schema.js';
import Role from '../modules/role/role.schema.js';
import env from '../config/env.js';

async function updateUserToAdmin() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = process.argv[2] || 'superadmin@admin.com';

    const adminRole = await Role.findOne({ role_name: 'super admin' });
    if (!adminRole) {
      console.error('Super admin role not found. Run node scripts/initRoles.js first.');
      process.exit(1);
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.error(`User not found: ${email}`);
      process.exit(1);
    }

    user.role_id = adminRole._id;
    user.status = 'active';
    await user.save();

    console.log(`User ${email} updated to super admin role`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to update user:', error.message);
    process.exit(1);
  }
}

updateUserToAdmin();