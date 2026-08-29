import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();


import Organization from './modules/organization/organization.schema.js';
import Branch from './modules/branch/branch.schema.js';
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

const DEFAULT_BRANCH = {
  name: 'HQ Branch',
  address: '123 Main St, Tech City',
  contact_number: '123-456-7890',
  status: 'active'
};

const args = process.argv.slice(2);

async function ensureDefaultOrg() {
  return await Organization.findOneAndUpdate(
    { organization_id: DEFAULT_ORG.organization_id },
    { $setOnInsert: DEFAULT_ORG },
    { upsert: true, new: true }
  );
}

async function seedDefault() {
  const org = await ensureDefaultOrg();
  console.log(`Organization ensured: ${org.name}`);

  // Create default branch
  let branch = await Branch.findOne({ organization_id: org._id, name: DEFAULT_BRANCH.name });
  if (!branch) {
    branch = await Branch.create({
      ...DEFAULT_BRANCH,
      organization_id: org._id,
    });
    console.log(`Branch created: ${branch.name}`);
  } else {
    console.log(`Branch ensured: ${branch.name}`);
  }


  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    const needsUpdate =
      existing.organization_id?.toString() !== org._id.toString() ||
      existing.role !== 'super_admin';
    if (needsUpdate) {
      await User.findByIdAndUpdate(existing._id, {
        organization_id: org._id,
        role: 'super_admin',
      });
      console.log(`Super admin updated with fresh org refs: ${ADMIN_EMAIL}`);
    } else {
      console.log(`Super admin already exists: ${ADMIN_EMAIL}`);
    }
  } else {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({
      organization_id: org._id,
      role: 'super_admin',
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

  const email = `${roleName.replace(/\s+/g, '.')}@supportai.com`;
  const password = `${roleName.charAt(0).toUpperCase() + roleName.slice(1)}@123`;
  const name = roleName.charAt(0).toUpperCase() + roleName.slice(1);

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`User already exists: ${email}`);
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  
  // Assign branch to users that need it
  const isBranchScoped = !['super admin', 'admin'].includes(roleName.toLowerCase());
  let branchId = null;
  if (isBranchScoped) {
    const branch = await Branch.findOne({ organization_id: orgId });
    if (branch) branchId = branch._id;
  }

  await User.create({
    organization_id: orgId,
    branch_id: branchId,
    role: roleName.toLowerCase().replace(/\s+/g, '_'),
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