import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

import Role from './modules/role/role.schema.js';
import Organization from './modules/organization/organization.schema.js';
import User from './modules/user/user.schema.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/supportai';

const ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'superadmin@supportai.com';
const ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'Super@123';
const ADMIN_NAME = process.env.SUPER_ADMIN_NAME || 'Super Admin';

const DEFAULT_ORG = {
  organization_id: 'DEFAULT',
  name: 'Default Organization',
  email: 'default@supportai.com',
  phone: '000-0000',
  status: 'active',
  domain: '',
};

const args = process.argv.slice(2);

async function ensureDefaultOrg() {
  return await Organization.findOneAndUpdate(
    { organization_id: DEFAULT_ORG.organization_id },
    { $setOnInsert: DEFAULT_ORG },
    { upsert: true, new: true }
  );
}

async function ensureSuperAdminRole() {
  return await Role.findOneAndUpdate(
    { role_name: 'super admin' },
    { $setOnInsert: { permissions: ['*'], status: 'active', description: 'Super administrator with full system access' } },
    { upsert: true, new: true }
  );
}

async function createRole(roleName) {
  const role = await Role.findOneAndUpdate(
    { role_name: roleName },
    { $setOnInsert: { permissions: [], status: 'active', description: `${roleName} role` } },
    { upsert: true, new: true }
  );
  console.log(`Role created: ${role.role_name}`);
  return role;
}

async function seedDefault() {
  const role = await ensureSuperAdminRole();
  console.log(`Role ensured: ${role.role_name}`);

  const org = await ensureDefaultOrg();
  console.log(`Organization ensured: ${org.name}`);

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    const needsUpdate =
      existing.organization_id?.toString() !== org._id.toString() ||
      existing.role_id?.toString() !== role._id.toString();
    if (needsUpdate) {
      await User.findByIdAndUpdate(existing._id, {
        organization_id: org._id,
        role_id: role._id,
      });
      console.log(`Super admin updated with fresh org/role refs: ${ADMIN_EMAIL}`);
    } else {
      console.log(`Super admin already exists: ${ADMIN_EMAIL}`);
    }
  } else {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({
      organization_id: org._id,
      role_id: role._id,
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashed,
      auth_type: 'local',
      status: 'active',
    });
    console.log(`Super admin created: ${ADMIN_EMAIL}`);
  }
}

async function createUser(roleName, orgId) {
  const role = await Role.findOne({ role_name: roleName });
  if (!role) {
    console.error(`Role "${roleName}" not found. Create it first.`);
    return;
  }

  const email = `${roleName.replace(/\s+/g, '.')}@supportai.com`;
  const password = `${roleName.charAt(0).toUpperCase() + roleName.slice(1)}@123`;
  const name = roleName.charAt(0).toUpperCase() + roleName.slice(1);

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`User already exists: ${email}`);
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  await User.create({
    organization_id: orgId,
    role_id: role._id,
    name,
    email,
    password: hashed,
    auth_type: 'local',
    status: 'active',
  });
  console.log(`User created: ${email} / ${password}`);
}
async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    if (args.length === 0) {
      await seedDefault();
      console.log('Done');
      process.exit(0);
    }

    const command = args[0];

    if (command === 'role') {
      const roleNames =
        args.length > 1
          ? args.slice(1)
          : ['admin', 'support', 'branchadmin', 'customer'];

      for (const name of roleNames) {
        await createRole(name);
      }
    } else if (command === 'user') {
      const roleNames =
        args.length > 1
          ? args.slice(1)
          : ['admin', 'support', 'branchadmin', 'customer'];

      const org = await Organization.findOne({
        organization_id: DEFAULT_ORG.organization_id,
      });

      if (!org) {
        console.error('Default organization not found. Run seed first.');
        process.exit(1);
      }

      for (const name of roleNames) {
        await createUser(name, org._id);
      }
    } else {
      console.log('Usage:');
      console.log('  node seed.js                          - Seed super admin + default org');
      console.log('  node seed.js role                     - Create default roles');
      console.log('  node seed.js role admin support       - Create specific roles');
      console.log('  node seed.js user                     - Create default users');
      console.log('  node seed.js user admin support       - Create users for specific roles');
      process.exit(1);
    }

    console.log('Done');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
}

main();