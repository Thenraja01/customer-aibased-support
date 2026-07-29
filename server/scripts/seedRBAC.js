import mongoose from "mongoose";
import dotenv from "dotenv";
import { initializeRoles } from "../modules/role/role.service.js";
import { dbconnection } from "../config/db.js";

dotenv.config();

const seedRBAC = async () => {
  try {
    console.log("🔄 Connecting to database...");
    await dbconnection();
    console.log("✅ Database connected");

    // Permissions are defined in `utils/permissions.js` (the code registry) and
    // are never stored in the database — nothing to seed for them.

    console.log("\n🔄 Initializing default roles...");
    const roleResults = await initializeRoles();
    console.log(`✅ Roles initialized: ${roleResults.length} roles`);

    const createdRoles = roleResults.filter(r => r.created).length;
    console.log(`   - Created: ${createdRoles}`);
    console.log(`   - Existing: ${roleResults.length - createdRoles}`);

    console.log("\n🎉 RBAC seeding completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   - Total Roles: ${roleResults.length}`);
    console.log("\n💡 Next steps:");
    console.log("   1. Create organizations via API or admin panel");
    console.log("   2. Each organization will get default roles automatically");
    console.log("   3. Assign roles to users during registration or via admin panel");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding RBAC:", error.message);
    process.exit(1);
  }
};

seedRBAC();
