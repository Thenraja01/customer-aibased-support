import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './schema/user.schema.js';
import Role from './schema/role.schema.js';
import Organization from './schema/Organizations.schema.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/customer-support-system";

async function seed() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to database.');

    // 1. Create Organization
    let defaultOrg = await Organization.findOne({ email: 'system@admin.com' });
    if (!defaultOrg) {
      defaultOrg = new Organization({
        organization_id: 'ORG-SYS-001',
        name: 'System Organization',
        email: 'system@admin.com',
        phone: '1234567890',
        address: 'HQ'
      });
      await defaultOrg.save();
      console.log('Default organization created.');
    } else {
      console.log('Default organization already exists.');
    }

    // 2. Create Roles
    const rolesToCreate = ['super_admin', 'admin', 'customer'];
    for (const roleName of rolesToCreate) {
      const existingRole = await Role.findOne({ role_name: roleName });
      if (!existingRole) {
        await Role.create({ role_name: roleName });
        console.log(`Role ${roleName} created.`);
      } else {
        console.log(`Role ${roleName} already exists.`);
      }
    }

    // 3. Create Super Admin User
    const superAdminRole = await Role.findOne({ role_name: 'super_admin' });
    let superAdmin = await User.findOne({ email: 'superadmin@admin.com' });
    
    if (!superAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123', salt);

      superAdmin = new User({
        organization_id: defaultOrg._id,
        role_id: superAdminRole._id,
        name: 'Super Admin',
        email: 'superadmin@admin.com',
        password: hashedPassword,
        auth_type: 'local',
        status: 'active'
      });
      await superAdmin.save();
      console.log('Super admin user created successfully. Email: superadmin@admin.com, Password: Admin@123');
    } else {
      console.log('Super admin user already exists.');
    }

    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
