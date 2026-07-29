import mongoose from 'mongoose';
import Role from '../modules/role/role.schema.js';
import env from '../config/env.js';

async function run() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    
    const roles = await Role.find({});
    for (const role of roles) {
      if (role.role_name !== role.role_name.toLowerCase()) {
        const lowerName = role.role_name.toLowerCase();
        
        const existing = await Role.findOne({ role_name: lowerName, organization_id: role.organization_id });
        if (existing) {
          console.log(`Role ${lowerName} already exists. Deleting ${role.role_name}`);
          await Role.deleteOne({ _id: role._id });
        } else {
          console.log(`Updating role: ${role.role_name} -> ${lowerName}`);
          role.role_name = lowerName;
          await role.save();
        }
      }
    }
    
    console.log('All roles updated to lowercase successfully');
    process.exit(0);
  } catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }
}

run();
